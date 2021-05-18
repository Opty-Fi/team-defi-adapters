import { task, types } from "hardhat/config";
import { deployVault, deployRegistry, deployRiskManager } from "../../helpers/contracts-deployments";
import { getTokenInforWithAddress, approveToken } from "../../helpers/contracts-actions";
import { insertContractIntoDB } from "../../helpers/db";
import { ESSENTIAL_CONTRACTS, RISK_PROFILES } from "../../helpers/constants";
import { getContract, deployContract, executeFunc } from "../../helpers/helpers";

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
    const deployedOnce = true;
    if (token === "") {
      throw new Error("token cannot be empty");
    }

    if (riskprofile === "") {
      throw new Error("riskProfile cannot be empty");
    }

    let registryContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.REGISTRY,
      registry,
      ESSENTIAL_CONTRACTS.REGISTRY_PROXY,
    );
    if (!registryContract) {
      registryContract = await deployRegistry(hre, owner, deployedOnce);
    }

    const isApprovedToken = await registryContract.tokens(token);
    if (!isApprovedToken) {
      await approveToken(owner, registryContract, [token]);
    }

    const profile = await registryContract.riskProfiles(RISK_PROFILES[riskprofile].name);
    if (!profile.exists) {
      await executeFunc(registryContract, owner, "addRiskProfile(string,uint8,(uint8,uint8))", [
        RISK_PROFILES[riskprofile].name,
        RISK_PROFILES[riskprofile].steps,
        RISK_PROFILES[riskprofile].poolRating,
      ]);
    }

    let riskManagerContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.RISK_MANAGER,
      riskmanager,
      ESSENTIAL_CONTRACTS.RISK_MANAGER_PROXY,
    );
    if (!riskManagerContract) {
      riskManagerContract = await deployRiskManager(hre, owner, deployedOnce, registryContract.address);
    }

    let strategyManagerContract = await getContract(hre, ESSENTIAL_CONTRACTS.STRATEGY_MANAGER, strategymanager);
    if (!strategyManagerContract) {
      const harvestCodeProvider = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
        deployedOnce,
        owner,
        [registryContract.address],
      );
      strategyManagerContract = await deployContract(hre, ESSENTIAL_CONTRACTS.STRATEGY_MANAGER, deployedOnce, owner, [
        registryContract.address,
        harvestCodeProvider.address,
      ]);
    }

    let optyMinterContract = await getContract(hre, ESSENTIAL_CONTRACTS.OPTY_MINTER, optyminter);
    if (!optyMinterContract) {
      const opty = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY, deployedOnce, owner, [
        registryContract.address,
        0,
      ]);

      optyMinterContract = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY_MINTER, deployedOnce, owner, [
        registryContract.address,
        opty.address,
      ]);
    }

    const { name, symbol } = await getTokenInforWithAddress(hre, token);

    const vault = await deployVault(
      hre,
      registryContract.address,
      riskManagerContract.address,
      strategyManagerContract.address,
      optyMinterContract.address,
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
