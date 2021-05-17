import { task, types } from "hardhat/config";

import { CONTRACTS } from "../../helpers/type";
import { deployEssentialContracts, deployAdapters } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
task("deploy-adapters", "Deploy Adapter contracts")
  .addParam("deployedOnce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "insert the deployed contract addresses in DB", false, types.boolean)
  .setAction(async ({ deployedOnce, insertindb }, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log(`\tDeploying Essential contracts ...`);
    const essentialContracts: CONTRACTS = await deployEssentialContracts(hre, owner, deployedOnce);
    const essentialContractNames = Object.keys(essentialContracts);
    for (let i = 0; i < essentialContractNames.length; i++) {
      console.log(
        `${essentialContractNames[i].toUpperCase()} address : ${essentialContracts[essentialContractNames[i]].address}`,
      );
      if (insertindb) {
        const err = await insertContractIntoDB(
          essentialContractNames[i],
          essentialContracts[essentialContractNames[i]].address,
        );
        if (err !== "") {
          console.log(err);
        }
      }
    }
    console.log(`\tDeploying Adapter contracts ...`);
    const adaptersContracts: CONTRACTS = await deployAdapters(
      hre,
      owner,
      essentialContracts["registry"].address,
      essentialContracts["harvestCodeProvider"].address,
      essentialContracts["priceOracle"].address,
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