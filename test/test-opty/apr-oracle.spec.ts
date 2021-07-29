import { expect, assert } from "chai";
import hre from "hardhat";
import { Signer } from "ethers";
import { CONTRACTS, STRATEGY_DATA } from "../../helpers/type";
import {
  generateStrategyHash,
  deployContract,
  executeFunc,
  generateTokenHash,
  generateStrategyStep,
} from "../../helpers/helpers";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { deployRegistry, deployRiskManager } from "../../helpers/contracts-deployments";
import { approveToken } from "../../helpers/contracts-actions";

import scenario from "./scenarios/apr-oracle.json";

type ARGUMENTS = {
  riskProfile?: string;
  canBorrow?: boolean;
  poolRatingRange?: number[];
  strategy?: STRATEGY_DATA[];
  token?: string;
  tokens?: string[];
  score?: number;
  defaultStrategyState?: number;
};

const USED_TOKENS = ["0x6b175474e89094c44da98b954eedeac495271d0f", "0x973e52691176d36453868D9d86572788d27041A9"];

const USED_STRATEGIES = [
  {
    strategy: [
      {
        contract: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
        outputToken: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
        isBorrow: false,
      },
    ],
    token: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    strategy: [
      {
        contract: "0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d",
        outputToken: "0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d",
        isBorrow: false,
      },
    ],
    token: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    strategy: [
      {
        contract: "0x028171bCA77440897B824Ca71D1c56caC55b68A3",
        outputToken: "0x028171bCA77440897B824Ca71D1c56caC55b68A3",
        isBorrow: false,
      },
    ],
    token: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
  {
    strategy: [
      {
        contract: "0xab7FA2B2985BCcfC13c6D86b1D5A17486ab1e04C",
        outputToken: "0xab7FA2B2985BCcfC13c6D86b1D5A17486ab1e04C",
        isBorrow: false,
      },
    ],
    token: "0x6b175474e89094c44da98b954eedeac495271d0f",
  },
];

describe(scenario.title, async () => {
  let contracts: CONTRACTS = {};
  let users: { [key: string]: Signer };
  before(async () => {
    try {
      const [owner, user1] = await hre.ethers.getSigners();
      users = { owner, user1 };
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

      const riskManager = await deployRiskManager(hre, owner, TESTING_DEPLOYMENT_ONCE, registry.address);

      await registry["addRiskProfile(string,bool,(uint8,uint8))"]("RP1", false, [0, 10]);

      await approveToken(owner, registry, USED_TOKENS);

      contracts = { registry, vaultStepInvestStrategyDefinitionRegistry, strategyProvider, riskManager };
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < scenario.stories.length; i++) {
    const story = scenario.stories[i];
    it(`${story.description}`, async () => {
      if (i === 1) {
        // scenario no.0 doesn't require to set Strategies
        for (let i = 0; i < USED_STRATEGIES.length; i++) {
          const strategy = USED_STRATEGIES[i];
          await contracts["vaultStepInvestStrategyDefinitionRegistry"]["setStrategy(bytes32,(address,address,bool)[])"](
            generateTokenHash([strategy.token]),
            generateStrategyStep(strategy.strategy),
          );
        }
      }
      for (let i = 0; i < story.setActions.length; i++) {
        const action = story.setActions[i];
        switch (action.action) {
          case "updateRPPoolRatings(string,(uint8,uint8))": {
            const { riskProfile, poolRatingRange }: ARGUMENTS = action.args;
            if (riskProfile && poolRatingRange) {
              if (action.expect === "success") {
                await contracts[action.contract][action.action](riskProfile, poolRatingRange);
              } else {
                await expect(
                  contracts[action.contract][action.action](riskProfile, poolRatingRange),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(riskProfile, `args is wrong in ${action.action} testcase`);
            assert.isDefined(poolRatingRange, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "approveToken(address)":
          case "approveLiquidityPool(address)": {
            const { token }: ARGUMENTS = action.args;
            if (token) {
              if (action.expect === "success") {
                await contracts[action.contract][action.action](token);
              } else {
                await expect(contracts[action.contract][action.action](token)).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(token, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "rateLiquidityPool(address,uint8)": {
            const { token, score }: ARGUMENTS = action.args;
            if (token && score) {
              if (action.expect === "success") {
                await contracts[action.contract][action.action](token, score);
              } else {
                await expect(contracts[action.contract][action.action](token, score)).to.be.revertedWith(
                  action.message,
                );
              }
            }
            assert.isDefined(token, `args is wrong in ${action.action} testcase`);
            assert.isDefined(score, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setTokensHashToTokens(address[])": {
            const { tokens }: ARGUMENTS = action.args;
            if (tokens) {
              if (action.expect === "success") {
                await contracts[action.contract][action.action](tokens);
              } else {
                await expect(contracts[action.contract][action.action](tokens)).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(tokens, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setStrategy(bytes32,(address,address,bool)[])": {
            const { strategy, token }: ARGUMENTS = action.args;

            if (strategy && token) {
              const strategySteps: [string, string, boolean][] = [];
              for (let index = 0; index < strategy.length; index++) {
                const tempArr: [string, string, boolean] = [
                  strategy[index].contract,
                  strategy[index].outputToken,
                  strategy[index].isBorrow,
                ];
                strategySteps.push(tempArr);
              }

              const tokenHash = getSoliditySHA3Hash(["address[]"], [[token]]);

              if (action.expect === "success") {
                await contracts[action.contract][action.action](tokenHash, strategySteps);
              } else {
                await expect(contracts[action.contract][action.action](tokenHash, strategySteps)).to.be.revertedWith(
                  action.message,
                );
              }
            }

            assert.isDefined(strategy, `args is wrong in ${action.action} testcase`);
            assert.isDefined(token, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setBestStrategy(string,bytes32,bytes32)":
          case "setBestDefaultStrategy(string,bytes32,bytes32)": {
            const { strategy, token, riskProfile }: ARGUMENTS = action.args;

            if (strategy && token && riskProfile) {
              const strategyHash = generateStrategyHash(strategy, token);
              const tokenHash = getSoliditySHA3Hash(["address[]"], [[token]]);

              if (action.expect === "success") {
                await contracts[action.contract][action.action](riskProfile, tokenHash, strategyHash);
              } else {
                await expect(
                  contracts[action.contract][action.action](riskProfile, tokenHash, strategyHash),
                ).to.be.revertedWith(action.message);
              }
            }

            assert.isDefined(strategy, `args is wrong in ${action.action} testcase`);
            assert.isDefined(token, `args is wrong in ${action.action} testcase`);
            assert.isDefined(riskProfile, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setDefaultStrategyState(uint8)": {
            const { defaultStrategyState }: ARGUMENTS = action.args;
            if (action.expect === "success") {
              await contracts[action.contract].connect(users[action.executor])[action.action](defaultStrategyState);
            } else {
              await expect(
                contracts[action.contract].connect(users[action.executor])[action.action](defaultStrategyState),
              ).to.be.revertedWith(action.message);
            }
            break;
          }
        }
      }
      for (let i = 0; i < story.getActions.length; i++) {
        const action = story.getActions[i];
        switch (action.action) {
          case "getBestStrategy(string,address[])": {
            const { riskProfile, tokens }: ARGUMENTS = action.args;
            if (riskProfile && tokens) {
              const value = await contracts[action.contract][action.action](riskProfile, tokens);
              expect(value).to.be.equal(action.expectedValue);
            }
            assert.isDefined(riskProfile, `args is wrong in ${action.action} testcase`);
            assert.isDefined(tokens, `args is wrong in ${action.action} testcase`);
            break;
          }
        }
      }
      for (let i = 0; i < story.cleanActions.length; i++) {
        const action = story.cleanActions[i];
        switch (action.action) {
          case "revokeToken(address[])": {
            const { tokens }: ARGUMENTS = action.args;
            if (tokens) {
              await contracts[action.contract][action.action](tokens);
            }
            assert.isDefined(tokens, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "revokeLiquidityPool(address[])": {
            const { tokens }: ARGUMENTS = action.args;
            if (tokens) {
              await contracts[action.contract][action.action](tokens);
            }
            assert.isDefined(tokens, `args is wrong in ${action.action} testcase`);
            break;
          }
        }
      }
    });
  }
});
