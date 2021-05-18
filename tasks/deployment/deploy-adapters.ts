import { task, types } from "hardhat/config";
import { CONTRACTS } from "../../helpers/type";
import { deployRegistry, deployAdapters } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { getContract, deployContract } from "../../helpers/helpers";
task("deploy-adapters", "Deploy Adapter contracts")
  .addParam("registry", "the address of registry", "", types.string)
  .addParam("harvestcodeprovider", "the address of harvestCodeProvider", "", types.string)
  .addParam("priceoracle", "the address of priceoracle", "", types.string)
  .addParam("deployedOnce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "insert the deployed contract addresses in DB", false, types.boolean)
  .setAction(async ({ registry, harvestcodeprovider, priceoracle, deployedOnce, insertindb }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    let registryContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.REGISTRY,
      registry,
      ESSENTIAL_CONTRACTS.REGISTRY_PROXY,
    );
    if (!registryContract) {
      registryContract = await deployRegistry(hre, owner, deployedOnce);
    }

    let harvestCodeProviderContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.RISK_MANAGER_PROXY,
      harvestcodeprovider,
    );

    if (!harvestCodeProviderContract) {
      harvestCodeProviderContract = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.HARVEST_CODE_PROVIDER,
        deployedOnce,
        owner,
        [registryContract.address],
      );
    }

    let priceOracleContract = await getContract(hre, ESSENTIAL_CONTRACTS.PRICE_ORACLE, priceoracle);
    if (!priceOracleContract) {
      priceOracleContract = await deployContract(hre, ESSENTIAL_CONTRACTS.PRICE_ORACLE, deployedOnce, owner, [
        registryContract.address,
      ]);
    }

    console.log(`\tDeploying Adapter contracts ...`);
    const adaptersContracts: CONTRACTS = await deployAdapters(
      hre,
      owner,
      registryContract.address,
      harvestCodeProviderContract.address,
      priceOracleContract.address,
      deployedOnce,
    );
    const adapterContractNames = Object.keys(adaptersContracts);
    for (let i = 0; i < adapterContractNames.length; i++) {
      console.log(
        `${adapterContractNames[i].toUpperCase()} address : ${adaptersContracts[adapterContractNames[i]].address}`,
      );
      if (insertindb) {
        const err = await insertContractIntoDB(
          adapterContractNames[i],
          adaptersContracts[adapterContractNames[i]].address,
        );
        if (err !== "") {
          console.log(err);
        }
      }
    }
  });
