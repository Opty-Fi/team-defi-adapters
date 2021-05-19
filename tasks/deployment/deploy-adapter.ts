import { task, types } from "hardhat/config";
import { Contract } from "ethers";
import { deployAdapter } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";

task("deploy-adapter", "Deploy Adapter contract")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("harvestcodeprovider", "the address of harvestCodeProvider", "", types.string)
  .addParam("priceoracle", "the address of priceoracle", "", types.string)
  .addParam("name", "the name of adapter", "", types.string)
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "insert the deployed contract addresses in DB", false, types.boolean)
  .setAction(async ({ registry, harvestcodeprovider, priceoracle, name, deployedonce, insertindb }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    if (name === "") {
      throw new Error("name cannot be empty");
    }

    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (harvestcodeprovider === "") {
      throw new Error("harvestcodeprovider cannot be empty");
    }

    if (priceoracle === "") {
      throw new Error("priceoracle cannot be empty");
    }

    const adaptersContract: Contract = await deployAdapter(
      hre,
      owner,
      name,
      registry,
      harvestcodeprovider,
      priceoracle,
      deployedonce,
    );

    console.log(`${name} address : ${adaptersContract.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(name, adaptersContract.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
