import { task, types } from "hardhat/config";
import { isAddress, getContractInstance } from "../../helpers/helpers";
import { MAX_DEPOSIT_MODE } from "../../helpers/constants";
task("set-max-deposit-mode", "Set max deposit mode for adapter")
  .addParam("adapter", "the address of defi adapter", "", types.string)
  .addParam("mode", "the mode of max deposit", "", types.string)
  .setAction(async ({ adapter, mode }, hre) => {
    if (adapter === "") {
      throw new Error("adapter cannot be empty");
    }

    if (!isAddress(adapter)) {
      throw new Error("adapter address is invalid");
    }

    if (mode === "") {
      throw new Error("type cannot be empty");
    }

    if (MAX_DEPOSIT_MODE[mode.toLowerCase()] === undefined) {
      throw new Error("type is invalid");
    }

    console.log(`Adapter: ${adapter}`);
    console.log(`Mode: ${mode}`);

    const contract = await getContractInstance(hre, "IAdapterFull", adapter);

    try {
      await contract.setMaxDepositProtocolMode(MAX_DEPOSIT_MODE[mode.toLowerCase()]);
    } catch (error) {
      console.log(`Got error : ${error.message}`);
    }

    console.log(`Finished setting max deposit mode`);
  });
