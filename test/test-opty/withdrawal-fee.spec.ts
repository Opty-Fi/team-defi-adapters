import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { setUp } from "./setup";
import { CONTRACTS } from "../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE } from "../../helpers/constants";
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
  unpauseVault,
} from "../../helpers/contracts-actions";
import scenario from "./scenarios/withdrawal-fee.json";

// type ARGUMENTS = {
//   address?: string;
//   addressName?: string;
//   fee?: string;
//   amount?: { [key: string]: string };
//   treasuryAccountsWithShares?: [string, number][];
//   length?: number;
// };

describe(scenario.title, () => {
  // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
  const token = "DAI";
  const MAX_AMOUNT = "2000000000000000000";
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
      let underlyingTokenName: string;
      let underlyingTokenSymbol: string;
      const vault = scenario.vaults[i];
      const profile = vault.profile;

      const TOKEN_STRATEGY = TypedAdapterStrategies["CompoundAdapter"][0];
      const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[token]]]);
      let ERC20Instance: Contract;

      before(async () => {
        await approveLiquidityPoolAndMapAdapter(
          users["owner"],
          essentialContracts.registry,
          adapters["CompoundAdapter"].address,
          TOKEN_STRATEGY.strategy[0].contract,
        );
        await setBestBasicStrategy(
          TOKEN_STRATEGY.strategy,
          tokensHash,
          essentialContracts.vaultStepInvestStrategyDefinitionRegistry,
          essentialContracts.strategyProvider,
          "RP1",
        );
        const timestamp = (await getBlockTimestamp(hre)) * 2;
        await fundWalletToken(hre, TOKENS[token], users["owner"], BigNumber.from(MAX_AMOUNT), timestamp);
      });
      beforeEach(async () => {
        try {
          underlyingTokenName = await getTokenName(hre, token);
          underlyingTokenSymbol = await getTokenSymbol(hre, token);
          Vault = await deployVault(
            hre,
            essentialContracts.registry.address,
            essentialContracts.riskManager.address,
            essentialContracts.strategyManager.address,
            essentialContracts.optyMinter.address,
            TOKENS[token],
            users["owner"],
            users["admin"],
            underlyingTokenName,
            underlyingTokenSymbol,
            profile,
            TESTING_DEPLOYMENT_ONCE,
          );
          await unpauseVault(users["owner"], essentialContracts.registry, Vault.address, true);

          ERC20Instance = await hre.ethers.getContractAt("ERC20", TOKENS[token]);
          contracts["vault"] = Vault;
          contracts["erc20"] = ERC20Instance;
        } catch (error) {
          console.error(error);
        }
      });

      for (let i = 0; i < vault.stories.length; i++) {
        // for (let i = 0; i < 1; i++) {
        //   if (i == 3 || i == 1 || i == 2) {
        //     continue;
        //   }
        const story = vault.stories[i];
        it(story.description, async () => {
          for (let j = 0; j < story.activities.length; j++) {
            const activities = story.activities[j];
            for (let k = 0; k < activities.setActions.length; k++) {
              const action = activities.setActions[k];
              switch (action.action) {
                case "fundWallet": {
                  const { addressName, amount } = <any>action.args;
                  try {
                    if (addressName && amount) {
                      const timestamp = (await getBlockTimestamp(hre)) * 2;
                      await fundWalletToken(hre, TOKENS[token], users[addressName], BigNumber.from(amount), timestamp);
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
                case "setTreasuryAccountsShare((address,uint256)[])": {
                  const { treasuryAccountsWithShares } = <any>action.args;
                  try {
                    if (treasuryAccountsWithShares) {
                      await contracts[action.contract]
                        .connect(users[action.executer])
                        [action.action](treasuryAccountsWithShares);
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

                  assert.isDefined(treasuryAccountsWithShares, `args is wrong in ${action.action} testcase`);
                  // assert.isDefined(feeShares, `args is wrong in ${action.action} testcase`);
                  break;
                }
                // case "setTreasury(address)": {
                //   const { address }: ARGUMENTS = action.args;
                //   try {
                //     if (address) {
                //       await contracts[action.contract].connect(users[action.executer])[action.action](address);
                //     }
                //   } catch (error) {
                //     if (action.expect === "success") {
                //       assert.isUndefined(error);
                //     } else {
                //       expect(error.message).to.equal(
                //         `VM Exception while processing transaction: revert ${action.message}`,
                //       );
                //     }
                //   }

                //   assert.isDefined(address, `args is wrong in ${action.action} testcase`);
                //   break;
                // }
                case "setWithdrawalFee(uint256)": {
                  const { fee } = <any>action.args;
                  try {
                    if (fee) {
                      await contracts[action.contract].connect(users[action.executer])[action.action](fee);
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
                  assert.isDefined(fee, `args is wrong in ${action.action} testcase`);
                  break;
                }
                case "approve(address,uint256)":
                case "transfer(address,uint256)": {
                  const { addressName, amount } = <any>action.args;
                  try {
                    if (addressName && amount) {
                      let address: string;
                      if (action.action === "approve(address,uint256)") {
                        address = contracts[addressName].address;
                      } else {
                        address = await users[addressName].getAddress();
                      }
                      await contracts[action.contract].connect(users[action.executer])[action.action](address, amount);
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
                  const { amount } = <any>action.args;

                  if (action.action === "userWithdrawRebalance(uint256)") {
                    await delay(200);
                  }
                  try {
                    if (amount) {
                      await contracts[action.contract].connect(users[action.executer])[action.action](amount);
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
            for (let k = 0; k < activities.getActions.length; k++) {
              const action = activities.getActions[k];
              switch (action.action) {
                case "getTreasuryAccounts()": {
                  // const { length }: ARGUMENTS = action.args;
                  const treasuryAccounts = await contracts[action.contract][action.action]();
                  console.log("TreasuryAccounts: ", treasuryAccounts[0].treasuryAccount);
                  console.log("Treasury Accounts length: ", treasuryAccounts.length);
                  const expectedValues = Array.isArray(action.expectedValue) ? action.expectedValue : [];
                  console.log("Expected values: ", expectedValues[0]);
                  console.log("Expected values length: ", expectedValues.length);

                  expect(+treasuryAccounts.length).to.equal(+expectedValues.length);
                  for (let i = 0; i < treasuryAccounts.length; i++) {
                    // const treasuryAccount = treasuryAccounts[i];
                    // const expectedValue = expectedValues[i];
                    // console.log("Checking treasury account values");
                    expect([treasuryAccounts[i].treasuryAccount, +treasuryAccounts[i].share]).to.have.members(
                      expectedValues[i],
                    );
                    // expect()
                  }
                  // expect(address).to.equal(action.expectedValue);
                  break;
                }
                // case "treasury()": {
                //   const address = await contracts[action.contract][action.action]();
                //   expect(address).to.equal(action.expectedValue);
                //   break;
                // }
                case "withdrawalFee()": {
                  const address = await contracts[action.contract][action.action]();
                  expect(address).to.equal(action.expectedValue);
                  break;
                }
                case "balanceOf(address)": {
                  const { address, addressName } = <any>action.args;
                  if (address) {
                    const value = await contracts[action.contract][action.action](address);
                    expect(+value).to.gte(+action.expectedValue);
                  } else if (addressName) {
                    const address = users[addressName].getAddress();
                    const value = await contracts[action.contract][action.action](address);
                    expect(+value).to.gte(+action.expectedValue);
                  }
                  break;
                }
              }
            }
          }
        }).timeout(100000);
      }
    });
  }
});
