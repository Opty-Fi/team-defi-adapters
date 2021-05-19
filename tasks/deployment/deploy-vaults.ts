import { task, types } from "hardhat/config";
import { RISK_PROFILES, TOKENS } from "../../helpers/constants";

task("deploy-vaults", "Deploy Core Vaults")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("riskmanager", "the address of riskManager", "", types.string)
  .addParam("strategymanager", "the address of strategyManager", "", types.string)
  .addParam("optyminter", "the address of opty Minter", "", types.string)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ registry, riskmanager, strategymanager, optyminter, insertindb }, hre) => {
    if (registry === "") {
      throw new Error("registry cannot be empty");
    }

    if (riskmanager === "") {
      throw new Error("riskmanager cannot be empty");
    }

    if (strategymanager === "") {
      throw new Error("strategymanager cannot be empty");
    }

    if (optyminter === "") {
      throw new Error("optyminter cannot be empty");
    }

    for (const token in TOKENS) {
      if (token === "CHI") {
        continue;
      }
      for (const riskProfile of Object.keys(RISK_PROFILES)) {
        await hre.run("deploy-vault", {
          token: TOKENS[token],
          riskprofile: riskProfile,
          registry: registry,
          riskmanager: riskmanager,
          strategymanager: strategymanager,
          optyminter: optyminter,
          insertindb: insertindb,
        });
      }
    }
  });
