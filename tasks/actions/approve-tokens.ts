import { task, types } from "hardhat/config";
import { isAddress } from "../../helpers/helpers";
import { TypedTokens } from "../../helpers/data";
import { APPROVE_TOKENS } from "../task-names";

task(APPROVE_TOKENS, "Approve Tokens")
  .addParam("registry", "the address of registry", "", types.string)
  .setAction(async ({ registry }, hre) => {
    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (!isAddress(registry)) {
      throw new Error("registry address is invalid");
    }

    const tokensName = Object.keys(TypedTokens);
    for (let i = 0; i < tokensName.length; i++) {
      await hre.run("approve-token", {
        registry: registry,
        token: TypedTokens[tokensName[i]],
      });
      console.log("---------------");
    }

    console.log(`Finished approving tokens`);
  });
