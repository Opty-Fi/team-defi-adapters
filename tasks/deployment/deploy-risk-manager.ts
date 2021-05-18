import { task, types } from "hardhat/config";
import { deployRegistry, deployRiskManager } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { getContract } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
task("deploy-risk-manager", "Deploy Risk Manager")
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

    const riskManagerContract = await deployRiskManager(hre, owner, deployedOnce, registryContract.address);

    console.log(`Contract riskManager : ${riskManagerContract.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(`riskManager`, riskManagerContract.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
