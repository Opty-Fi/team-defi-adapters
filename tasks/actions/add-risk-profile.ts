import { task, types } from "hardhat/config";
import { getContractInstance, isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { addRiskProfile } from "../../helpers/contracts-actions";

task("add-risk-profile", "Add Risk Profile")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("name", "the name of risk profile", "", types.string)
  .addParam("canborrow", "whether risk profile can borrow or not", false, types.boolean)
  .addParam("lowestrating", "the lowest rating", 0, types.int)
  .addParam("highestrating", "the highest rating", 0, types.int)
  .setAction(async ({ name, canborrow, lowestrating, highestrating, registry }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    if (name === "") {
      throw new Error("name cannot be empty");
    }

    if (lowestrating === 0 || highestrating === 0 || highestrating < lowestrating) {
      throw new Error("rating range is invalid");
    }

    const registryContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.REGISTRY, registry);
    await addRiskProfile(registryContract, owner, name, canborrow, [lowestrating, highestrating]);

    console.log("Finished adding risk profile");
  });
