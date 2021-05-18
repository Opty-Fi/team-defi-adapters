import { task, types } from "hardhat/config";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { setStrategy } from "../../helpers/contracts-actions";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { getContract, deployContract, executeFunc } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS, TOKENS } from "../../helpers/constants";
import { TypedStrategies } from "../../helpers/data";
task("set-strategies", "Set Strategies")
  .addParam("strategyregistry", "the address of vaultStepInvestStrategyDefinitionRegistry", "", types.string)
  .setAction(async ({ strategyregistry }, hre) => {
    const [owner] = await hre.ethers.getSigners();
    const deployedOnce = true;
    let strategyRegistryContract = await getContract(
      hre,
      ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
      strategyregistry,
    );

    if (!strategyRegistryContract) {
      const registryContract = await deployRegistry(hre, owner, deployedOnce);
      strategyRegistryContract = await deployContract(
        hre,
        ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
        deployedOnce,
        owner,
        [registryContract.address],
      );
      await executeFunc(registryContract, owner, "setVaultStepInvestStrategyDefinitionRegistry(address)", [
        strategyRegistryContract.address,
      ]);
    }

    for (let i = 0; i < TypedStrategies.length; i++) {
      try {
        const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[TypedStrategies[i].token]]]);
        await setStrategy(TypedStrategies[i].strategy, tokensHash, strategyRegistryContract);
        console.log(`Set successfully strategy : ${TypedStrategies[i].strategyName}`);
      } catch (error) {
        console.log(`Got error with ${TypedStrategies[i].strategyName} : `, error.message);
      }
    }
  });
