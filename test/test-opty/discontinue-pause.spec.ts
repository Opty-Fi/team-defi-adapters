import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { setUp } from "./setup";
import { CONTRACTS } from "../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE } from "../../helpers/constants";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { TypedAdapterStrategies } from "../../helpers/data";
import { deployVault } from "../../helpers/contracts-deployments";
import {
  approveLiquidityPoolAndMapAdapter,
  setBestBasicStrategy,
  fundWalletToken,
  getBlockTimestamp,
  getTokenName,
  getTokenSymbol,
} from "../../helpers/contracts-actions";
import scenario from "./scenarios/discontinue-pause.json";

describe(scenario.title, () => {
  // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
  const token = "DAI";
  const MAX_AMOUNT = "100000000000000000000";
  let essentialContracts: CONTRACTS;
  let contracts: CONTRACTS;
  let adapters: CONTRACTS;
  let owner: Signer;
  let admin: Signer;
  before(async () => {
    try {
      [owner, admin] = await hre.ethers.getSigners();
      [essentialContracts, adapters] = await setUp(owner);
      assert.isDefined(essentialContracts, "Essential contracts not deployed");
      assert.isDefined(adapters, "Adapters not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < scenario.vaults.length; i++) {
    describe(`${scenario.vaults[i].name}`, async () => {
      let vault: Contract;
      let underlyingTokenName: string;
      let underlyingTokenSymbol: string;
      const vaults = scenario.vaults[i];
      const profile = vaults.profile;
      const TOKEN_STRATEGY = TypedAdapterStrategies["CompoundAdapter"][0];
      const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[token]]]);
      let ERC20Instance: Contract;
      before(async () => {
        try {
          underlyingTokenName = await getTokenName(hre, token);
          underlyingTokenSymbol = await getTokenSymbol(hre, token);
          vault = await deployVault(
            hre,
            essentialContracts.registry.address,
            essentialContracts.riskManager.address,
            essentialContracts.strategyManager.address,
            essentialContracts.optyMinter.address,
            TOKENS[token],
            owner,
            admin,
            underlyingTokenName,
            underlyingTokenSymbol,
            profile,
            TESTING_DEPLOYMENT_ONCE,
          );
          contracts = { ...essentialContracts, vault };
          await approveLiquidityPoolAndMapAdapter(
            owner,
            essentialContracts.registry,
            adapters["CompoundAdapter"].address,
            TOKEN_STRATEGY.strategy[0].contract,
          );

          const riskProfile = await vault.profile();
          await setBestBasicStrategy(
            TOKEN_STRATEGY.strategy,
            tokensHash,
            essentialContracts.vaultStepInvestStrategyDefinitionRegistry,
            essentialContracts.strategyProvider,
            riskProfile,
          );

          const timestamp = (await getBlockTimestamp(hre)) * 2;
          console.log("Funding wallet");
          await fundWalletToken(hre, TOKENS[token], owner, BigNumber.from(MAX_AMOUNT), timestamp);
          ERC20Instance = await hre.ethers.getContractAt("ERC20", TOKENS[token]);
          contracts["erc20"] = ERC20Instance;
        } catch (error) {
          console.error(error);
        }
      });

      for (let i = 0; i < vaults.stories.length; i++) {
        const story = vaults.stories[i];
        it(story.description, async () => {
          for (let j = 0; j < story.actions.length; j++) {
            const action = story.actions[j];
            switch (action.action) {
              case "balance()": {
                const args = action.args;
                // const { expectedValue } = <ARGUMENTS>action?.args[<keyof typeof action.args>"expectedValue"];
                if (action.expect === "success") {
                  // if (args.hasOwnProperty("expectedValue")) {
                  const expectedValue = <string>args[<keyof typeof args>"expectedValue"];
                  console.log("Expected value1: ", expectedValue);
                  const balance = await contracts[action.contract.toLowerCase()][action.action]();
                  console.log("Balance: ", +balance);
                  expectedValue === "0" ? "" : console.log("Expected value2: ", expectedValue.substring(2));
                  expectedValue === "0"
                    ? expect(+balance).to.equal(+expectedValue)
                    : expect(+balance).to.be.gte(+expectedValue.substring(2));

                  // args[<keyof typeof args>"expectedValue"] === "0" ? expect(await contracts[action.contract.toLowerCase()][action.action](contracts["vault"].address),).to.equal(args[<keyof typeof args>"expectedValue"])
                  // }
                } else {
                  console.log("Balance else condition");
                }
                assert.isDefined(args, `args is wrong in ${action.action} testcase`);
                break;
              }
              case "balanceOf(address)": {
                const args = action.args;
                if (action.expect === "success") {
                  const expectedValue = <string>args[<keyof typeof args>"expectedValue"];
                  const addr = await owner.getAddress();
                  const balance = await contracts[action.contract.toLowerCase()][action.action](addr);
                  console.log("Balance1: ", +balance);
                  expectedValue === "0"
                    ? expect(+balance).to.equal(+expectedValue)
                    : expect(+balance).to.be.gte(+expectedValue.split(">")[1]);
                  // expect(+balance).to.be.gt(+action.expectedValue.toString().split(">")[1]);
                }
                assert.isDefined(args, `args is wrong in ${action.action} testcase`);
                break;
              }
              case "userDepositRebalance(uint256)":
              case "userDepositAllRebalance()":
              case "userWithdrawRebalance(uint256)":
              case "userWithdrawAllRebalance()": {
                const args = action.args;
                if (action.expect === "success") {
                  console.log("Approving vault");
                  await ERC20Instance.connect(owner).approve(
                    contracts[action.contract.toLowerCase()].address,
                    BigNumber.from(MAX_AMOUNT),
                  );
                  console.log("perforimg ", action.action);
                  action.action === "userDepositRebalance(uint256)" ||
                  action.action === "userWithdrawRebalance(uint256)"
                    ? await contracts[action.contract.toLowerCase()][action.action](BigNumber.from(args?.amount))
                    : await contracts[action.contract.toLowerCase()][action.action]();
                } else {
                  action.action === "userDepositRebalance(uint256)" ||
                  action.action === "userWithdrawRebalance(uint256)"
                    ? await expect(
                        contracts[action.contract.toLowerCase()][action.action](args?.amount),
                      ).to.be.revertedWith(action.message)
                    : await expect(contracts[action.contract.toLowerCase()][action.action]()).to.be.revertedWith(
                        action.message,
                      );
                }

                assert.isDefined(args, `args is wrong in ${action.action} testcase`);
                break;
              }
              case "discontinue(address)":
              case "unpauseTokenizationContract(address,bool)": {
                const args = action.args;
                if (action.expect === "success") {
                  action.action === "unpauseTokenizationContract(address,bool)"
                    ? await contracts[action.contract.toLowerCase()][action.action](vault.address, args?.unpause)
                    : await contracts[action.contract.toLowerCase()][action.action](vault.address);
                }
                assert.isDefined(args, `args is wrong in ${action.action} testcase`);
                break;
              }
            }
          }
        }).timeout(100000);
      }
    });
  }
});
