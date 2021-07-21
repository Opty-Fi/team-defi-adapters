import { task, types } from "hardhat/config";
import { ADAPTER } from "../../helpers/constants";
import { isAddress } from "../../helpers/helpers";

task("deploy-adapters", "Deploy Adapter contracts")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("harvestcodeprovider", "the address of harvestCodeProvider", "", types.string)
  .addParam("priceoracle", "the address of priceoracle", "", types.string)
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "insert the deployed contract addresses in DB", false, types.boolean)
  .setAction(async ({ registry, harvestcodeprovider, priceoracle, deployedonce, insertindb }, hre) => {
    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    if (harvestcodeprovider === "") {
      throw new Error("harvestcodeprovider cannot be empty");
    }

    if (!isAddress(harvestcodeprovider)) {
      throw new Error("harvestcodeprovider address is invalid");
    }

    if (priceoracle === "") {
      throw new Error("priceoracle cannot be empty");
    }

    if (!isAddress(priceoracle)) {
      throw new Error("priceoracle address is invalid");
    }

    for (const adapter of ADAPTER) {
      try {
        await hre.run("deploy-adapter", {
          registry: registry,
          harvestcodeprovider: harvestcodeprovider,
          priceoracle: priceoracle,
          name: adapter,
          insertindb: insertindb,
          deployedonce: deployedonce,
        });
      } catch (error) {
        console.log(adapter, error);
      }
    }
    console.log("Finished deploying adapters");
  });
