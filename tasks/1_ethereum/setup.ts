import { task, types } from "hardhat/config";

import { CONTRACTS } from "../../helpers/type";
import { deployEssentialContracts, deployAdapters } from "../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../helpers/db";
import { ETHEREUM_SETUP } from "../task-names";

task(ETHEREUM_SETUP, "Deploy Registry, HarvestCodeProvider and Adapter contracts and setup all necessary actions")
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", false, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ deployedonce, insertindb }, hre) => {
    console.log(`\tDeploying Infrastructure contracts ...`);
    const [owner] = await hre.ethers.getSigners();
    let essentialContracts: CONTRACTS;

    try {
      essentialContracts = await deployEssentialContracts(hre, owner, deployedonce);
      const essentialContractNames = Object.keys(essentialContracts);
      for (let i = 0; i < essentialContractNames.length; i++) {
        console.log(
          `${essentialContractNames[i].toUpperCase()} address : ${
            essentialContracts[essentialContractNames[i]].address
          }`,
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
      console.log("********************");
    } catch (error) {
      console.error(`deployEssentialContracts: `, error);
      throw error;
    }
    console.log(`\tDeploying Adapter contracts ...`);
    const adaptersContracts: CONTRACTS = await deployAdapters(
      hre,
      owner,
      essentialContracts["registry"].address,
      deployedonce,
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
    console.log("********************");
    console.log("Finished setup task");
  });
