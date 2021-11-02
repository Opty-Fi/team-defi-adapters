import { task, types } from "hardhat/config";
import { ADAPTERS } from "../../../helpers/constants";
import { isAddress } from "../../../helpers/helpers";
import { ETHEREUM_DEPLOY_ADAPTER, ETHEREUM_DEPLOY_ADAPTERS } from "../../task-names";

task(ETHEREUM_DEPLOY_ADAPTERS, "Deploy Adapter contracts")
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
          await hre.run(ETHEREUM_DEPLOY_ADAPTER, {
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
      console.error(`${ETHEREUM_DEPLOY_ADAPTERS}: `, error);
      throw error;
    }
  });
