import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { setUp } from "./setup";
import { CONTRACTS } from "../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, REWARD_TOKENS } from "../../helpers/constants";
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
import scenario from "./scenarios/vault-reward-token-strategy.json";

type ARGUMENTS = {
  address?: string;
  addressName?: string;
  fee?: string;
  amount?: { [key: string]: string };
  hold?: number;
  convert?: number;
  bytesName?: string;
  addressNames?: string[];
  vaultRewardStrategy?: number[];
  vaultRewardTokenInvalidHash?: string;
};

type EXPECTED_ARGUMENTS = {
  balance?: string
  vaultRewardStrategy?: number[];
}

describe(scenario.title, () => {
  // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
  let essentialContracts: CONTRACTS;
  let adapters: CONTRACTS;
  const contracts: CONTRACTS = {};
  let users: { [key: string]: Signer };
  before(async () => {
    try {
      const [owner, admin, user1, user2] = await hre.ethers.getSigners();
      users = { owner, admin, user1, user2 };
      [essentialContracts, adapters] = await setUp(owner);
      assert.isDefined(essentialContracts, "Essential contracts not deployed");
      assert.isDefined(adapters, "Adapters not deployed");
      contracts["registry"] = essentialContracts["registry"];
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < scenario.vaults.length; i++) {
    describe(`${scenario.vaults[i].name}`, async () => {
      let Vault: Contract;
      const vault = scenario.vaults[i]; //  RP1Vault
      // const stories = vault.stories;
      const profile = vault.profile; //  RP1
      const adaptersName = Object.keys(TypedAdapterStrategies);

      for (let i = 0; i < adaptersName.length; i++) {
      // for (let i = 0; i < 1; i++) {
        const adapterName = adaptersName[i];
        console.log("Adapter: ", adapterName);
        const strategies = TypedAdapterStrategies[adaptersName[i]];

        for (let i = 0; i < strategies.length; i++) {
          // for (let i = 0; i < 1; i++) {
          describe(`${strategies[i].strategyName}`, async () => {
            const TOKEN_STRATEGY = strategies[i];
            const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[TOKEN_STRATEGY.token]]]);
            const rewardTokenAdapterNames = Object.keys(REWARD_TOKENS);
            let investStrategyHash: any;
            let vaultRewardTokenHash: string;
            let underlyingTokenName: string;
            let underlyingTokenSymbol: string;

            before(async () => {
              underlyingTokenName = await getTokenName(hre, TOKEN_STRATEGY.token);
              underlyingTokenSymbol = await getTokenSymbol(hre, TOKEN_STRATEGY.token);
              const adapter = adapters[adapterName];
              Vault = await deployVault(
                hre,
                essentialContracts.registry.address,
                essentialContracts.riskManager.address,
                essentialContracts.strategyManager.address,
                essentialContracts.optyMinter.address,
                TOKENS[TOKEN_STRATEGY.token],
                users["owner"],
                users["admin"],
                underlyingTokenName,
                underlyingTokenSymbol,
                profile,
                TESTING_DEPLOYMENT_ONCE,
              );
              if (rewardTokenAdapterNames.includes(adapterName)) {
                console.log("APproving reward tokens");
                await approveVaultRewardTokens(
                  users["owner"],
                  Vault.address,
                  <string>REWARD_TOKENS[adapterName].tokenAddress,
                  essentialContracts.registry,
                );
                console.log("Approved reward tokens");
              }

              await approveLiquidityPoolAndMapAdapter(
                users["owner"],
                essentialContracts.registry,
                adapter.address,
                TOKEN_STRATEGY.strategy[0].contract,
              );

              investStrategyHash = await setBestBasicStrategy(
                TOKEN_STRATEGY.strategy,
                tokensHash,
                essentialContracts.registry,
                essentialContracts.strategyProvider,
                profile,
              );
              console.log("Invest Strategy Hash: ", investStrategyHash);
              // process.exit(2)

              const ERC20Instance = await hre.ethers.getContractAt("ERC20", TOKENS[TOKEN_STRATEGY.token]);
              contracts["vault"] = Vault;
              contracts["erc20"] = ERC20Instance;
              contracts["adapter"] = adapter;
              contracts["strategyProvider"] = essentialContracts.strategyProvider;
              contracts["riskManager"] = essentialContracts.riskManager;
              console.log("Out Strategy Provider address: ", contracts["strategyProvider"].address);
            });

            // for (let i = 0; i < vault.stories.length; i++) {
            for (let i = 0; i < 10; i++) {
              // for (let i = 0; i < 1; i++) {
              const story = vault.stories[i];
              it(story.description, async () => {
                for (let j = 0; j < story.setActions.length; j++) {
                  const action = story.setActions[j];
                  switch (action.action) {
                    case "setVaultRewardStrategy(bytes32,(uint256,uint256))": {
                      const { vaultRewardTokenInvalidHash, vaultRewardStrategy }: ARGUMENTS = action.args;
                      try {
                        // const rewardTokenAdapters = Object.keys(REWARD_TOKENS);
                        if (rewardTokenAdapterNames.includes(adapterName)) {
                          console.log("Reward  Token adapter name: ", adapterName);
                          if (Array.isArray(vaultRewardStrategy) && vaultRewardStrategy.length > 0) {
                            console.log("Setting vault reward token strategy");
                            console.log("Vault Reward Strategy: ", vaultRewardStrategy);

                            vaultRewardTokenHash = getSoliditySHA3Hash(
                              ["address[]"],
                              [[Vault.address, REWARD_TOKENS[adapterName].tokenAddress]],
                            );
                            console.log("Vault RewardToken hash: ", vaultRewardTokenHash);

                            console.log("Setting vault reward token strategy");

                            console.log("Inside Strategy Provider address: ", contracts[action.contract].address);
                            await contracts[action.contract]
                              .connect(users[action.executer])
                              [action.action](
                                vaultRewardTokenInvalidHash ? vaultRewardTokenInvalidHash : vaultRewardTokenHash,
                                vaultRewardStrategy,
                              );
                            console.log("vault reward token strategy set");

                            const vrtSfromRm = await essentialContracts.riskManager.getVaultRewardTokenStrategy(
                              vaultRewardTokenInvalidHash ? vaultRewardTokenInvalidHash : vaultRewardTokenHash,
                            );
                            console.log("vrtS from RM: ", vrtSfromRm);
                          }
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

                      assert.isDefined(vaultRewardStrategy, `args is wrong in ${action.action} testcase`);
                      break;
                    }
                    case "fundWallet": {
                      const { addressName, amount }: ARGUMENTS = action.args;
                      try {
                        if (addressName && amount) {
                          const timestamp = (await getBlockTimestamp(hre)) * 2;
                          console.log("Funding user1 with DAI");
                          await fundWalletToken(
                            hre,
                            TOKENS[TOKEN_STRATEGY.token],
                            users[addressName],
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
                      assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
                      assert.isDefined(amount, `args is wrong in ${action.action} testcase`);
                      break;
                    }
                    case "approve(address,uint256)": {
                      const { addressName, amount }: ARGUMENTS = action.args;
                      try {
                        if (addressName && amount) {
                          console.log("Approving Vault contract on behalf of user for DAI");
                          await contracts[action.contract]
                            .connect(users[action.executer])
                            [action.action](contracts[addressName].address, amount[TOKEN_STRATEGY.token]);
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
                      assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
                      assert.isDefined(amount, `args is wrong in ${action.action} testcase`);
                      break;
                    }
                    case "harvest(bytes32)": {
                      try {
                        if (investStrategyHash) {
                          console.log("Calling Action: ", action.action);
                          await contracts[action.contract]
                            .connect(users[action.executer])
                            [action.action](investStrategyHash);
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
                      // assert.isDefined(amount, `args is wrong in ${action.action} testcase`);
                      break;
                    }
                    case "userDepositRebalance(uint256)":
                    case "userWithdrawRebalance(uint256)": {
                      const { amount }: ARGUMENTS = action.args;

                      if (action.action === "userWithdrawRebalance(uint256)") {
                        await delay(200);
                      }
                      try {
                        if (amount) {
                          console.log("Calling Action: ", action.action);
                          await contracts[action.contract]
                            .connect(users[action.executer])
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
                  }
                }
                for (let j = 0; j < story.getActions.length; j++) {
                  const action = story.getActions[j];
                  switch (action.action) {
                    case "getVaultRewardTokenStrategy(bytes32)":
                    case "vaultRewardTokenHashToVaultRewardTokenStrategy(bytes32)": {
                      const { vaultRewardTokenInvalidHash }: ARGUMENTS = action.args;
                      const { vaultRewardStrategy }: EXPECTED_ARGUMENTS = action.expectedValue;
                      // const expectedValue: EXPECTED_ARGS | {} = action["expectedValue"]["vaultRewardStrategy"];
                      try {
                        if (rewardTokenAdapterNames.includes(adapterName)) {
                          console.log("Vault Reward Token hash in get strategy provider: ", vaultRewardTokenHash);
                          const value = await contracts[action.contract][action.action](
                            vaultRewardTokenInvalidHash ? vaultRewardTokenInvalidHash : vaultRewardTokenHash,
                          );
                          console.log("Ratings: ", value);
                          expect([+value[0]._hex, +value[1]._hex]).to.have.members(
                            <number[]>vaultRewardStrategy,
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
                      break;
                    }
                    case "balanceOf(address)": {
                      const { address, addressName }: ARGUMENTS = action.args;
                      const { balance }: EXPECTED_ARGUMENTS = action.expectedValue;
                      if (address) {
                        const value = await contracts[action.contract][action.action](address);
                        expect(+value).to.gte(+action.expectedValue);
                      } else if (addressName) {
                        console.log("Checking reward token balance");
                        // const address = users[addressName].getAddress();
                        if (rewardTokenAdapterNames.includes(adapterName)) {
                          console.log("Reward token adapter for balance: ", adapterName);
                          const COMP_ERC20Instance = await hre.ethers.getContractAt(
                            "ERC20",
                            <string>REWARD_TOKENS[adapterName].tokenAddress,
                          );
                          const comp_value = await COMP_ERC20Instance.balanceOf(Vault.address);
                          console.log("Comp value: ", +comp_value);
                          // const value = await contracts[action.contract][action.action](address);
                          <string>balance == ">0"
                            ? REWARD_TOKENS[adapterName].distributionActive
                              ? assert.isAbove(+comp_value, +"0", "Vault should hold some reward tokens")
                              : expect(+comp_value).to.equal(+"0")
                            : expect(+comp_value).to.equal(+<string>balance);
                        }
                      }
                      break;
                    }
                  }
                }
              }).timeout(100000);
            }
          });
        }
      }
    });
  }
});
