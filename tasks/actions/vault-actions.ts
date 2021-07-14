import { task, types } from "hardhat/config";
import { getContractInstance, isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";

task("vault-actions", "perform actions in Vault")
  .addParam("vault", "the address of vault", "", types.string)
  .addParam("action", "deposit, withdraw or rebalance", "", types.string)
  .addParam("withrebalance", "do action with rebalance", false, types.boolean)
  .addParam("useall", "decide to deposit or withdraw all available token", false, types.boolean)
  .addParam("amount", "amount of token", 0, types.int)
  .setAction(async ({ vault, action, withrebalance, amount, useall }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    const ACTIONS = ["DEPOSIT", "WITHDRAW", "REBALANCE"];
    if (vault === "") {
      throw new Error("vault cannot be empty");
    }

    if (!isAddress(vault)) {
      throw new Error("vault address is invalid");
    }

    if (!ACTIONS.includes(action.toUpperCase())) {
      throw new Error("action is invalid");
    }

    if (amount <= 0 && action.toUpperCase() != "REBALANCE") {
      throw new Error("amount is not set");
    }

    const vaultContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.VAULT, vault);

    const tokenAddress = await vaultContract.underlyingToken();

    const tokenContract = await getContractInstance(hre, ESSENTIAL_CONTRACTS.ERC20, tokenAddress);

    switch (action.toUpperCase()) {
      case "DEPOSIT": {
        let checkedAmount = amount;
        if (useall) {
          const userAddress = await owner.getAddress();
          checkedAmount = await tokenContract.balanceOf(userAddress);
        }
        try {
          await tokenContract.approve(vault, checkedAmount.toString());
          if (withrebalance) {
            await vaultContract.userDepositRebalance(checkedAmount.toString());
            console.log("Deposit with rebalance successfully");
          } else {
            await vaultContract.userDeposit(checkedAmount.toString());
            console.log("Deposit without rebalance successfully");
          }
        } catch (error) {
          console.log(`Got error when depositing : ${error}`);
        }

        break;
      }
      case "WITHDRAW": {
        let checkedAmount = amount;
        if (useall) {
          const userAddress = await owner.getAddress();
          checkedAmount = await vaultContract.balanceOf(userAddress);
        }
        try {
          await vaultContract.userWithdrawRebalance(checkedAmount.toString());
          console.log("Withdraw with rebalance successfully");
        } catch (error) {
          console.log(`Got error when withdrawing : ${error}`);
        }

        break;
      }
      case "REBALANCE": {
        try {
          await vaultContract.rebalance();
          console.log("Rebalance successfully");
        } catch (error) {
          console.log(`Got error when rebalancing : ${error}`);
        }
        break;
      }
    }
  });
