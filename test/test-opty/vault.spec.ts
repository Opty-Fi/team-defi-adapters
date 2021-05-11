import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { setUp } from "./setup";
import { CONTRACTS } from "../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, REWARD_TOKENS, ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { TypedAdapterStrategies } from "../../helpers/data";
import { getSoliditySHA3Hash, delay } from "../../helpers/utils";
import { deployVault } from "../../helpers/contracts-deployments";
import {
  setBestBasicStrategy,
  approveLiquidityPoolAndMapAdapter,
  fundWalletToken,
  getBlockTimestamp,
  getTokenName,
  getTokenSymbol,
  approveVaultRewardTokens,
} from "../../helpers/contracts-actions";
import scenario from "./scenarios/vault.json";
import { getContractInstance, deployContract } from "../../helpers/helpers";

type ARGUMENTS = {
  contractName?: string;
  amount?: { [key: string]: string };
  hold?: number;
  convert?: number;
  vaultRewardStrategy?: number[];
  vaultRewardTokenInvalidHash?: string;
};

type EXPECTED_ARGUMENTS = {
  balance?: string;
  vaultRewardStrategy?: number[];
};

describe(scenario.title, () => {
  // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
  let essentialContracts: CONTRACTS;
  let adapters: CONTRACTS;
  const contracts: CONTRACTS = {};
  let users: Signer[];
  before(async () => {
    try {
      users = await hre.ethers.getSigners();
      [essentialContracts, adapters] = await setUp(users[0]);
      assert.isDefined(essentialContracts, "Essential contracts not deployed");
      assert.isDefined(adapters, "Adapters not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < scenario.vaults.length; i++) {
    describe(`${scenario.vaults[i].name}`, async () => {
      let Vault: Contract;
      const vault = scenario.vaults[i];
      const profile = vault.profile;
      const adaptersName = Object.keys(TypedAdapterStrategies);

      const adapterName = adaptersName[0];
      const strategies = TypedAdapterStrategies[adaptersName[0]];

      for (let i = 0; i < strategies.length; i++) {
        describe(`${strategies[i].strategyName}`, async () => {
          const TOKEN_STRATEGY = strategies[i];
          const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[TOKEN_STRATEGY.token]]]);
          const rewardTokenAdapterNames = Object.keys(REWARD_TOKENS).map(rewardTokenAdapterName =>
            rewardTokenAdapterName.toLowerCase(),
          );
          let underlyingTokenName: string;
          let underlyingTokenSymbol: string;
          before(async () => {
            underlyingTokenName = await getTokenName(hre, TOKEN_STRATEGY.token);
            underlyingTokenSymbol = await getTokenSymbol(hre, TOKEN_STRATEGY.token);
            const adapter = adapters[adapterName];

            await approveLiquidityPoolAndMapAdapter(
              users[0],
              essentialContracts.registry,
              adapter.address,
              TOKEN_STRATEGY.strategy[0].contract,
            );

            await setBestBasicStrategy(
              TOKEN_STRATEGY.strategy,
              tokensHash,
              essentialContracts.registry,
              essentialContracts.strategyProvider,
              profile,
            );

            const Token_ERC20Instance = await getContractInstance(hre, "ERC20", TOKENS[TOKEN_STRATEGY.token]);

            contracts["erc20"] = Token_ERC20Instance;
          });
          beforeEach(async () => {
            const opty = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY, false, users[0], [
              essentialContracts["registry"].address,
              0,
            ]);

            const optyMinter = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY_MINTER, false, users[0], [
              essentialContracts["registry"].address,
              opty.address,
            ]);

            Vault = await deployVault(
              hre,
              essentialContracts.registry.address,
              essentialContracts.riskManager.address,
              essentialContracts.strategyManager.address,
              optyMinter.address,
              TOKENS[TOKEN_STRATEGY.token],
              users[0],
              users[1],
              underlyingTokenName,
              underlyingTokenSymbol,
              profile,
              TESTING_DEPLOYMENT_ONCE,
            );

            if (rewardTokenAdapterNames.includes(adapterName.toLowerCase())) {
              await approveVaultRewardTokens(
                users[0],
                Vault.address,
                <string>REWARD_TOKENS[adapterName].tokenAddress,
                essentialContracts.registry,
              );
            }
            contracts["vault"] = Vault;
          });
          for (let i = 0; i < vault.stories.length; i++) {
            const story = vault.stories[i];
            it(story.description, async () => {
              for (let i = 0; i < story.activities.length; i++) {
                const activity = story.activities[i];
                const userIndexes = activity.userIndexes;
                for (let i = 0; i < userIndexes.length; i++) {
                  const userIndex = userIndexes[i];
                  for (let i = 0; i < activity.actions.length; i++) {
                    const action = activity.actions[i];
                    switch (action.action) {
                      case "fundWallet": {
                        const { amount }: ARGUMENTS = action.args;
                        try {
                          if (amount) {
                            const timestamp = (await getBlockTimestamp(hre)) * 2;
                            await fundWalletToken(
                              hre,
                              TOKENS[TOKEN_STRATEGY.token],
                              users[userIndex],
                              BigNumber.from(amount[TOKEN_STRATEGY.token]),
                              timestamp,
                            );
                          }
                        } catch (error) {
                          if (action.expect === "success") {
                            assert.isUndefined(error);
                          } else {
                            expect(error.message).to.equal(
                              `VM Exception while processing transaction: revert ${action.message}`,
                            );
                          }
                        }
                        assert.isDefined(amount, `args is wrong in ${action.action} testcase`);
                        break;
                      }
                      case "approve(address,uint256)": {
                        const { contractName, amount }: ARGUMENTS = action.args;
                        try {
                          if (contractName && amount) {
                            await contracts[action.contract]
                              .connect(users[userIndex])
                              [action.action](contracts[contractName].address, amount[TOKEN_STRATEGY.token]);
                          }
                        } catch (error) {
                          if (action.expect === "success") {
                            assert.isUndefined(error);
                          } else {
                            expect(error.message).to.equal(
                              `VM Exception while processing transaction: revert ${action.message}`,
                            );
                          }
                        }
                        assert.isDefined(contractName, `args is wrong in ${action.action} testcase`);
                        assert.isDefined(amount, `args is wrong in ${action.action} testcase`);
                        break;
                      }
                      case "userDepositRebalance(uint256)":
                      case "userWithdrawRebalance(uint256)":
                      case "userDeposit(uint256)": {
                        const { amount }: ARGUMENTS = action.args;
                        if (action.action === "userWithdrawRebalance(uint256)") {
                          await delay(200);
                        }
                        try {
                          if (amount) {
                            await contracts[action.contract]
                              .connect(users[userIndex])
                              [action.action](amount[TOKEN_STRATEGY.token]);
                          }
                        } catch (error) {
                          if (action.expect === "success") {
                            assert.isUndefined(error);
                          } else {
                            expect(error.message).to.equal(
                              `VM Exception while processing transaction: revert ${action.message}`,
                            );
                          }
                        }
                        assert.isDefined(amount, `args is wrong in ${action.action} testcase`);
                        break;
                      }
                      case "rebalance()": {
                        try {
                          await contracts[action.contract].connect(users[userIndex])[action.action]();
                        } catch (error) {
                          if (action.expect === "success") {
                            assert.isUndefined(error);
                          } else {
                            expect(error.message).to.equal(
                              `VM Exception while processing transaction: revert ${action.message}`,
                            );
                          }
                        }
                        break;
                      }
                    }
                  }
                }
              }
            }).timeout(100000);
          }
        });
      }
    });
  }
});
