import { expect } from "chai";
import hre from "hardhat";
import { Signer } from "ethers";
import { CONTRACTS } from "../../helpers/type";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { deployContract } from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS, UPGRADABLE_CONTRACTS } from "../../helpers/constants";
import scenario from "./scenarios/contract-upgradability.json";

describe(scenario.title, () => {
  const contracts: CONTRACTS = {};
  let users: { [key: string]: Signer };
  for (let i = 0; i < UPGRADABLE_CONTRACTS.length; i++) {
    const testingContract = UPGRADABLE_CONTRACTS[i];

    describe(testingContract, () => {
      before(async () => {
        const [owner, user1, treasury] = await hre.ethers.getSigners();
        users = { owner, user1, treasury };

        if (testingContract !== ESSENTIAL_CONTRACTS.REGISTRY) {
          contracts["registry"] = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
          contracts["proxy"] = await deployContract(hre, `${testingContract}Proxy`, TESTING_DEPLOYMENT_ONCE, owner, [
            contracts["registry"].address,
          ]);
        } else {
          contracts["proxy"] = await deployContract(hre, `${testingContract}Proxy`, TESTING_DEPLOYMENT_ONCE, owner, []);
        }
      });

      for (let i = 0; i < scenario.stories.length; i++) {
        const story = scenario.stories[i];
        it(story.description, async () => {
          for (let i = 0; i < story.actions.length; i++) {
            const action = story.actions[i];
            switch (action.action) {
              case "deployContract": {
                contracts["main"] = await deployContract(
                  hre,
                  testingContract,
                  TESTING_DEPLOYMENT_ONCE,
                  users[action.executor],
                  testingContract !== ESSENTIAL_CONTRACTS.REGISTRY ? [contracts["registry"].address] : [],
                );
                contracts["mainProxy"] = await hre.ethers.getContractAt(
                  testingContract,
                  contracts["proxy"].address,
                  users[action.executor],
                );
                break;
              }
              case "deployNewContract": {
                contracts["main"] = await deployContract(
                  hre,
                  `Test${testingContract}Upgradability`,
                  TESTING_DEPLOYMENT_ONCE,
                  users[action.executor],
                  testingContract !== ESSENTIAL_CONTRACTS.REGISTRY ? [contracts["registry"].address] : [],
                );
                contracts["mainProxy"] = await hre.ethers.getContractAt(
                  `Test${testingContract}Upgradability`,
                  contracts["proxy"].address,
                  users[action.executor],
                );
                break;
              }
              case "setPendingImplementation(address)": {
                if (action.expect === "success") {
                  await contracts[action.contract]
                    .connect(users[action.executor])
                    [action.action](contracts["main"].address);
                } else {
                  await expect(
                    contracts[action.contract]
                      .connect(users[action.executor])
                      [action.action](contracts["main"].address),
                  ).to.be.revertedWith(action.message);
                }
                break;
              }
              case "become(address)": {
                if (action.expect === "success") {
                  await contracts[action.contract]
                    .connect(users[action.executor])
                    [action.action](contracts["proxy"].address);
                } else {
                  if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                    await expect(
                      contracts[action.contract]
                        .connect(users[action.executor])
                        [action.action](contracts["proxy"].address),
                    ).to.be.revertedWith("!governance");
                  } else {
                    await expect(
                      contracts[action.contract]
                        .connect(users[action.executor])
                        [action.action](contracts["proxy"].address),
                    ).to.be.revertedWith("caller is not having governance");
                  }
                }
                break;
              }
              case "checkMainContractFunction": {
                if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                  await contracts["mainProxy"].getTokenHashes();
                  await contracts["mainProxy"].setTreasury(await users["treasury"].getAddress());
                }
                break;
              }
              case "checkTestingContractFunction": {
                expect(await contracts["mainProxy"].isNewContract()).to.be.eq(true);
                //expect(await contracts["mainProxy"].value()).to.be.eq("NewContract");
                break;
              }
              case "verifyOldValue": {
                if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                  expect(await contracts["mainProxy"].getTreasury()).to.be.eq(await users["treasury"].getAddress());
                }
                break;
              }
            }
          }
        });
      }
    });
  }
});
