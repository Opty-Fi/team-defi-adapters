import { task, types } from "hardhat/config";
import { RISK_PROFILES, TOKENS } from "../../helpers/constants";
task("deploy-vaults", "Deploy Core Vaults")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("riskmanager", "the address of riskManager", "", types.string)
  .addParam("strategymanager", "the address of strategyManager", "", types.string)
  .addParam("optyminter", "the address of opty Minter", "", types.string)
  .addParam("insertDB", "allow inserting to database", false, types.boolean)
  .setAction(async ({ registry, riskmanager, strategymanager, optyminter, insertDB }, hre) => {
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
          insertDB: insertDB,
        });
      }
    }
  });
