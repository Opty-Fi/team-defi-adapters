import { expect } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, ethers } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TESTING_DEPLOYMENT_ONCE } from "../../../helpers/constants";
import { TypedDefiPools, TypedTokens } from "../../../helpers/data";
import { deployAdapter, deployRegistry } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import testDeFiAdapterScenario from "../scenarios/test-compound-defi-adapter.json";
import { deployContract } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

// type ARGUMENTS = {
//   amount?: { [key: string]: string };
// };

// type TEST_DEFI_ADAPTER_ARGUMENTS = {
//   maxDepositProtocolPct?: string | undefined;
//   maxDepositPoolPct?: string | undefined;
//   maxDepositAmount?: string | undefined;
//   mode?: string | undefined;
// };

describe(`${testDeFiAdapterScenario.title} - CompoundAdapter`, () => {
  //   let adapterPrerequisites: CONTRACTS;
  let registry: Contract;
  let users: { [key: string]: Signer };
  const adapterNames = Object.keys(TypedDefiPools);
  let testDeFiAdapter: Contract;
  let adapters: CONTRACTS;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    // adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, true);
    registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
    process.env.ADAPTER_DEBUG == "true" && console.log("Deployed Adapter Pre-requisites");
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    process.env.ADAPTER_DEBUG == "true" && console.log("Test Defi address deployed at: ", testDeFiAdapter.address);
    // adapters = await deployAdapters(
    // hre,
    // owner,
    // registry.address,
    // true,
    // );
    const CompoundAdapter = await deployAdapter(
      hre,
      owner,
      "CompoundAdapter",
      registry.address,

      true,
    );
    process.env.ADAPTER_DEBUG == "true" && console.log("CompoundAdapterContract: ", CompoundAdapter.address);
    adapters = { CompoundAdapter };
    process.env.ADAPTER_DEBUG == "true" &&
      console.log("Compound adapter address after deploying: ", adapters["CompoundAdapter"].address);
    process.env.ADAPTER_DEBUG == "true" && console.log("Adapters deployed");
  });

  // const ValidatedBtcTokens = TypedBtcTokens.map((t: string) => getAddress(t));
  for (const adapterName of adapterNames) {
    process.env.ADAPTER_DEBUG == "true" && console.log("Adapter Name after for loop: ", adapterName);
    // TODO: In future it can be leverage across all the adapters
    // if (adapterName == "CurveDepositPoolAdapter") {
    if (adapterName == "CompoundAdapter") {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
        // TODO: Get USDK,LINKUSD,SBTC from DEX
        //  @reason: WBTC has mint paused for latest blockNumbers, However WBTC2 works fine with the latest blockNumber
        //  @reason: SAI,REP = Mint is paused
        //  @reason: LINK: CLink's address not detectable as Contract with the blockNumber being used in Hardhat config.
        //  However, it works fine it existing blockNumber is removed with the latest blockNumber.
        //  @reason: TUSD: PoolValue comes `0` with existing blockNumber in hardhat config. However, it works fine with
        //  the latest blockNumber
        //  @reason: ETH: For this, CompoundAdapter has to be updated as cETH and other cTokens have different ABI.
        if (
          TypedDefiPools[adapterName][pool].tokens.length == 1 &&
          //   (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.DAI)) &&
          //   (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WBTC)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.SAI)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.REP)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.LINK)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.TUSD)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.ETH)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.USDK)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.LINKUSD)) &&
          !(getAddress(underlyingTokenAddress) == getAddress(TypedTokens.SBTC))
        ) {
          process.env.ADAPTER_DEBUG == "true" && console.log("Underlying token address:", underlyingTokenAddress);

          for (let i = 0; i < 13; i++) {
            // for (let i = 0; i < testDeFiAdapterScenario.stories.length; i++) {
            it(`${pool} - ${testDeFiAdapterScenario.stories[i].description}`, async () => {
              process.env.ADAPTER_DEBUG == "true" && console.log("Pool token name: ", pool);
              const story: any = testDeFiAdapterScenario.stories[i];
              //           for (let i = 0; i < story.actions.length; i++) {
              // ------
              // for (const story of testDeFiAdapterScenario.stories) {
              //   it(`${pool} - ${story.description}`, async () => {
              //----
              // let defaultFundAmount: BigNumber = ValidatedBtcTokens.includes(underlyingTokenAddress)
              //   ? BigNumber.from("2")
              //   : BigNumber.from("20000");
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
              // const ERC20Instance = await hre.ethers.getContractAt("ERC20", "0x6B175474E89094C44Da98b954EedeAC495271d0F");  //  Temp. DAI ERC20 for ETH testing
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const decimals = await ERC20Instance.decimals();
              const adapterAddress = adapters[adapterName].address;
              let underlyingBalanceBefore: BigNumber = ethers.BigNumber.from(0);
              let limitInUnderlyingToken: BigNumber = ethers.BigNumber.from(0);
              // Note: The pool value for curve pools will be in USD or BTC
              process.env.ADAPTER_DEBUG == "true" && console.log("Compound Adapter: ", adapters[adapterName].address);
              process.env.ADAPTER_DEBUG == "true" && console.log("Liquidity Pool-1: ", liquidityPool);

              // const lpToken = await adapters[adapterName].getLiquidityPoolToken(underlyingTokenAddress,underlyingTokenAddress,liquidityPool);
              // process.env.ADAPTER_DEBUG == "true" && console.log("LpToken: ", lpToken)
              //--//
              const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                liquidityPool,
                underlyingTokenAddress,
              );
              //   console.log("ADAPTER_DEBUG from env: ", process.env.ADAPTER_DEBUG);
              process.env.ADAPTER_DEBUG == "true" && console.log("Pool Value: ", +poolValue);
              for (const action of story.setActions) {
                switch (action.action) {
                  case "testGetPoolValue(address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    const poolStatus = await testDeFiAdapter.testGetPoolValue(liquidityPool);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Pool Value: ", +poolStatus);
                    break;
                  }
                  case "setMaxDepositProtocolMode(uint8)":
                  case "setMaxDepositPoolType(uint8)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("action: ", action.action);
                    // const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const { mode }: any = action.args;
                    const existingMode = await adapters[adapterName].maxDepositProtocolMode();
                    process.env.ADAPTER_DEBUG == "true" && console.log("Existing mode: ", +existingMode);
                    if (existingMode != mode) {
                      await adapters[adapterName][action.action](mode);
                    }
                    break;
                  }
                  case "setMaxDepositProtocolPct(uint256)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Existing Pool Pct: ", existingPoolPct);
                    if (!existingPoolPct.eq(BigNumber.from(0))) {
                      process.env.ADAPTER_DEBUG == "true" &&
                        console.log("Coming in setting pool pct in setProtocolPct Action");
                      await adapters[adapterName].setMaxDepositPoolPct(liquidityPool, 0);
                    }
                    // const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const { maxDepositProtocolPct }: any = action.args;
                    const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                    if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                      await adapters[adapterName][action.action](maxDepositProtocolPct);
                    }
                    limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                    process.env.ADAPTER_DEBUG == "true" && console.log("Limit: ", +limit);
                    limitInUnderlyingToken = limit.mul(BigNumber.from(10).pow(decimals));
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Limit in underlying token: ", +limitInUnderlyingToken);
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    // defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;  //  revert this line post testing rep
                    process.env.ADAPTER_DEBUG == "true" && console.log("default fund amount1: ", +defaultFundAmount);
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    process.env.ADAPTER_DEBUG == "true" && console.log("Default fund amount2: ", +defaultFundAmount);
                    break;
                  }
                  case "setMaxDepositPoolPct(address,uint256)": {
                    // const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const { maxDepositPoolPct }: any = action.args;
                    const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                    if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                      await adapters[adapterName][action.action](liquidityPool, maxDepositPoolPct);
                    }
                    limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                    limitInUnderlyingToken = limit.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    break;
                  }
                  case "setMaxDepositAmount(address,address,uint256)": {
                    // Note: for curve maxDepositAmount will be in USD or BTC
                    // const { maxDepositAmount }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    let { maxDepositAmount }: any = action.args;
                    maxDepositAmount = BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(decimals));
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying token address: ", underlyingTokenAddress);
                    const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Existing MaxDepositAmount: ", +existingDepositAmount);
                    if (!existingDepositAmount.eq(BigNumber.from(maxDepositAmount))) {
                      process.env.ADAPTER_DEBUG == "true" &&
                        console.log("Coming in. setting MaxDepositAmt if not matches the existing one");
                      await adapters[adapterName][action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        maxDepositAmount,
                      );
                    }
                    limit = BigNumber.from(maxDepositAmount);
                    // limitInUnderlyingToken = limit;
                    // limitInUnderlyingToken = BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("default fund amount before comparison: ", +defaultFundAmount);

                    // defaultFundAmount = defaultFundAmount.lte(limitInUnderlyingToken)
                    //   ? defaultFundAmount
                    //   : limitInUnderlyingToken;

                    process.env.ADAPTER_DEBUG == "true" && console.log("Limit: ", +limit);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Limit in underlying token: ", +limitInUnderlyingToken);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("default fund amount normal: ", +defaultFundAmount);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("default fund amount in string: ", defaultFundAmount.toString());
                    break;
                  }
                  case "fundTestDeFiAdapterContract": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    const underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Default fund amount: ", +defaultFundAmount);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Underlying balance: ", +underlyingBalance);
                    if (underlyingBalance.lt(defaultFundAmount)) {
                      process.env.ADAPTER_DEBUG == "true" && console.log("Funding with: ", +defaultFundAmount);
                      await fundWalletToken(
                        hre,
                        underlyingTokenAddress,
                        users["owner"],
                        defaultFundAmount,
                        timestamp,
                        testDeFiAdapter.address,
                      );
                    }
                    const TestDefiAdapterUnderlyingBalanceAfter: BigNumber = await ERC20Instance.balanceOf(
                      testDeFiAdapter.address,
                    );
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log(
                        "TestDefiAdapter contract bal after funding: ",
                        +TestDefiAdapterUnderlyingBalanceAfter,
                      );
                    break;
                  }
                  case "testGetDepositAllCodes(address,address,address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("TDC Underlying balance before deposit: ", +underlyingBalanceBefore);
                    // process.env.ADAPTER_DEBUG == "true" && console.log("Underlying balance Num: ", underlyingBalanceBefore.toNumber())
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying balance String: ", BigNumber.from(underlyingBalanceBefore).toString());
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                  case "testGetWithdrawAllCodes(address,address,address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    // const _underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("TDC Withdraw Underlying balance before deposit: ", +underlyingBalanceBefore);
                    // process.env.ADAPTER_DEBUG == "true" && console.log("Underlying balance Num: ", underlyingBalanceBefore.toNumber())
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log(
                        "Withdraw Underlying balance String: ",
                        BigNumber.from(underlyingBalanceBefore).toString(),
                      );
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                }
              }
              for (const action of story.getActions) {
                switch (action.action) {
                  case "getLiquidityPoolTokenBalance(address,address,address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    const expectedValue = action.expectedValue;
                    process.env.ADAPTER_DEBUG == "true" && console.log("Expected value: ", expectedValue);
                    const lpTokenBalance = await adapters[adapterName][action.action](
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    process.env.ADAPTER_DEBUG == "true" && console.log("lp token bal: ", +lpTokenBalance);
                    const existingMode = await adapters[adapterName].maxDepositProtocolMode();
                    process.env.ADAPTER_DEBUG == "true" && console.log("Existing mode: ", +existingMode);
                    if (existingMode == 0) {
                      const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      process.env.ADAPTER_DEBUG == "true" &&
                        console.log("Existing Deposit amount: ", +existingDepositAmount);
                      if (existingDepositAmount.eq(0) || expectedValue == "=0") {
                        expect(lpTokenBalance).to.be.eq(0);
                      } else {
                        expect(lpTokenBalance).to.be.gt(0);
                        // expectedValue == ">0" ? expect(lpTokenBalance).to.be.gt(0): expect(lpTokenBalance).to.be.equal(0);
                      }
                    } else {
                      process.env.ADAPTER_DEBUG == "true" && console.log("Else-condition");
                      const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                      const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                      process.env.ADAPTER_DEBUG == "true" && console.log("Existing pool pct: ", +existingPoolPct);
                      process.env.ADAPTER_DEBUG == "true" &&
                        console.log("Existing protocol pct: ", +existingProtocolPct);
                      process.env.ADAPTER_DEBUG == "true" && console.log("Lp token bal: ", +lpTokenBalance);
                      if (existingPoolPct.eq(0) && existingProtocolPct.eq(0)) {
                        expect(lpTokenBalance).to.be.eq(0);
                      } else if (!existingPoolPct.eq(0) || !existingProtocolPct.eq(0)) {
                        process.env.ADAPTER_DEBUG == "true" &&
                          console.log("Check lp token bal when mode != 0 and is: ", existingProtocolPct);
                        // expect(lpTokenBalance).to.be.gt(0);
                        expectedValue == ">0"
                          ? expect(+lpTokenBalance).to.be.gt(0)
                          : expect(+lpTokenBalance).to.be.equal(0);
                      }
                    }
                    break;
                  }
                  case "balanceOf(address)": {
                    process.env.ADAPTER_DEBUG == "true" && console.log("Action: ", action.action);
                    const expectedValue = action.expectedValue;
                    const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](
                      testDeFiAdapter.address,
                    );
                    process.env.ADAPTER_DEBUG == "true" && console.log("Balance after: ", +underlyingBalanceAfter);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying token bal before: ", +underlyingBalanceBefore);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Limit in underlying: ", +limitInUnderlyingToken);
                    process.env.ADAPTER_DEBUG == "true" &&
                      console.log("Underlying Bal. after: ", +underlyingBalanceAfter);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Default fund amount: ", +defaultFundAmount);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Limit: ", +limit);
                    process.env.ADAPTER_DEBUG == "true" && console.log("Diff: ", +defaultFundAmount.sub(limit));
                    // if (underlyingBalanceBefore.lt(limitInUnderlyingToken)) {
                    //   expect(underlyingBalanceAfter).to.be.eq(0);
                    // } else {
                    //   expect(underlyingBalanceAfter).to.be.eq(underlyingBalanceBefore.sub(limitInUnderlyingToken));
                    // }

                    //----------------------------//
                    // defaultFundAmount.lte(limit) ? defaultFundAmount : limit
                    expectedValue == ">0"
                      ? defaultFundAmount.lte(limit)
                        ? expect(underlyingBalanceAfter).to.be.gte(defaultFundAmount)
                        : expect(underlyingBalanceAfter).to.be.gte(limit)
                      : defaultFundAmount.lte(limit)
                      ? expect(underlyingBalanceAfter).to.be.eq(0)
                      : expect(underlyingBalanceAfter).to.be.gte(defaultFundAmount.sub(limit));
                    //   defaultFundAmount.lte(limit) ? expect(underlyingBalanceAfter).to.be.eq(0) : expect(underlyingBalanceAfter).to.be.lte(defaultFundAmount.sub(limit));
                    break;
                  }
                }
              }
              for (const action of story.cleanActions) {
                switch (action.action) {
                  case "testGetWithdrawAllCodes(address,address,address)": {
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                }
              }
              for (const action of story.getActions) {
                switch (action.action) {
                  case "getLiquidityPoolTokenBalance(address,address,address)": {
                    const lpTokenBalance = await adapters[adapterName][action.action](
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    expect(lpTokenBalance).to.be.eq(0);
                    break;
                  }
                  case "balanceOf(address": {
                    const underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    expect(underlyingBalance).to.be.gt(0);
                  }
                }
              }
            });
          }
        }
      }
    }
  }
});
