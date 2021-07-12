import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract } from "ethers";
import { CONTRACTS, STRATEGY_DATA } from "../../helpers/type";
import { generateStrategyHash, deployContract } from "../../helpers/helpers";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS, TESTING_CONTRACTS } from "../../helpers/constants";
import { deployRegistry } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/strategy-provider.json";
import { approveVaultRewardTokens } from "../../helpers/contracts-actions";

type ARGUMENTS = {
  riskProfile?: string;
  strategy?: STRATEGY_DATA[];
  token?: string;
  tokenHash?: string;
  defaultStrategyState?: number;
  vaultRewardStrategy?: number[];
};

describe(scenario.title, () => {
  let contracts: CONTRACTS = {};
  let signers: any;
  let DUMMY_VAULT_EMPTY_CONTRACT: Contract;
  let vaultRewardTokenHash: string;

  beforeEach(async () => {
    try {
      const [owner, user1] = await hre.ethers.getSigners();
      const strategyOperator = owner;
      signers = { owner, strategyOperator, user1 };
      const registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
      DUMMY_VAULT_EMPTY_CONTRACT = await deployContract(
        hre,
        TESTING_CONTRACTS.TEST_DUMMY_EMPTY_CONTRACT,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [],
      );
      const DAI_TOKEN = "0x6b175474e89094c44da98b954eedeac495271d0f";
      await registry["addRiskProfile(string,uint8,(uint8,uint8))"]("RP1", 1, [0, 10]);
      await registry["approveToken(address)"](DAI_TOKEN);
      await registry["setTokensHashToTokens(address[])"]([DAI_TOKEN]);

      const strategyProvider = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.STRATEGY_PROVIDER,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [registry.address],
      );

      const COMP_TOKEN = "0xc00e94Cb662C3520282E6f5717214004A7f26888";
      vaultRewardTokenHash = getSoliditySHA3Hash(["address[]"], [[DUMMY_VAULT_EMPTY_CONTRACT.address, COMP_TOKEN]]);
      await approveVaultRewardTokens(signers["owner"], DUMMY_VAULT_EMPTY_CONTRACT.address, COMP_TOKEN, registry);
      contracts = { registry, strategyProvider };
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
            const { strategy, token, riskProfile }: ARGUMENTS = action.args;
            if (strategy && token && riskProfile) {
              const strategyHash = generateStrategyHash(strategy, token);
              const tokenHash = getSoliditySHA3Hash(["address[]"], [[token]]);

              if (action.expect === "success") {
                await contracts[action.contract]
                  .connect(signers[action.executor])
                  [action.action](riskProfile, tokenHash, strategyHash);
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
            const { defaultStrategyState }: ARGUMENTS = action.args;
            if (action.expect === "success") {
              await contracts[action.contract].connect(signers[action.executor])[action.action](defaultStrategyState);
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
            const { riskProfile, tokenHash }: ARGUMENTS = action.args;
            if (riskProfile && tokenHash) {
              const value = await contracts[action.contract][action.action](riskProfile, tokenHash);
              expect(value).to.be.equal(action.expectedValue);
            }
            assert.isDefined(riskProfile, `args is wrong in ${action.action} testcase`);
            assert.isDefined(tokenHash, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "vaultRewardTokenHashToVaultRewardTokenStrategy(bytes32)": {
            const value = await contracts[action.contract][action.action](vaultRewardTokenHash);
            expect([+value[0]._hex, +value[1]._hex]).to.have.members(action.expectedValue);
            break;
          }
          case "defaultStrategyState()": {
            const value = await contracts[action.contract][action.action]();
            expect(value).to.be.equal(action.expectedValue);
            break;
          }
        }
      }
    });
  }
});
