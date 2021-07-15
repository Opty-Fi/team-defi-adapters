import { task, types } from "hardhat/config";
import { setStrategy } from "../../helpers/contracts-actions";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { getContractInstance, isAddress } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS, TOKENS } from "../../helpers/constants";
import { TypedStrategies } from "../../helpers/data";
import { STRATEGY } from "../../helpers/type";
import fs from "fs";

/**
 * strategy.json structure
 * [
 *   {
      "strategyName": string,
      "token": string,
      "strategy": [ 
        {
          "contract": address,
          "outputTokenSymbol": string,
          "outputToken": address,
          "isBorrow": boolean
        }
      ]
      }
    ]
  Ex: 
    [  
      {
        "strategyName": "DAI-deposit-COMPOUND-cDAI",
        "token": "DAI",
        "strategy": [ 
          {
            "contract": "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
            "outputTokenSymbol": "cDAI",
            "outputToken": "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
            "isBorrow": false
          }
        ]
      }
    ]
 */
task("set-strategies", "Set strategies")
  .addParam("strategyregistry", "the address of vaultStepInvestStrategyDefinitionRegistry", "", types.string)
  .addParam("fromfile", "the url of file", "", types.string)
  .setAction(async ({ strategyregistry, fromfile }, hre) => {
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
    let strategies: STRATEGY[] = TypedStrategies;

    if (fromfile) {
      const content = fs.readFileSync(fromfile);
      strategies = JSON.parse(content.toString());
    }

    if (!strategies.length) {
      throw new Error("strategies file is in wrong format");
    }

    for (let i = 0; i < strategies.length; i++) {
      try {
        const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[strategies[i].token]]]);
        await setStrategy(strategies[i].strategy, tokensHash, strategyRegistryContract);
        console.log(`Set successfully strategy : ${strategies[i].strategyName}`);
      } catch (error) {
        console.error(`Got error with ${strategies[i].strategyName} : `, error.message);
      }
    }
    console.log("Finished setting strategies");
  });
