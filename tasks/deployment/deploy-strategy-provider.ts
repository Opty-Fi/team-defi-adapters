import { task, types } from "hardhat/config";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { deployContract, executeFunc, getContract } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
task("deploy-strategy-provider", "Deploy Strategy Provider")
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

    const strategyProvider = await deployContract(hre, ESSENTIAL_CONTRACTS.STRATEGY_PROVIDER, deployedOnce, owner, [
      registryContract.address,
    ]);

    await executeFunc(registryContract, owner, "setStrategyProvider(address)", [strategyProvider.address]);

    console.log(`Contract strategyProvider : ${strategyProvider.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(`strategyProvider`, strategyProvider.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
