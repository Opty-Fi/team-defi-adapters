import { task, types } from "hardhat/config";
import { isAddress } from "../../helpers/helpers";
import { HARVEST_ADAPTER_NAME } from "../../helpers/constants";
import { TypedDefiPools } from "../../helpers/data/index";
task("map-liquiditypools-adapter", "Approve and map liquidity pool to adapter")
  .addParam("adapter", "the address of defi adapter", "", types.string)
  .addParam("adaptername", "the name of defi adapter", "", types.string)
  .addParam("registry", "the address of registry", "", types.string)
  .setAction(async ({ adapter, registry, adaptername }, hre) => {
    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    if (adapter === "") {
      throw new Error("adapter cannot be empty");
    }

    if (!isAddress(adapter)) {
      throw new Error("adapter address is invalid");
    }

    if (adaptername === "") {
      throw new Error("adaptername cannot be empty");
    }

    if (adaptername === HARVEST_ADAPTER_NAME) {
      adaptername = "HarvestV1Adapter";
    }

    if (!TypedDefiPools[adaptername]) {
      throw new Error("wrong adapter name");
    }

    const liquidityPools = TypedDefiPools[adaptername];

    for (const name in liquidityPools) {
      await hre.run("map-liquiditypool-adapter", {
        registry: registry,
        liquiditypool: liquidityPools[name].pool,
        adapter: adapter,
      });
    }

    console.log(`Finished mapping liquidityPools to adapter : ${adaptername}`);
    console.log("------------------");
  });
