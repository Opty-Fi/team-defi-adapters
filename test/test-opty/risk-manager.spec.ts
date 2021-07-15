import { expect, assert } from "chai";
import hre from "hardhat";
import { CONTRACTS, STRATEGY_DATA } from "../../helpers/type";
import { TypedStrategies, TypedTokens, TypedDefaultStrategies } from "../../helpers/data";
import {
  generateStrategyHash,
  generateStrategyStep,
  generateTokenHash,
  deployContract,
  executeFunc,
} from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { deployRegistry } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/risk-manager.json";

type ARGUMENTS = {
  poolRatingRange?: number[];
  score?: number[];
};

describe(scenario.title, () => {
  let contracts: CONTRACTS = {};
  beforeEach(async () => {
    try {
      const [owner] = await hre.ethers.getSigners();
      const registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
      const vaultStepInvestStrategyDefinitionRegistry = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [registry.address],
      );

      await executeFunc(registry, owner, "setVaultStepInvestStrategyDefinitionRegistry(address)", [
        vaultStepInvestStrategyDefinitionRegistry.address,
      ]);

      const strategyProvider = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.STRATEGY_PROVIDER,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [registry.address],
      );

      await executeFunc(registry, owner, "setStrategyProvider(address)", [strategyProvider.address]);

      const aprOracle = await deployContract(hre, ESSENTIAL_CONTRACTS.APR_ORACLE, TESTING_DEPLOYMENT_ONCE, owner, [
        registry.address,
      ]);

      await executeFunc(registry, owner, "setAPROracle(address)", [aprOracle.address]);

      let riskManager = await deployContract(hre, ESSENTIAL_CONTRACTS.RISK_MANAGER, TESTING_DEPLOYMENT_ONCE, owner, [
        registry.address,
      ]);

      const riskManagerProxy = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.RISK_MANAGER_PROXY,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [registry.address],
      );

      await executeFunc(riskManagerProxy, owner, "setPendingImplementation(address)", [riskManager.address]);
      await executeFunc(riskManager, owner, "become(address)", [riskManagerProxy.address]);

      riskManager = await hre.ethers.getContractAt(ESSENTIAL_CONTRACTS.RISK_MANAGER, riskManagerProxy.address, owner);

      contracts = { registry, vaultStepInvestStrategyDefinitionRegistry, strategyProvider, riskManager };
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < TypedStrategies.length; i++) {
    const strategy = TypedStrategies[i];
    const defaultStrategy = TypedDefaultStrategies[strategy.token];
    const riskProfile = "RP1";
    const noOfSteps = strategy.strategy.length;
    const tokenHash = generateTokenHash([TypedTokens[strategy.token]]);
    const strategyHash = generateStrategyHash(strategy.strategy, TypedTokens[strategy.token]);
    const defaultStrategyHash = generateStrategyHash(defaultStrategy.strategy, TypedTokens[strategy.token]);
    let isCheckDefault = false;
    describe(strategy.strategyName, () => {
      for (let i = 0; i < scenario.stories.length; i++) {
        const story = scenario.stories[i];
        it(`${story.description}`, async () => {
          for (let i = 0; i < story.setActions.length; i++) {
            const action = story.setActions[i];
            switch (action.action) {
              case "addRiskProfile(string,uint8,(uint8,uint8))": {
                const { poolRatingRange }: ARGUMENTS = action.args;
                if (riskProfile && noOfSteps && poolRatingRange) {
                  if (action.expect === "success") {
                    await contracts[action.contract][action.action](riskProfile, noOfSteps, poolRatingRange);
                  } else {
                    await expect(
                      contracts[action.contract][action.action](riskProfile, noOfSteps, poolRatingRange),
                    ).to.be.revertedWith(action.message);
                  }
                }
                assert.isDefined(poolRatingRange, `args is wrong in ${action.action} testcase`);
                break;
              }
              case "approveToken(address)": {
                if (TypedTokens[strategy.token]) {
                  if (action.expect === "success") {
                    await contracts[action.contract][action.action](TypedTokens[strategy.token]);
                  } else {
                    await expect(
                      contracts[action.contract][action.action](TypedTokens[strategy.token]),
                    ).to.be.revertedWith(action.message);
                  }
                }
                break;
              }
              case "setTokensHashToTokens(address[])": {
                if (TypedTokens[strategy.token]) {
                  if (action.expect === "success") {
                    await contracts[action.contract][action.action]([TypedTokens[strategy.token]]);
                  } else {
                    await expect(
                      contracts[action.contract][action.action]([TypedTokens[strategy.token]]),
                    ).to.be.revertedWith(action.message);
                  }
                }
                break;
              }
              case "approveLiquidityPool(address[])": {
                const lpTokens = strategy.strategy.map(strategy => strategy.contract);
                if (action.expect === "success") {
                  await contracts[action.contract][action.action](lpTokens);
                } else {
                  await expect(contracts[action.contract][action.action](lpTokens)).to.be.revertedWith(action.message);
                }
                break;
              }
              case "rateLiquidityPool((address,uint8)[])": {
                const { score }: ARGUMENTS = action.args;
                if (score) {
                  const lpTokens = strategy.strategy.map(strategy => strategy.contract);
                  const pools = lpTokens.map((lp, i) => [lp, score[i]]);
                  if (action.expect === "success") {
                    await contracts[action.contract][action.action](pools);
                  } else {
                    await expect(contracts[action.contract][action.action](pools)).to.be.revertedWith(action.message);
                  }
                }
                assert.isDefined(score, `args is wrong in ${action.action} testcase`);
                break;
              }
              case "setStrategy(bytes32,(address,address,bool)[])": {
                const strategySteps = generateStrategyStep(strategy.strategy);

                if (action.expect === "success") {
                  await contracts[action.contract][action.action](tokenHash, strategySteps);
                } else {
                  await expect(contracts[action.contract][action.action](tokenHash, strategySteps)).to.be.revertedWith(
                    action.message,
                  );
                }

                break;
              }
              case "setBestStrategy(string,bytes32,bytes32)": {
                if (action.expect === "success") {
                  await contracts[action.contract][action.action](riskProfile, tokenHash, strategyHash);
                } else {
                  await expect(
                    contracts[action.contract][action.action](riskProfile, tokenHash, strategyHash),
                  ).to.be.revertedWith(action.message);
                }

                break;
              }
              case "setBestDefaultStrategy(string,bytes32,bytes32)": {
                const { score }: ARGUMENTS = action.args;
                const scoredPools: [string, number][] = [];
                const lpPools: string[] = [];
                if (score) {
                  for (let i = 0; i < defaultStrategy.strategy.length; i++) {
                    const strategy = defaultStrategy.strategy[i];
                    lpPools.push(strategy.contract);
                    scoredPools.push([strategy.contract, score[i]]);
                  }

                  await contracts["registry"]["approveLiquidityPool(address[])"](lpPools);
                  await contracts["registry"]["rateLiquidityPool((address,uint8)[])"](scoredPools);
                  await contracts["vaultStepInvestStrategyDefinitionRegistry"][
                    "setStrategy(bytes32,(address,address,bool)[])"
                  ](tokenHash, generateStrategyStep(defaultStrategy.strategy));
                }

                if (action.expect === "success") {
                  await contracts[action.contract][action.action](riskProfile, tokenHash, defaultStrategyHash);
                } else {
                  await expect(
                    contracts[action.contract][action.action](riskProfile, tokenHash, defaultStrategyHash),
                  ).to.be.revertedWith(action.message);
                }
                isCheckDefault = true;
                assert.isDefined(score, `args is wrong in ${action.action} testcase`);
                break;
              }
              case "setDefaultStrategyState(uint8)": {
                const { defaultStrategyState }: ARGUMENTS = action.args;

                if (action.expect === "success") {
                  await contracts[action.contract][action.action](defaultStrategyState);
                } else {
                  await expect(contracts[action.contract][action.action](defaultStrategyState)).to.be.revertedWith(
                    action.message,
                  );
                }

                assert.isDefined(defaultStrategyState, `args is wrong in ${action.action} testcase`);
                break;
              }
            }
          }
          for (let i = 0; i < story.getActions.length; i++) {
            const action = story.getActions[i];
            switch (action.action) {
              case "getBestStrategy(string,address[])": {
                const value = await contracts[action.contract][action.action](riskProfile, [
                  TypedTokens[strategy.token],
                ]);
                expect(value).to.be.equal(
                  action.expectedValue !== ""
                    ? action.expectedValue
                    : isCheckDefault
                    ? defaultStrategyHash
                    : strategyHash,
                );
              }
            }
          }
        });
      }
    });
  }
});
