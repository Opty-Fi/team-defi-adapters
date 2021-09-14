import { task, types } from "hardhat/config";
import { getContractInstance, isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS, ADDRESS_ETH } from "../../helpers/constants";
import { approveAndSetTokenHashToToken } from "../../helpers/contracts-actions";
import { getAddress } from "ethers/lib/utils";
import { APPROVE_TOKEN } from "../task-names";

task(APPROVE_TOKEN, "Approve Token")
  .addParam("token", "the address of token", "", types.string)
  .addParam("registry", "the address of registry", "", types.string)
  .setAction(async ({ token, registry }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    if (token === "") {
      throw new Error("token cannot be empty");
    }

    if (!isAddress(token)) {
      throw new Error("token address is invalid");
    }

    if (getAddress(token) !== getAddress(ADDRESS_ETH)) {
      const registryContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.REGISTRY, registry);
      try {
        await approveAndSetTokenHashToToken(owner, registryContract, token);
        console.log(`Finished approving token: ${token}`);
      } catch (error) {
        console.log(`Got error : ${error.message}`);
      }
    }
  });
