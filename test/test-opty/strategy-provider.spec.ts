import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer } from "ethers";
import { CONTRACTS, STRATEGY_DATA } from "../../helpers/type";
import { generateStrategyHash, deployContract } from "../../helpers/helpers";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS, TESTING_CONTRACTS } from "../../helpers/constants";
import { deployRegistry } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/strategy-provider.json";
import { approveVaultRewardTokens } from "../../helpers/contracts-actions";

type ARGUMENTS = {
  riskProfile?: string;
  noOfSteps?: number;
  poolRatingRange?: number[];
  strategy?: STRATEGY_DATA[];
  token?: string;
  tokens?: string[];
  score?: number;
  defaultStrategyState?: number;
  vaultRewardStrategy?: number[];
};

describe(scenario.title, () => {
  let contracts: CONTRACTS = {};
  // let owner: Signer;
  let signers: any;
  let strategyOperator: Signer;
  let DUMMY_VAULT_EMPTY_CONTRACT: Contract;
  let vaultRewardTokenHash: string;

  beforeEach(async () => {
    try {
      const [owner, user1] = await hre.ethers.getSigners();
      strategyOperator = owner;
      signers = { owner, strategyOperator, user1 };
      const registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
      DUMMY_VAULT_EMPTY_CONTRACT = await deployContract(
        hre,
        TESTING_CONTRACTS.TEST_DUMMY_EMPTY_CONTRACT,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [],
      );

      await registry["addRiskProfile(string,uint8,(uint8,uint8))"]("RP1", 1, [0, 10]);
      await registry["approveToken(address)"]("0x6b175474e89094c44da98b954eedeac495271d0f");
      await registry["setTokensHashToTokens(address[])"](["0x6b175474e89094c44da98b954eedeac495271d0f"]);

      // const token = "0x6b175474e89094c44da98b954eedeac495271d0f";

      // const tokenHash = getSoliditySHA3Hash(["address[]"], [[token]]);
      // console.log("Token: ", token);
      // console.log("TokensHash: ", tokenHash);

      const strategyProvider = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.STRATEGY_PROVIDER,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [registry.address],
      );

      vaultRewardTokenHash = getSoliditySHA3Hash(
        ["address[]"],
        [[DUMMY_VAULT_EMPTY_CONTRACT.address, "0xc00e94Cb662C3520282E6f5717214004A7f26888"]],
      );
      // console.log("Valut reward hash: ", vaultRewardTokenHash);
      await approveVaultRewardTokens(
        signers["owner"],
        DUMMY_VAULT_EMPTY_CONTRACT.address,
        "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        registry,
      );

      contracts = { registry, strategyProvider };
      // console.log("Registry address: ", contracts["registry"].address);
      // console.log("Strategy provider address: ", contracts["strategyProvider"].address);

      // console.log("Contracts deployed");
    } catch (error) {
      console.log(error);
    }
  });

  // for (let i = 0; i < 2; i++) {
  for (let i = 0; i < scenario.stories.length; i++) {
    const story = scenario.stories[i];
    it(`${story.description}`, async () => {
      for (let i = 0; i < story.setActions.length; i++) {
        const action: any = story.setActions[i];
        switch (action.action) {
          case "setVaultRewardStrategy(bytes32,(uint256,uint256))": {
            const { vaultRewardStrategy }: ARGUMENTS = action.args;
            if (Array.isArray(vaultRewardStrategy) && vaultRewardStrategy.length > 0) {
              if (action.expect === "success") {
                await contracts[action.contract]
                  .connect(signers[action.executor])
                  [action.action](vaultRewardTokenHash, vaultRewardStrategy);
              } else {
                await expect(
                  contracts[action.contract]
                    .connect(signers[action.executor])
                    [action.action](vaultRewardTokenHash, vaultRewardStrategy),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(vaultRewardStrategy, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setBestStrategy(string,bytes32,bytes32)":
          case "setBestDefaultStrategy(string,bytes32,bytes32)": {
            // console.log("Set Action: ", action.action);
            const { strategy, token, riskProfile }: ARGUMENTS = action.args;
            // console.log("Step-1");
            if (strategy && token && riskProfile) {
              // console.log("Step-2 strategy: ", strategy);
              // console.log("token: ", token);
              // console.log("riskProfile: ", riskProfile);
              const strategyHash = generateStrategyHash(strategy, token);
              const tokenHash = getSoliditySHA3Hash(["address[]"], [[token]]);

              if (action.expect === "success") {
                // console.log("Success: StrategyProvider address - ", contracts[action.contract].address);
                await contracts[action.contract]
                  .connect(signers[action.executor])
                  [action.action](riskProfile, tokenHash, strategyHash);
                // console.log("Set Action. completed");
              } else {
                await expect(
                  contracts[action.contract]
                    .connect(signers[action.executor])
                    [action.action](riskProfile, tokenHash, strategyHash),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(strategy, `args is wrong in ${action.action} testcase`);
            assert.isDefined(token, `args is wrong in ${action.action} testcase`);
            assert.isDefined(riskProfile, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setDefaultStrategyState(uint8)": {
            // console.log("Set Action: ", action.action);
            const { defaultStrategyState }: ARGUMENTS = action.args;
            // console.log("Step-1");
            // console.log("Default state: ", defaultStrategyState)
            if (action.expect === "success") {
              await contracts[action.contract].connect(signers[action.executor])[action.action](defaultStrategyState);
              // console.log("Value: ", value)
            } else {
              await expect(
                contracts[action.contract].connect(signers[action.executor])[action.action](defaultStrategyState),
              ).to.be.revertedWith(action.message);
            }
            assert.isDefined(defaultStrategyState, `args is wrong in ${action.action} testcase`);
            break;
          }
        }
      }
      for (let i = 0; i < story.getActions.length; i++) {
        const action: any = story.getActions[i];
        switch (action.action) {
          case "rpToTokenToDefaultStrategy(string,bytes32)":
          case "rpToTokenToBestStrategy(string,bytes32)": {
            // console.log("Get Action: ", action.action);
            const { riskProfile, token }: ARGUMENTS = action.args;
            // console.log("GetAction Step-1: RiskProfile: ", riskProfile);
            // console.log("token: ", token);
            if (riskProfile && token) {
              // console.log("ContractName: ", action.contract);
              // console.log("Contract Address: ", contracts[action.contract].address);
              const value = await contracts[action.contract][action.action](riskProfile, token);
              // console.log("value: ", value);
              expect(value).to.be.equal(action.expectedValue);
            }
            assert.isDefined(riskProfile, `args is wrong in ${action.action} testcase`);
            assert.isDefined(token, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "vaultRewardTokenHashToVaultRewardTokenStrategy(bytes32)": {
            // console.log("Get Action: ", action.action);
            //   console.log("ContractName: ", action.contract);
            //   console.log("Contract Address: ", contracts[action.contract].address);
            //   console.log("vaultRewardToken hash: ", vaultRewardTokenHash)
            const value = await contracts[action.contract][action.action](vaultRewardTokenHash);
            // console.log("value: ", value);
            expect([+value[0]._hex, +value[1]._hex]).to.have.members(action.expectedValue);

            break;
          }
          case "defaultStrategyState()": {
            // console.log("Get Action: ", action.action);
            // console.log("ContractName: ", action.contract);
            // console.log("Contract Address: ", contracts[action.contract].address);
            const value = await contracts[action.contract][action.action]();
            // console.log("value: ", value);
            expect(value).to.be.equal(action.expectedValue);
            break;
          }
        }
      }
    });
  }
});
