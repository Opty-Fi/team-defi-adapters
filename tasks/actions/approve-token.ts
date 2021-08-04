import { task, types } from "hardhat/config";
import { getContractInstance, isAddress, executeFunc } from "../../helpers/helpers";
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
    const tokensHash = getSoliditySHA3Hash(["address[]"], [[token]]);
    const [tokenAddress] = await registryContract.getTokensHashToTokenList(tokensHash);
    if (getAddress(tokenAddress) == getAddress(token)) {
      console.log(`Token ${token} is already set`);
    } else {
      await approveToken(owner, registryContract, [token]);
      await executeFunc(registryContract, owner, "setTokensHashToTokens(address[])", [[token]]);
      console.log(`Finished approving token`);
    }
  });
