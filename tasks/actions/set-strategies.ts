import { task, types } from "hardhat/config";
import { setStrategy } from "../../helpers/contracts-actions";
import { getContractInstance, isAddress, generateTokenHash } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS, TOKENS } from "../../helpers/constants";
import { TypedStrategies } from "../../helpers/data";

task("set-strategies", "Set strategies")
  .addParam("strategyregistry", "the address of vaultStepInvestStrategyDefinitionRegistry", "", types.string)
  .setAction(async ({ strategyregistry }, hre) => {
    if (strategyregistry === "") {
      throw new Error("strategyregistry cannot be empty");
    }

    if (!isAddress(strategyregistry)) {
      throw new Error("strategyregistry address is invalid");
    }

    const strategyRegistryContract = await getContractInstance(
      hre,
      ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
      strategyregistry,
    );

    for (let i = 0; i < TypedStrategies.length; i++) {
      try {
        const tokensHash = generateTokenHash([TOKENS[TypedStrategies[i].token]]);
        await setStrategy(TypedStrategies[i].strategy, tokensHash, strategyRegistryContract);
        console.log(`Set successfully strategy : ${TypedStrategies[i].strategyName}`);
      } catch (error) {
        console.log(`Got error with ${TypedStrategies[i].strategyName} : `, error.message);
      }
    }
  });
