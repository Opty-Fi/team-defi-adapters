import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { setUp } from "./setup";
import { CONTRACTS } from "../../helpers/type";
import { executeFunc } from "../../helpers/helpers";
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
} from "../../helpers/contracts-actions";
// import scenario from "./scenarios/withdrawal-fee.json";
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
};

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
      // for (let i = 0; i < 2; i++) {
        const adapterName = adaptersName[i];
        console.log("Adapter: ", adapterName);
        const strategies = TypedAdapterStrategies[adaptersName[i]];

        for (let i = 0; i < strategies.length; i++) {
        // for (let i = 0; i < 1; i++) {
          describe(`${strategies[i].strategyName}`, async () => {
            const TOKEN_STRATEGY = strategies[i];
            const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[TOKEN_STRATEGY.token]]]);
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
              await approveLiquidityPoolAndMapAdapter(
                users["owner"],
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

              const ERC20Instance = await hre.ethers.getContractAt("ERC20", TOKENS[TOKEN_STRATEGY.token]);
              contracts["vault"] = Vault;
              contracts["erc20"] = ERC20Instance;
              contracts["adapter"] = adapter;
              contracts["strategyProvider"] = essentialContracts.strategyProvider;
              contracts["riskManager"] = essentialContracts.riskManager;
              console.log("Out Strategy Provider address: ", contracts["strategyProvider"].address);

              // const timestamp = (await getBlockTimestamp(hre)) * 2;
              // await fundWalletToken(
              //   hre,
              //   TOKENS[TOKEN_STRATEGY.token],
              //   users["owner"],
              //   BigNumber.from(MAX_AMOUNT[TOKEN_STRATEGY.token]),
              //   timestamp,
              // );
            });

            // for (let i = 0; i < vault.stories.length; i++) {
            for (let i = 0; i < 2; i++) {
              const story = vault.stories[i];
              it(story.description, async () => {
                for (let j = 0; j < story.setActions.length; j++) {
                  const action = story.setActions[j];
                  switch (action.action) {
                    case "setVaultRewardStrategy(bytes32,(uint256,uint256))": {
                      const { vaultRewardStrategy }: ARGUMENTS = action.args;
                      try {
                        const rewardTokenAdapters = Object.keys(REWARD_TOKENS);
                        if (rewardTokenAdapters.includes(adapterName)) {
                          console.log("Reward  Token adapter name: ", adapterName);
                          if (Array.isArray(vaultRewardStrategy) && vaultRewardStrategy.length > 0) {
                            console.log("Setting vault reward token strategy");
                            console.log("Vault Reward Strategy: ", vaultRewardStrategy);
  
                            //--------//
  
                            vaultRewardTokenHash = getSoliditySHA3Hash(["address[]"], [[Vault.address, REWARD_TOKENS[adapterName].tokenAddress]]);
                            console.log("Vault RewardToken hash: ", vaultRewardTokenHash);
                            await executeFunc(essentialContracts.registry, users["owner"], "approveTokens(address[])", [
                              [Vault.address, REWARD_TOKENS[adapterName].tokenAddress],
                            ]);
                            console.log("Approved vault and COMP reward token");
                            const setVRTHashTx = await executeFunc(
                              essentialContracts.registry,
                              users["owner"],
                              "setTokensHashToTokens(address[])",
                              [[Vault.address, REWARD_TOKENS[adapterName].tokenAddress]],
                            );
                            console.log("setVrtHash: ", setVRTHashTx);
  
                            console.log("Setting vault reward token strategy");
                            // await essentialContracts.strategyProvider.setVaultRewardStrategy(vaultRewardTokenHash, [
                            //   5000,
                            //   5000,
                            // ]);
                            // await essentialContracts.strategyProvider.setVaultRewardStrategy(vaultRewardTokenHash, vaultRewardStrategy);
                            // console.log("vault reward token strategy set");
  
                            // const vrtSfromRm = await essentialContracts.riskManager.getVaultRewardTokenStrategy(
                            //   vaultRewardTokenHash,
                            // );
                            // console.log("vrtS from RM: ", vrtSfromRm);
  
                            //  --------- //
                            console.log("Inside Strategy Provider address: ", contracts[action.contract].address);
                            await contracts[action.contract]
                              .connect(users[action.executer])
                              [action.action](vaultRewardTokenHash, vaultRewardStrategy);
                            console.log("vault reward token strategy set");

                            const vrtSfromRm = await essentialContracts.riskManager.getVaultRewardTokenStrategy(
                              vaultRewardTokenHash,
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
                    case "setTreasury(address)": {
                      const { address }: ARGUMENTS = action.args;
                      try {
                        if (address) {
                          await contracts[action.contract].connect(users[action.executer])[action.action](address);
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

                      assert.isDefined(address, `args is wrong in ${action.action} testcase`);
                      break;
                    }
                    case "approve(address,uint256)": {
                      const { addressName, amount }: ARGUMENTS = action.args;
                      try {
                        if (addressName && amount) {
                          // let address: string;
                          // if (action.action === "approve(address,uint256)") {
                          //   console.log("Approving Vault contract on behalf of user for DAI");
                          //   address = contracts[addressName].address;
                          // } 
                          // else {
                          //   address = await users[addressName].getAddress();
                          // }
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
                    case "userDepositRebalance(uint256)":
                    case "userWithdrawRebalance(uint256)": {
                      const { amount }: ARGUMENTS = action.args;

                      if (action.action === "userWithdrawRebalance(uint256)") {
                        await delay(200);
                      }
                      try {
                        if (amount) {
                          console.log("Calling Action: ", action.action);
                          await contracts[action.contract].connect(users[action.executer])[action.action](amount[TOKEN_STRATEGY.token]);
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
                    case "treasury()": {
                      const address = await contracts[action.contract][action.action]();
                      expect(address).to.equal(action.expectedValue);
                      break;
                    }
                    case "withdrawalFee()": {
                      const address = await contracts[action.contract][action.action]();
                      expect(address).to.equal(action.expectedValue);
                      break;
                    }
                    case "balanceOf(address)": {
                      const { address, addressName }: ARGUMENTS = action.args;
                      if (address) {
                        const value = await contracts[action.contract][action.action](address);
                        expect(+value).to.gte(+action.expectedValue);
                      } else if (addressName) {
                        console.log("Checking reward token balance");
                        // const address = users[addressName].getAddress();
                        const rewardTokenAdapters = Object.keys(REWARD_TOKENS);
                        if (rewardTokenAdapters.includes(adapterName)) {
                          console.log("Reward token adapter for balance: ", adapterName)
                          const COMP_ERC20Instance = await hre.ethers.getContractAt(
                            "ERC20",
                            <string>REWARD_TOKENS[adapterName].tokenAddress,
                          );
                          const comp_value = await COMP_ERC20Instance.balanceOf(Vault.address);
                          // const value = await contracts[action.contract][action.action](address);
                          action.expectedValue == ">0"
                            ? REWARD_TOKENS[adapterName].distributionActive ? assert.isAbove(+comp_value, +"0", "Vault should hold some reward tokens") : expect(+comp_value).to.equal(+"0")
                            : expect(+comp_value).to.equal(+action.expectedValue);
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
