import { expect, assert } from "chai";
import hre from "hardhat";
import { CONTRACTS } from "../../helpers/type";
import { deployContract } from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, TESTING_CONTRACTS } from "../../helpers/constants";
import { deployOptyStakingRateBalancer, deployRegistry } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/opty-staking-rate-balancer.json";

type ARGUMENTS = {
  addressName?: string;
  multiplier?: number;
  stakingVaultOPTYAllocation?: number;
};

describe(scenario.title, () => {
  let contracts: CONTRACTS = {};
  let signers: any;

  before(async () => {
    try {
      const [owner, user1] = await hre.ethers.getSigners();
      const financeOperator = owner;
      signers = { owner, financeOperator, user1 };
      const registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
      const optyStakingRateBalancer = await deployOptyStakingRateBalancer(
        hre,
        owner,
        TESTING_DEPLOYMENT_ONCE,
        registry.address,
      );
      const dummyOptyStakingVaultEmptyContract = await deployContract(
        hre,
        TESTING_CONTRACTS.TEST_DUMMY_EMPTY_CONTRACT,
        TESTING_DEPLOYMENT_ONCE,
        owner,
        [],
      );
      contracts = { registry, optyStakingRateBalancer, dummyOptyStakingVaultEmptyContract };
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < scenario.stories.length; i++) {
    const story = scenario.stories[i];
    it(`${story.description}`, async () => {
      for (let i = 0; i < story.setActions.length; i++) {
        const action: any = story.setActions[i];
        await setAndCleanActions(action);
      }
      for (let i = 0; i < story.getActions.length; i++) {
        const action: any = story.getActions[i];
        switch (action.action) {
          case "stakingVaultMultipliers(address)": {
            const { addressName }: ARGUMENTS = action.args;
            if (addressName) {
              expect(+(await contracts[action.contract][action.action](contracts[addressName].address))).to.be.equal(
                +action.expectedValue,
              );
            }
            assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "stakingVaultOPTYAllocation()": {
            expect(+(await contracts[action.contract][action.action]())).to.be.equal(+action.expectedValue);
            break;
          }
        }
      }
      for (let i = 0; i < story.cleanActions.length; i++) {
        const action: any = story.cleanActions[i];
        await setAndCleanActions(action);
      }
    });
  }

  async function setAndCleanActions(action: any) {
    switch (action.action) {
      case "setFinanceOperator(address)": {
        const { addressName }: ARGUMENTS = action.args;
        if (addressName) {
          const newFinanceOperatorAddress = await signers[addressName].getAddress();
          if (action.expect === "success") {
            await contracts[action.contract]
              .connect(signers[action.executor])
              [action.action](newFinanceOperatorAddress);
          } else {
            await expect(
              contracts[action.contract].connect(signers[action.executor])[action.action](newFinanceOperatorAddress),
            ).to.be.revertedWith(action.message);
          }
        }
        assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
        break;
      }
      case "setStakingVaultMultipliers(address,uint256)": {
        const { addressName, multiplier }: ARGUMENTS = action.args;
        if (addressName && multiplier) {
          if (action.expect === "success") {
            await contracts[action.contract]
              .connect(signers[action.executor])
              [action.action](contracts[addressName].address, multiplier);
          } else {
            await expect(
              contracts[action.contract]
                .connect(signers[action.executor])
                [action.action](contracts[addressName].address, multiplier),
            ).to.be.revertedWith(action.message);
          }
        }
        assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
        assert.isDefined(multiplier, `args is wrong in ${action.action} testcase`);
        break;
      }
      case "setStakingVaultOPTYAllocation(uint256)": {
        const { stakingVaultOPTYAllocation }: ARGUMENTS = action.args;
        if (stakingVaultOPTYAllocation) {
          if (action.expect === "success") {
            await contracts[action.contract]
              .connect(signers[action.executor])
              [action.action](stakingVaultOPTYAllocation);
          } else {
            await expect(
              contracts[action.contract].connect(signers[action.executor])[action.action](stakingVaultOPTYAllocation),
            ).to.be.revertedWith(action.message);
          }
        }
        assert.isDefined(stakingVaultOPTYAllocation, `args is wrong in ${action.action} testcase`);
        break;
      }
    }
  }
});
