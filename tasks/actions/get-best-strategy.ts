import { task, types } from "hardhat/config";
import { isAddress, generateTokenHash } from "../../helpers/helpers";
import { ESSENTIAL_CONTRACTS, RISK_PROFILES } from "../../helpers/constants";
import { GET_BEST_STRATEGY } from "../task-names";

task(GET_BEST_STRATEGY, "Get best strategy")
  .addParam("token", "the address of token", "", types.string)
  .addParam("rpcode", "the code of risk profile", 0, types.int)
  .addParam("strategyprovider", "the address of strategyProvider", "", types.string)
  .addParam("isdefault", "get default strategy or not", false, types.boolean)
  .setAction(async ({ token, rpcode, strategyprovider, isdefault }, hre) => {
    if (strategyprovider === "") {
      throw new Error("strategyprovider cannot be empty");
    }

    if (!isAddress(strategyprovider)) {
      throw new Error("strategyprovider address is invalid");
    }

    if (token === "") {
      throw new Error("token cannot be empty");
    }

    if (!isAddress(token)) {
      throw new Error("token address is invalid");
    }

    if (RISK_PROFILES.filter(item => item.code === rpcode).length === 0) {
      throw new Error("risk profile is not available");
    }

    try {
      const strategyProvider = await hre.ethers.getContractAt(ESSENTIAL_CONTRACTS.STRATEGY_PROVIDER, strategyprovider);
      const tokensHash = generateTokenHash([token]);
      let strategyHash = "";
      if (isdefault) {
        strategyHash = await strategyProvider.rpToTokenToDefaultStrategy(rpcode, tokensHash);
      } else {
        strategyHash = await strategyProvider.rpToTokenToBestStrategy(rpcode, tokensHash);
      }
      console.log(`StrategyHash : ${strategyHash}`);
    } catch (error: any) {
      console.error(`${GET_BEST_STRATEGY}: `, error);
      throw error;
    }
  });
