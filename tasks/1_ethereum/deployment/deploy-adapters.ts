import { task, types } from "hardhat/config";
import { ADAPTERS } from "../../../helpers/constants/adapters";
import { isAddress } from "../../../helpers/helpers";
import TASKS from "../../task-names";
import { eEthereumNetwork } from "../../../helper-hardhat-config";

task(
  `${eEthereumNetwork.ethereum}-${TASKS.DEPLOYMENT_TASKS.DEPLOY_ADAPTERS.NAME}`,
  TASKS.DEPLOYMENT_TASKS.DEPLOY_ADAPTERS.DESCRIPTION,
)
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "insert the deployed contract addresses in DB", false, types.boolean)
  .setAction(async ({ registry, deployedonce, insertindb }, hre) => {
    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    try {
      for (const adapter of ADAPTERS) {
        try {
          await hre.run(`${eEthereumNetwork.ethereum}-${TASKS.DEPLOYMENT_TASKS.DEPLOY_ADAPTER}`, {
            registry: registry,
            name: adapter,
            insertindb: insertindb,
            deployedonce: deployedonce,
          });
          console.log("--------------------");
        } catch (error) {
          throw new Error(`${adapter}, ${error}`);
        }
      }
      console.log("Finished deploying adapters");
    } catch (error) {
      console.error(`${eEthereumNetwork.ethereum}-${TASKS.DEPLOYMENT_TASKS.DEPLOY_ADAPTERS.NAME} : `, error);
      throw error;
    }
  });
