import { task, types } from "hardhat/config";
import { getContractInstance, isAddress } from "../../helpers/helpers";

task("get-action", "execute a get action in smart contract")
  .addParam("name", "the name of contract", "", types.string)
  .addParam("address", "the address of contract", "", types.string)
  .addParam("functionabi", "the abi of function", "", types.string)
  .addParam("params", "the param of function", "", types.string)
  .setAction(async ({ name, address, functionabi, params }, hre) => {
    if (name === "") {
      throw new Error("name cannot be empty");
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

    if (params === "") {
      throw new Error("params cannot be empty");
    }

    const convertedParams = params.split(",");

    console.log(convertedParams);

    const contract = await getContractInstance(hre, name, address);

    const value = await contract[functionabi](...convertedParams);

    console.log(`Action: ${functionabi}`);
    console.log(`Params : ${convertedParams}`);
    console.log(`Returned Value : ${value}`);
  });
