import { task, types } from "hardhat/config";
import { isAddress } from "../../helpers/helpers";
import { MAX_DEPOSIT_MODE, ADDRESS_ZERO } from "../../helpers/constants";
task("set-max-deposit", "Set max deposit amount for adapter")
  .addParam("adapter", "the address of defi adapter", "", types.string)
  .addParam("amount", "the max deposit amount", "0", types.string)
  .addParam("liquiditypool", "the address of liquiditypool", "", types.string)
  .addParam("underlyingtoken", "the address of underlyingToken", "", types.string)
  .addParam("mode", "the mode of max deposit", "", types.string)
  .addOptionalParam("setprotocol", "set amount for Protocol or not", false, types.boolean)
  .setAction(async ({ adapter, mode, amount, liquiditypool, underlyingtoken, setprotocol }, hre) => {
    if (adapter === "") {
      throw new Error("adapter cannot be empty");
    }

    if (!isAddress(adapter)) {
      throw new Error("adapter address is invalid");
    }

    if (+amount <= 0) {
      throw new Error("amount is invalid");
    }

    if (!setprotocol) {
      if (liquiditypool === "") {
        throw new Error("liquiditypool cannot be empty");
      }

      if (!isAddress(liquiditypool)) {
        throw new Error("liquiditypool address is invalid");
      }

      if (mode === "") {
        throw new Error("mode cannot be empty");
      }

      if (MAX_DEPOSIT_MODE[mode.toLowerCase()] === undefined) {
        throw new Error("mode is invalid");
      }

      if (underlyingtoken === "" && mode === "number") {
        throw new Error("underlyingtoken cannot be empty");
      }

      if (underlyingtoken !== "" && !isAddress(underlyingtoken)) {
        throw new Error("underlyingToken address is invalid");
      }
    }

    console.log(`Adapter: ${adapter}`);

    if (liquiditypool !== "") {
      console.log(`Liquidity pool: ${liquiditypool}`);
    }

    if (underlyingtoken !== "") {
      console.log(`UnderlyingToken: ${underlyingtoken}`);
    }

    if (mode !== "") {
      console.log(`Mode: ${mode}`);
    }

    console.log(`Max Deposit: ${amount}`);

    const contract = await hre.ethers.getContractAt("IAdapterFull", adapter);
    try {
      if (setprotocol) {
        await contract.setMaxDepositProtocolPct(amount);
      } else {
        switch (mode.toLowerCase()) {
          case "number": {
            await contract.setMaxDepositAmount(liquiditypool, underlyingtoken ? underlyingtoken : ADDRESS_ZERO, amount);
            break;
          }
          case "pct": {
            await contract.setMaxDepositPoolPct(liquiditypool, amount);
            break;
          }
        }
      }
    } catch (error) {
      console.log(`Got error : ${error}`);
    }

    console.log(`Finished setting max deposit`);
  });
