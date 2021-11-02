import { task, types } from "hardhat/config";
import { deployRegistry } from "../../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../../helpers/db";
import { ETHEREUM_DEPLOY_REGISTRY } from "../../task-names";

task(ETHEREUM_DEPLOY_REGISTRY, "Deploy Registry")
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ deployedonce, insertindb }, hre) => {
    try {
      const [owner] = await hre.ethers.getSigners();
      console.log("Deploying Registry...");
      const registry = await deployRegistry(hre, owner, deployedonce);
      console.log("Finished deploying registry");
      console.log(`Contract registry : ${registry.address}`);
      if (insertindb) {
        const err = await insertContractIntoDB(`registry`, registry.address);
        if (err !== "") {
          throw err;
        }
      }
    } catch (error) {
      console.error(`${ETHEREUM_DEPLOY_REGISTRY}: `, error);
      throw error;
    }
  });
