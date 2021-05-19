import { task, types } from "hardhat/config";
import { deployVault } from "../../helpers/contracts-deployments";
import { getTokenInforWithAddress } from "../../helpers/contracts-actions";
import { insertContractIntoDB } from "../../helpers/db";

task("deploy-vault", "Deploy Vault")
  .addParam("token", "the address of underlying token", "", types.string)
  .addParam("riskprofile", "the address of underlying token", "", types.string)
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("riskmanager", "the address of riskManager", "", types.string)
  .addParam("strategymanager", "the address of strategyManager", "", types.string)
  .addParam("optyminter", "the address of opty Minter", "", types.string)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ token, riskprofile, registry, riskmanager, strategymanager, optyminter, insertindb }, hre) => {
    const [owner, admin] = await hre.ethers.getSigners();

    if (token === "") {
      throw new Error("token cannot be empty");
    }

    if (riskprofile === "") {
      throw new Error("riskProfile cannot be empty");
    }

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

    const { name, symbol } = await getTokenInforWithAddress(hre, token);

    const vault = await deployVault(
      hre,
      registry,
      riskmanager,
      strategymanager,
      optyminter,
      token,
      owner,
      admin,
      name,
      symbol,
      riskprofile,
      false,
    );

    console.log(`Contract ${symbol}-${riskprofile}: ${vault.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(`${symbol}-${riskprofile}`, vault.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });
