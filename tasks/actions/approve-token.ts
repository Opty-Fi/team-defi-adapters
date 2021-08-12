import { task, types } from "hardhat/config";
import { getContractInstance, isAddress, executeFunc } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS, ADDRESS_ETH } from "../../helpers/constants";
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

    if (token !== ADDRESS_ETH) {
      const registryContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.REGISTRY, registry);

      const isApprovedToken = await registryContract.isApprovedToken(token);

      if (isApprovedToken) {
        console.log(`Token ${token} is already approved`);
      } else {
        await executeFunc(registryContract, owner, "approveToken(address)", [token]);
        console.log(`Finished approving token: ${token}`);
      }

      const tokensHash = getSoliditySHA3Hash(["address[]"], [[token]]);
      const [tokenAddress] = await registryContract.getTokensHashToTokenList(tokensHash);

      if (isAddress(tokenAddress) && getAddress(tokenAddress) == getAddress(token)) {
        console.log(`Token ${token} is already set`);
      } else {
        await executeFunc(registryContract, owner, "setTokensHashToTokens(address[])", [[token]]);
        console.log(`Finished setting tokensHash to token: ${token}`);
      }
    }
  });
