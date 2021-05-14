import { task, types } from "hardhat/config";

import { CONTRACTS } from "../../helpers/type";
import { deployEssentialContracts, deployAdapters } from "../../helpers/contracts-deployments";
task("deploy-adapters", "Deploy Adapter contracts")
  .addParam("deployedOnce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .setAction(async ({ deployedOnce }, hre) => {
    console.log(`\tDeploying Essential contracts ...`);
    const [owner] = await hre.ethers.getSigners();
    console.log("Owner: ", owner);
    // !true ? process.exit(1) : "";
    const essentialContracts: CONTRACTS = await deployEssentialContracts(hre, owner, deployedOnce);
    const essentialContractNames = Object.keys(essentialContracts);
    console.log("Essential contract names: ", essentialContractNames);
    for (let i = 0; i < essentialContractNames.length; i++) {
      console.log(
        `${essentialContractNames[i].toUpperCase()} address : ${essentialContracts[essentialContractNames[i]].address}`,
      );
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
    console.log("Adapter Names: ", adapterContractNames);
    for (let i = 0; i < adapterContractNames.length; i++) {
      console.log(
        `${adapterContractNames[i].toUpperCase()} address : ${adaptersContracts[adapterContractNames[i]].address}`,
      );
    }
  });
