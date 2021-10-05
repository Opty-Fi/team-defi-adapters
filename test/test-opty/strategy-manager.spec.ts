import chai, { expect } from "chai";
import hre from "hardhat";
import { Contract, Signer } from "ethers";
import { solidity } from "ethereum-waffle";
import { CONTRACTS, MOCK_CONTRACTS, STRATEGY_DATA } from "../../helpers/type";
import { deployContract, deploySmockContract, retrieveAdapterFromStrategyName } from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS, TESTING_CONTRACTS } from "../../helpers/constants";
import { deployRegistry, deployAdapter } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/strategy-manager.json";
import { approveLiquidityPoolAndMapAdapters } from "../../helpers/contracts-actions";
import { TypedStrategies } from "../../helpers/data";
import { smock } from "@defi-wonderland/smock";

chai.use(solidity);

describe(scenario.title, () => {
  const sideContracts: MOCK_CONTRACTS = {};
  let strategyManager: Contract;
  let registry: Contract;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
      sideContracts["vaultStepInvestStrategyDefinitionRegistry"] = await deploySmockContract(
        smock,
        ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
        [registry.address],
      );
      sideContracts["harvestCodeProvider"] = await deploySmockContract(
        smock,
        ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
        [registry.address],
      );
      strategyManager = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.STRATEGY_MANAGER,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [registry.address],
      );
    } catch (error) {
      console.log(error);
    }
  });
  for (let i = 0; i < TypedStrategies.length; i++) {
    const strategy = TypedStrategies[i];
    const adapterNames = retrieveAdapterFromStrategyName(strategy.strategyName);
    const adapters: CONTRACTS = {};
    before(async () => {
      const liquidityPoolToAdapters = [];
      const liquidityPools = strategy.strategy.map(item => item.contract);
      for (let i = 0; i < adapterNames.length; i++) {
        adapters[adapterNames[i]] = await deployAdapter(
          hre,
          owner,
          adapterNames[i],
          registry.address,
          TESTING_DEPLOYMENT_ONCE,
        );
        liquidityPoolToAdapters.push([strategy.strategy[i].contract, adapters[adapterNames[i]].address]);
      }
      await approveLiquidityPoolAndMapAdapters(owner, registry, liquidityPools, liquidityPoolToAdapters);
    });

    for (let i = 0; i < scenario.stories.length; i++) {
      const story = scenario.stories[i];
      it(`${story.description}`, async () => {
        // for (let i = 0; i < story.setActions.length; i++) {}
        for (let i = 0; i < story.getActions.length; i++) {
          const action = story.getActions[i];
          switch (action.action) {
            case "getBalanceInUnderlyingTokenWrite(address,address,bytes32)": {
              // await getBalanceInUnderlyingTokenWrite()
              expect(await strategyManager.getBalanceInUnderlyingTokenWrite());
              break;
            }
          }
        }
        // for (let i = 0; i < story.cleanActions.length; i++) {}
      });
    }
  }
});

// async function getBalanceInUnderlyingTokenWrite(
//   vault: string,
//   strategies: STRATEGY_DATA[],
//   adapter: Contract,
//   underlyingToken: string,
// ): Promise<number> {
//   let balance = 0;
//   for (let i = strategies.length - 1; i >= 0; i--) {
//     const inputToken = i === 0 ? underlyingToken : strategies[i].outputToken;
//     const liquidityPool = strategies[i].contract;
//     const strategy = strategies[i];
//     if (!strategy.isBorrow) {
//       if (i === strategies.length - 1) {
//         if (await adapter.canStake(liquidityPool)) {
//           balance = await adapter.getAllAmountInTokenStakeWrite(vault, inputToken, liquidityPool);
//         } else {
//           balance = await adapter.getAllAmountInToken(vault, inputToken, liquidityPool);
//         }
//       } else {
//         balance = await adapter.getSomeAmountInToken(inputToken, liquidityPool, balance);
//       }
//     } else {
//       const borrowToken = strategy.outputToken;
//       balance = await adapter.getAllAmountInTokenBorrow(vault, inputToken, liquidityPool, borrowToken, balance);
//     }
//   }
//   return balance;
// }
