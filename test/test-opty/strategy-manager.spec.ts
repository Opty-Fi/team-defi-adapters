import chai, { expect } from "chai";
import hre from "hardhat";
import { Contract, Signer } from "ethers";
import { solidity } from "ethereum-waffle";
import { CONTRACTS, MOCK_CONTRACTS, STRATEGY_DATA } from "../../helpers/type";
import {
  generateStrategyHash,
  deployContract,
  deploySmockContract,
  retrieveAdapterFromStrategyName,
} from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS, TESTING_CONTRACTS } from "../../helpers/constants";
import { deployAdapter } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/strategy-manager.json";
import { TypedStrategies, TypedTokens } from "../../helpers/data";
import { smock } from "@defi-wonderland/smock";

chai.use(solidity);

describe(scenario.title, () => {
  const sideContracts: MOCK_CONTRACTS = {};
  let strategyManager: Contract;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      sideContracts["registry"] = await deploySmockContract(smock, ESSENTIAL_CONTRACTS.REGISTRY, []);
      sideContracts["vaultStepInvestStrategyDefinitionRegistry"] = await deploySmockContract(
        smock,
        ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
        [sideContracts["registry"].address],
      );
      sideContracts["harvestCodeProvider"] = await deploySmockContract(
        smock,
        ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
        [sideContracts["registry"].address],
      );
      strategyManager = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.STRATEGY_MANAGER,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [sideContracts["registry"].address],
      );
      sideContracts["registry"].getRiskOperator.returns(await owner.getAddress());
      sideContracts["registry"].getVaultStepInvestStrategyDefinitionRegistry.returns(
        sideContracts["vaultStepInvestStrategyDefinitionRegistry"].address,
      );
      sideContracts["registry"].getHarvestCodeProvider.returns(sideContracts["harvestCodeProvider"].address);
    } catch (error) {
      console.log(error);
    }
  });
  for (let i = 0; i < TypedStrategies.length; i++) {
    const strategy = TypedStrategies[i];
    if (i > 0) {
      break;
    }
    const adapterNames = retrieveAdapterFromStrategyName(strategy.strategyName);
    const adapters: CONTRACTS = {};
    const strategyHash = generateStrategyHash(strategy.strategy, TypedTokens[strategy.token.toUpperCase()]);
    before(async () => {
      for (let i = 0; i < adapterNames.length; i++) {
        adapters[adapterNames[i]] = await deployAdapter(
          hre,
          owner,
          adapterNames[i],
          sideContracts["registry"].address,
          TESTING_DEPLOYMENT_ONCE,
        );
      }
    });

    for (let i = 0; i < scenario.stories.length; i++) {
      const story = scenario.stories[i];
      it(`${story.description}`, async () => {
        for (let i = 0; i < story.setActions.length; i++) {
          const action = story.setActions[i];
          switch (action.action) {
            case "getStrategy()": {
              sideContracts["vaultStepInvestStrategyDefinitionRegistry"].getStrategy.returns([
                0,
                strategy.strategy.map(s => ({
                  pool: s.contract,
                  outputToken: s.outputToken,
                  isBorrow: s.isBorrow,
                })),
              ]);
              break;
            }
            case "getLiquidityPoolToAdapter()": {
              for (let i = 0; i < strategy.strategy.length; i++) {
                sideContracts["registry"].getLiquidityPoolToAdapter
                  .whenCalledWith(strategy.strategy[i].contract)
                  .returns(adapters[adapterNames[i]].address);
              }
            }
          }
        }
        for (let i = 0; i < story.getActions.length; i++) {
          const action = story.getActions[i];
          switch (action.action) {
            case "getDepositAllStepCount(bytes32)": {
              const value = await strategyManager[action.action](strategyHash);
              expect(value).to.be.equal(1);
              console.log("value:", value);
              break;
            }
            case "getBalanceInUnderlyingTokenWrite(address,address,bytes32)": {
              // await getBalanceInUnderlyingTokenWrite()
              //expect(await strategyManager.getBalanceInUnderlyingTokenWrite());
              break;
            }
          }
        }
        // for (let i = 0; i < story.cleanActions.length; i++) {}
      });
    }
  }
});
