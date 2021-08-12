import { task, types } from "hardhat/config";
import { getContractInstance, isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";

task("balance-of", "Check token balance of address")
  .addParam("token", "the address of token", "", types.string)
  .addParam("user", "the address of user", "", types.string)
  .setAction(async ({ token, user }, hre) => {
    if (user === "") {
      throw new Error("user cannot be empty");
    }

    if (!isAddress(user)) {
      throw new Error("user address is invalid");
    }

    if (token === "") {
      throw new Error("token cannot be empty");
    }

    if (!isAddress(token)) {
      throw new Error("token address is invalid");
    }

    const erc20Contract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.ERC20, token);

    const balance = await erc20Contract.balanceOf(user);

    console.log(`Token: ${token}`);
    console.log(`User: ${user}`);
    console.log(`Balance : ${balance}`);
  });