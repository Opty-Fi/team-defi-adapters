import { task, types } from "hardhat/config";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { isAddress } from "../../helpers/helpers";

task("get-action", "execute a get action in smart contract")
  .addParam("name", "the name of contract", "", types.string)
  .addParam("address", "the address of contract", "", types.string)
  .addParam("functionabi", "the abi of function", "", types.string)
  .addOptionalParam("params", "the param of function", "", types.string)
  .setAction(async ({ name, address, functionabi, params }, hre) => {
    if (name === "") {
      throw new Error("name cannot be empty");
    }

    if (!Object.values(ESSENTIAL_CONTRACTS).includes(name)) {
      throw new Error("name doesn't match with the available contracts list");
    }

    if (address === "") {
      throw new Error("address cannot be empty");
    }

    if (!isAddress(address)) {
      throw new Error("adapter address is invalid");
    }

    if (functionabi === "") {
      throw new Error("functionabi cannot be empty");
    }

    const convertedParams = params === "" ? [] : params.split(",");

    const contract = await hre.ethers.getContractAt(name, address);

    const value = await contract[functionabi](...convertedParams);

    console.log(`Action: ${functionabi}`);
    if (convertedParams.length > 0) {
      console.log(`Params : ${convertedParams}`);
    }
    console.log(`Returned Value : ${value}`);
  });