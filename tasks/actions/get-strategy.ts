import { task, types } from "hardhat/config";
import { isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";

task("get-strategy", "Get a specific strategy")
  .addParam("strategyhash", "the hash of strategy", "", types.string)
  .addParam("token", "the address of token", "", types.string)
  .addParam("strategyregistry", "the address of vaultStepInvestStrategyDefinitionRegistry", "", types.string)
  .setAction(async ({ strategyregistry, token, strategyhash }, hre) => {
    if (strategyregistry === "") {
      throw new Error("strategyregistry cannot be empty");
    }

    if (!isAddress(strategyregistry)) {
      throw new Error("strategyregistry address is invalid");
    }

    if (token === "") {
      throw new Error("strategyregistry cannot be empty");
    }

    if (!isAddress(token)) {
      throw new Error("strategyregistry address is invalid");
    }

    if (strategyhash === "") {
      throw new Error("strategyhash cannot be empty");
    }

    const strategyRegistryContract = await await hre.ethers.getContractAt(
      ESSENTIAL_CONTRACTS.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
      strategyregistry,
    );

    const strategyDetail = await strategyRegistryContract.getStrategy(strategyhash);
    console.log(`StrategyHash: ${strategyhash}`);
    for (let i = 0; i < strategyDetail[1].length; i++) {
      console.log(`Step: ${i + 1}`);
      console.log(`Pool: ${strategyDetail[1][i].pool}`);
      console.log(`OutputToken: ${strategyDetail[1][i].outputToken}`);
      console.log(`IsBorrow: ${strategyDetail[1][i].isBorrow}`);
    }

    console.log("Finished getting strategy");
  });
