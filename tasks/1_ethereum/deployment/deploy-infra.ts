import { task, types } from "hardhat/config";
import { CONTRACTS } from "../../../helpers/type";
import { deployEssentialContracts } from "../../../helpers/contracts-deployments";
import { insertContractIntoDB } from "../../../helpers/db";
import TASKS from "../../task-names";
import { eEthereumNetwork } from "../../../helper-hardhat-config";

task(
  `${eEthereumNetwork.ethereum}-${TASKS.DEPLOYMENT_TASKS.DEPLOY_INFRA.NAME}`,
  TASKS.DEPLOYMENT_TASKS.DEPLOY_INFRA.DESCRIPTION,
)
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", true, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ deployedonce, insertindb }, hre) => {
    try {
      console.log(`\tDeploying Infrastructure contracts ...`);
      const [owner] = await hre.ethers.getSigners();
      const essentialContracts: CONTRACTS = await deployEssentialContracts(hre, owner, deployedonce);
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
            throw err;
          }
        }
      }
      console.log("Finished deploying infrastructure contracts");
    } catch (error) {
      console.error(`${eEthereumNetwork.ethereum}-${TASKS.DEPLOYMENT_TASKS.DEPLOY_INFRA.NAME} : `, error);
      throw error;
    }
  });
