import { expect, assert } from "chai";
import hre from "hardhat";
import { CONTRACTS } from "../../helpers/type";
import { deployContract } from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, TESTING_CONTRACTS } from "../../helpers/constants";
import { deployOptyStakingRateBalancer, deployRegistry } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/opty-staking-rate-balancer-roles.json";

type ARGUMENTS = {
  addressName?: string;
  multiplier?: number;
  stakingVaultOPTYAllocation?: number;
};

describe(scenario.title, () => {
  let contracts: CONTRACTS = {};
  let signers: any;

  beforeEach(async () => {
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

  // for (let i = 0; i < 4; i++) {
  for (let i = 0; i < scenario.stories.length; i++) {
    const story = scenario.stories[i];
    it(`${story.description}`, async () => {
      for (let i = 0; i < story.setActions.length; i++) {
        const action: any = story.setActions[i];
        switch (action.action) {
          case "setFinanceOperator(address)": {
            const { addressName }: ARGUMENTS = action.args;
            console.log("Set Action: ", action.action);
            console.log("AddressName: ", addressName);
            // console.log("Mulitplier: ", multiplier);
            if (addressName) {
              const newFinanceOperatorAddress = await signers[addressName].getAddress();
              // console.log("Dummy contract address: ", contracts[addressName].address);
              if (action.expect === "success") {
                await contracts[action.contract]
                  .connect(signers[action.executor])
                  [action.action](newFinanceOperatorAddress);
              } else {
                await expect(
                  contracts[action.contract]
                    .connect(signers[action.executor])
                    [action.action](newFinanceOperatorAddress),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
            // assert.isDefined(multiplier, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setStakingVaultMultipliers(address,uint256)": {
            const { addressName, multiplier }: ARGUMENTS = action.args;
            console.log("Set Action: ", action.action);
            console.log("AddressName: ", addressName);
            console.log("Mulitplier: ", multiplier);
            if (addressName && multiplier) {
              console.log("Dummy contract address: ", contracts[addressName].address);
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
            console.log("Set Action: ", action.action);
            console.log("StakingVaultOPTYAllocation: ", stakingVaultOPTYAllocation);
            // console.log("Mulitplier: ", multiplier)
            // console.log("Dummy contract address: ", contracts[addressName].address)
            if (stakingVaultOPTYAllocation) {
              if (action.expect === "success") {
                await contracts[action.contract]
                  .connect(signers[action.executor])
                  [action.action](stakingVaultOPTYAllocation);
              } else {
                await expect(
                  contracts[action.contract]
                    .connect(signers[action.executor])
                    [action.action](stakingVaultOPTYAllocation),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(stakingVaultOPTYAllocation, `args is wrong in ${action.action} testcase`);
            // assert.isDefined(multiplier, `args is wrong in ${action.action} testcase`);
            break;
          }
        }
      }
      for (let i = 0; i < story.getActions.length; i++) {
        const action: any = story.getActions[i];
        switch (action.action) {
          case "stakingVaultMultipliers(address)": {
            const { addressName }: ARGUMENTS = action.args;
            console.log("Get Action: ", action.action);
            console.log("AddressName: ", addressName);
            if (addressName) {
              console.log("Dummy contract address: ", contracts[addressName].address);
              const value = await contracts[action.contract][action.action](contracts[addressName].address);
              console.log("Value: ", +value);
              expect(+value).to.be.equal(+action.expectedValue);
            }
            assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
            // assert.isDefined(tokenHash, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "stakingVaultOPTYAllocation()": {
            // const { addressName }: any = action.args;
            // console.log("Get Action: ", action.action)
            // console.log("AddressName: ", addressName)
            // console.log("Dummy contract address: ", contracts[addressName].address)
            // if (addressName) {
            const value = await contracts[action.contract][action.action]();
            console.log("Value: ", +value);
            expect(+value).to.be.equal(+action.expectedValue);
            // }
            // assert.isDefined(addressName, `args is wrong in ${action.action} testcase`);
            // assert.isDefined(tokenHash, `args is wrong in ${action.action} testcase`);
            break;
          }
        }
      }
    });
  }
});
