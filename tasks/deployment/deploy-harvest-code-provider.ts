import { task, types } from "hardhat/config";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { deployContract, getContract } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
task("deploy-harvest-code-provider", "Deploy Harvest Code Provider")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("deployedOnce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ deployedOnce, insertindb, registry }, hre) => {
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

    const harvestCodeProvider = await deployContract(
      hre,
      ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
      deployedOnce,
      owner,
      [registryContract.address],
    );

    console.log(`Contract harvestCodeProvider : ${harvestCodeProvider.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(`harvestCodeProvider`, harvestCodeProvider.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
