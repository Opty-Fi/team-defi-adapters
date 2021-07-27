import { expect } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, ethers } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TESTING_DEPLOYMENT_ONCE } from "../../../helpers/constants";
import { TypedDefiPools, TypedTokens } from "../../../helpers/data";
import { deployAdapters, deployRegistry } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import testAllDeFiAdaptersScenario from "../scenarios/test-all-defi-adapters.json";
import { deployContract } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

type TEST_DEFI_ADAPTER_ARGUMENTS = {
  mode?: string;
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
};

describe(`${testAllDeFiAdaptersScenario.title} - CompoundAdapter`, () => {
  let registry: Contract;
  let users: { [key: string]: Signer };
  const adapterNames = Object.keys(TypedDefiPools);
  let testDeFiAdapter: Contract;
  let adapters: CONTRACTS;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    adapters = await deployAdapters(hre, owner, registry.address, true);
  });

  for (const adapterName of adapterNames) {
    // TODO: In future it can be leverage across all the adapters
    if (adapterName == "CompoundAdapter") {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
        // TODO: Get USDK,LINKUSD,SBTC from DEX
        //  @reason: SAI,REP = Mint is paused
        //  @reason: LINK: CLink's address not detectable as Contract with the blockNumber being used in Hardhat config.
        //  However, it works fine if existing blockNumber is removed with the latest blockNumber.
        //  @reason: TUSD: PoolValue comes `0` with existing blockNumber in hardhat config. However, it works fine with
        //  the latest blockNumber
        //  @reason: ETH: For this, CompoundAdapter has to be updated as cETH and other cTokens have different ABI.
        //  @reason: WBTC has mint paused for latest blockNumbers, However WBTC2 works fine with the latest blockNumber
        if (
          TypedDefiPools[adapterName][pool].tokens.length == 1 &&
          // (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.DAI)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.SAI)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.REP)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.LINK)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.TUSD)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.ETH)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.USDK)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.LINKUSD)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.SBTC))
        ) {
          // for (let i = 0; i < 4; i++) {
          for (let i = 0; i < testAllDeFiAdaptersScenario.stories.length; i++) {
            it(`${pool} - ${testAllDeFiAdaptersScenario.stories[i].description}`, async () => {
              process.env.ADAPTER_DEBUG == "true" && console.log("Pool token name: ", pool);
              const story = testAllDeFiAdaptersScenario.stories[i];

              let underlyingBalanceBefore: BigNumber = ethers.BigNumber.from(0);
              let defaultFundAmount: BigNumber = BigNumber.from("20000");
              defaultFundAmount =
                underlyingTokenAddress == getAddress(TypedTokens.WBTC) ||
                underlyingTokenAddress == getAddress(TypedTokens.COMP) ||
                underlyingTokenAddress == getAddress(TypedTokens.SAI) ||
                underlyingTokenAddress == getAddress(TypedTokens.REP) ||
                underlyingTokenAddress == getAddress(TypedTokens.ETH) ||
                underlyingTokenAddress == getAddress(TypedTokens.DUSD) ||
                underlyingTokenAddress == getAddress(TypedTokens.HUSD) ||
                underlyingTokenAddress == getAddress(TypedTokens.MUSD)
                  ? BigNumber.from("200")
                  : defaultFundAmount;
              let limit: BigNumber = ethers.BigNumber.from(0);
              const timestamp = (await getBlockTimestamp(hre)) * 2;
              const liquidityPool = TypedDefiPools[adapterName][pool].pool;
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const decimals = await ERC20Instance.decimals();
              const adapterAddress = adapters[adapterName].address;

              const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                liquidityPool,
                underlyingTokenAddress,
              );

              for (const action of story.setActions) {
                switch (action.action) {
                  case "setMaxDepositProtocolMode(uint8)": {
                    const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                    const existingMode = await adapters[adapterName].maxDepositProtocolMode();
                    if (existingMode != mode) {
                      await adapters[adapterName][action.action](mode);
                    }
                    break;
                  }
                  case "setMaxDepositProtocolPct(uint256)": {
                    const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                    if (!existingPoolPct.eq(BigNumber.from(0))) {
                      await adapters[adapterName].setMaxDepositPoolPct(liquidityPool, 0);
                    }
                    const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                    const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                    if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                      await adapters[adapterName][action.action](maxDepositProtocolPct);
                    }
                    limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    break;
                  }
                  case "setMaxDepositPoolPct(address,uint256)": {
                    const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                    const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                    if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                      await adapters[adapterName][action.action](liquidityPool, maxDepositPoolPct);
                    }
                    limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    break;
                  }
                  case "setMaxDepositAmount(address,address,uint256)": {
                    let { maxDepositAmount }: any = action.args;
                    maxDepositAmount = BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(decimals));
                    const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    if (!existingDepositAmount.eq(BigNumber.from(maxDepositAmount))) {
                      await adapters[adapterName][action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        maxDepositAmount,
                      );
                    }
                    limit = BigNumber.from(maxDepositAmount);
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    break;
                  }
                  case "fundTestDeFiAdapterContract": {
                    const underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    if (underlyingBalance.lt(defaultFundAmount)) {
                      await fundWalletToken(
                        hre,
                        underlyingTokenAddress,
                        users["owner"],
                        defaultFundAmount,
                        timestamp,
                        testDeFiAdapter.address,
                      );
                    }
                    break;
                  }
                  case "testGetDepositAllCodes(address,address,address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action)
                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Underlying bal before: ", +underlyingBalanceBefore)
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                  case "testGetDepositSomeCodes(address,address,address,uint256)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("TDC Underlying balance before deposit: ", +underlyingBalanceBefore);

                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying balance String: ", BigNumber.from(underlyingBalanceBefore).toString());
                    await testDeFiAdapter[action.action](
                      underlyingTokenAddress,
                      liquidityPool,
                      adapterAddress,
                      underlyingBalanceBefore,
                    );
                    break;
                  }
                  case "testGetWithdrawAllCodes(address,address,address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action)
                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" &&  console.log("Underlying bal. before: ", +underlyingBalanceBefore)
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                  case "testGetWithdrawSomeCodes(address,address,address,uint256)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);

                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("TDC Withdraw Underlying balance before deposit: ", +underlyingBalanceBefore);

                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log(
                        "Withdraw Underlying balance String: ",
                        BigNumber.from(underlyingBalanceBefore).toString(),
                      );
                    const lpTokenBalance = await adapters[adapterName].getLiquidityPoolTokenBalance(
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("LpToken Withdraw balance before normal: ", +lpTokenBalance);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log(
                        "LpToken Withdraw balance before in string: ",
                        BigNumber.from(lpTokenBalance).toString(),
                      );
                    await testDeFiAdapter[action.action](
                      underlyingTokenAddress,
                      liquidityPool,
                      adapterAddress,
                      lpTokenBalance,
                    );
                    break;
                  }
                  default: 
                    throw new Error(`TestDefiAdapters - SetAction: ${action.action} is not defined`)
                }
              }
              for (const action of story.getActions) {
                switch (action.action) {
                  case "getLiquidityPoolTokenBalance(address,address,address)": {
                    const expectedValue = action.expectedValue;
                    const lpTokenBalance = await adapters[adapterName][action.action](
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    const existingMode = await adapters[adapterName].maxDepositProtocolMode();
                    if (existingMode == 0) {
                      const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (existingDepositAmount.eq(0) || expectedValue == "=0") {
                        expect(lpTokenBalance).to.be.eq(0);
                      } else {
                        expect(lpTokenBalance).to.be.gt(0);
                      }
                    } else {
                      const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                      const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                      if (existingPoolPct.eq(0) && existingProtocolPct.eq(0)) {
                        expect(lpTokenBalance).to.be.eq(0);
                      } else if (!existingPoolPct.eq(0) || !existingProtocolPct.eq(0)) {
                        expectedValue == ">0"
                          ? expect(+lpTokenBalance).to.be.gt(0)
                          : expect(+lpTokenBalance).to.be.equal(0);
                      }
                    }
                    break;
                  }
                  case "balanceOf(address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action)
                    const expectedValue = action.expectedValue;
                    const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](
                      testDeFiAdapter.address,
                    );
                    // process.env.ADAPTER_DEBUG == "true" && console.log("Balance after: ", +underlyingBalanceAfter);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying token bal before: ", +underlyingBalanceBefore);
                    // process.env.ADAPTER_DEBUG == "true" &&
                    //   console.log("Limit in underlying: ", +limitInUnderlyingToken);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Default fund amount: ", +defaultFundAmount);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Limit: ", +limit);
                    
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying Bal. after: ", +underlyingBalanceAfter);
                    // process.env.ADAPTER_DEBUG == "true" &&
                    //   console.log("underlyingTokenBalance before: ", +underlyingBalanceBefore);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Diff of UnderlyingBalBefore - limit: ", +underlyingBalanceBefore.sub(limit));
                    process.env.ADAPTER_DEBUG == "true" && console.log("Expect condition Diff: ", +defaultFundAmount.sub(limit));
                    process.env.ADAPTER_DEBUG == "true" && console.log("Expect condition Diff: ", +underlyingBalanceBefore.sub(limit));

                    // if (stories.type) {
                    //   process.env.ADAPTER_DEBUG == "true" && console.log("Conditions check in balanceOf if")
                    //   expectedValue == ">0"
                    //   ? defaultFundAmount.lte(limit)
                    //     ? expect(underlyingBalanceAfter).to.be.gte(underlyingBalanceBefore)
                    //     : expect(underlyingBalanceAfter).to.be.gte(limit)
                    //   : defaultFundAmount.lte(limit)
                    //   ? expect(underlyingBalanceAfter).to.be.eq(0)
                    //   : expect(underlyingBalanceAfter).to.be.gte(underlyingBalanceBefore.sub(limit));
                    // } else {
                    //   expectedValue == ">0"
                    //   ? defaultFundAmount.lte(limit)
                    //     ? expect(underlyingBalanceAfter).to.be.gte(defaultFundAmount)
                    //     : expect(underlyingBalanceAfter).to.be.gte(limit)
                    //   : defaultFundAmount.lte(limit)
                    //   ? expect(underlyingBalanceAfter).to.be.eq(0)
                    //   : expect(underlyingBalanceAfter).to.be.gte(defaultFundAmount.sub(limit));
                    // }

                    // expectedValue == ">0"
                    //   ? defaultFundAmount.lte(limit)
                    //     ? expect(underlyingBalanceAfter).to.be.gte(defaultFundAmount)
                    //     : expect(underlyingBalanceAfter).to.be.gte(limit)
                    //   : defaultFundAmount.lte(limit)
                    //   ? expect(underlyingBalanceAfter).to.be.eq(0)
                    //   : expect(underlyingBalanceAfter).to.be.gte(defaultFundAmount.sub(limit));

                    expectedValue == ">0"
                      ? underlyingBalanceBefore.lte(limit)
                        ? expect(underlyingBalanceAfter).to.be.gte(underlyingBalanceBefore)
                        : expect(underlyingBalanceAfter).to.be.gte(limit)
                      : underlyingBalanceBefore.lte(limit)
                      ? expect(underlyingBalanceAfter).to.be.eq(0)
                      : expect(underlyingBalanceAfter).to.be.gte(underlyingBalanceBefore.sub(limit));

                    break;
                  }
                  default: 
                    throw new Error(`TestDefiAdapters - GetAction: ${action.action} is not defined`)
                }
              }
              for (const action of story.cleanActions) {
                switch (action.action) {
                  case "testGetWithdrawAllCodes(address,address,address)": {
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                  default: 
                    throw new Error(`TestDefiAdapters - CleanAction: ${action.action} is not defined`)
                }
              }
            });
          }
        }
      }
    }
  }
});
