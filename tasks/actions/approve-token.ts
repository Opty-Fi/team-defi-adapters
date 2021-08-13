import { task, types } from "hardhat/config";
import { getContractInstance, isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { approveToken } from "../../helpers/contracts-actions";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { getAddress } from "ethers/lib/utils";

task("approve-token", "Approve Token")
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

    const registryContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.REGISTRY, registry);
    const tokensHash = getSoliditySHA3Hash(["address[]"], [[getAddress(token)]]);
    const result = await registryContract.getTokensHashToTokenList(tokensHash);
    if (result.length == 1 && getAddress(result[0]) == getAddress(token)) {
      console.log(`Token ${token} is already set`);
    } else {
      // this function also sets tokens hash to token
      await approveToken(owner, registryContract, [token]);
      console.log(`Finished approving token and setting tokens hash`);
    }
  });
