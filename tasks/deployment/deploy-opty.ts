import { task, types } from "hardhat/config";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { getContract, deployContract } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
task("deploy-opty", "Deploy Opty")
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

    const opty = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY, deployedOnce, owner, [
      registryContract.address,
      100000000000000,
    ]);

    const optyMinter = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY_MINTER, deployedOnce, owner, [
      registryContract.address,
      opty.address,
    ]);

    console.log(`Contract opty : ${opty.address}`);
    console.log(`Contract optyMinter : ${optyMinter.address}`);

    if (insertindb) {
      let err = await insertContractIntoDB(`opty`, opty.address);
      err = await insertContractIntoDB(`optyMinter`, optyMinter.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
