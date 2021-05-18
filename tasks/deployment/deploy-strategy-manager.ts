import { task, types } from "hardhat/config";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { getContract, deployContract } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
task("deploy-strategy-manager", "Deploy Strategy Manager")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("harvestcodeprovider", "the address of harvestCodeProvider", "", types.string)
  .addParam("deployedOnce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ deployedOnce, insertindb, registry, harvestcodeprovider }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    let registryContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.REGISTRY,
      registry,
      ESSENTIAL_CONTRACTS.REGISTRY_PROXY,
    );
    if (!registryContract) {
      registryContract = await deployRegistry(hre, owner, deployedOnce);
    }

    let harvestCodeProviderContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
      harvestcodeprovider,
    );

    if (!harvestCodeProviderContract) {
      harvestCodeProviderContract = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
        deployedOnce,
        owner,
        [registryContract.address],
      );
    }

    const strategyManagerContract = await deployContract(
      hre,
      ESSENTIAL_CONTRACTS.STRATEGY_MANAGER,
      deployedOnce,
      owner,
      [registryContract.address, harvestCodeProviderContract.address],
    );

    console.log(`Contract strategyManager : ${strategyManagerContract.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(`strategyManager`, strategyManagerContract.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
