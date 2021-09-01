import { task, types } from "hardhat/config";
import { insertContractIntoDB } from "../../helpers/db";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { deployOptyStakingRateBalancer } from "../../helpers/contracts-deployments";
import { isAddress, executeFunc, getContractInstance } from "../../helpers/helpers";

task("deploy-opty-staking-rate-balancer", "Deploy Opty Staking Rate Balancer")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ deployedonce, insertindb, registry }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    const optyStakingRateBalancer = await deployOptyStakingRateBalancer(hre, owner, deployedonce, registry);

    console.log("Finished deploying OptyStakingRateBalancer");

    console.log(`Contract optyStakingRateBalancer : ${optyStakingRateBalancer.address}`);

    const registryContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.REGISTRY, registry);

    await executeFunc(registryContract, owner, "setOPTYStakingRateBalancer(address)", [
      optyStakingRateBalancer.address,
    ]);

    if (insertindb) {
      const err = await insertContractIntoDB(`optyStakingRateBalancer`, optyStakingRateBalancer.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
