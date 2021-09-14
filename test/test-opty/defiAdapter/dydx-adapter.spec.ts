import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, ADDRESS_ZERO, DYDX_ADAPTER_NAME } from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedDefiPools, TypedTokens } from "../../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import testDeFiAdaptersScenario from "../scenarios/dydx-test-defi-adapter.json";
import scenarios from "../scenarios/adapters.json";
import { deployContract } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import abis from "../../../helpers/data/abis.json";

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

interface TEST_DEFI_ADAPTER_ARGUMENTS {
  maxDepositProtocolPct?: number | null;
  maxDepositPoolPct?: number | null;
  maxDepositAmount?: number | null;
  mode?: number | null;
}

describe(`${DYDX_ADAPTER_NAME} Unit test`, () => {
  const strategies = TypedAdapterStrategies[DYDX_ADAPTER_NAME];
  const MAX_AMOUNT = BigNumber.from("20000000000000000000");
  let adapterPrerequisites: CONTRACTS;
  let dYdXAdapter: Contract;
  let ownerAddress: string;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Essential contracts not deployed");
      dYdXAdapter = await deployAdapter(
        hre,
        owner,
        DYDX_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(dYdXAdapter, "Adapter not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < strategies.length; i++) {
    describe(`test getCodes() for ${strategies[i].strategyName}`, async () => {
      const strategy = strategies[i];
      const token = TOKENS[strategy.token];
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          await fundWalletToken(hre, token, owner, MAX_AMOUNT, timestamp, ownerAddress);
        } catch (error) {
          console.error(error);
        }
      });

      for (let i = 0; i < scenarios.stories.length; i++) {
        it(scenarios.stories[i].description, async () => {
          const story = scenarios.stories[i];
          for (let i = 0; i < story.actions.length; i++) {
            const action = story.actions[i];
            switch (action.action) {
              case "getDepositSomeCodes(address,address,address,uint256)":
              case "getDepositAllCodes(address,address,address)": {
                let codes;
                let depositAmount;
                if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await dYdXAdapter[action.action](
                      ownerAddress,
                      token,
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    depositAmount = amount[strategy.token];
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, token, strategy.strategy[0].contract);
                }
                for (let i = 0; i < codes.length; i++) {
                  if (i < 2) {
                    const inter = new utils.Interface(["function approve(address,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(token);
                    const value = inter.decodeFunctionData("approve", abiCode);
                    expect(value[0]).to.equal(strategy.strategy[0].contract);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[1]).to.equal(i === 0 ? 0 : depositAmount);
                    }
                  } else {
                    const inter = new utils.Interface([
                      "function operate((address,uint256)[],(uint8,uint256,(bool,uint8,uint8,uint256),uint256,uint256,address,uint256,bytes)[])",
                    ]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(strategy.strategy[0].contract);
                    const value = inter.decodeFunctionData("operate", abiCode);
                    expect(value[0][0][0]).to.be.equal(ownerAddress);
                    expect(value[1][0][0]).to.be.equal(0);
                    expect(value[1][0][5]).to.be.equal(ownerAddress);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[1][0][2][3]).to.be.equal(depositAmount);
                    }
                  }
                }
                break;
              }
              case "getWithdrawAllCodes(address,address,address)":
              case "getWithdrawSomeCodes(address,address,address,uint256)": {
                let codes;
                let withdrawAmount;
                if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await dYdXAdapter[action.action](
                      ownerAddress,
                      token,
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    withdrawAmount = amount[strategy.token];
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, token, strategy.strategy[0].contract);
                }

                for (let i = 0; i < codes.length; i++) {
                  const inter = new utils.Interface([
                    "function operate((address,uint256)[],(uint8,uint256,(bool,uint8,uint8,uint256),uint256,uint256,address,uint256,bytes)[])",
                  ]);
                  const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                  expect(address).to.be.equal(strategy.strategy[0].contract);
                  const value = inter.decodeFunctionData("operate", abiCode);
                  expect(value[0][0][0]).to.be.equal(ownerAddress);
                  expect(value[1][0][0]).to.be.equal(1);
                  expect(value[1][0][5]).to.be.equal(ownerAddress);
                  if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
                    expect(value[1][0][2][3]).to.be.equal(withdrawAmount);
                  }
                }

                break;
              }
            }
          }
        }).timeout(150000);
      }
    });
  }
});

describe(`${testDeFiAdaptersScenario.title} - DyDxAdapter`, () => {
  let adapterPrerequisites: CONTRACTS;
  let users: { [key: string]: Signer };
  let testDeFiAdapter: Contract;
  let dYdXAdapter: Contract;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, true);
    dYdXAdapter = await deployAdapter(
      hre,
      owner,
      DYDX_ADAPTER_NAME,
      adapterPrerequisites["registry"].address,
      TESTING_DEPLOYMENT_ONCE,
    );
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
  });

  // TODO: In future it can be leverage across all the adapters
  const pools = Object.keys(TypedDefiPools[DYDX_ADAPTER_NAME]);
  for (const pool of pools) {
    const underlyingTokenAddress = getAddress(TypedDefiPools[DYDX_ADAPTER_NAME][pool].tokens[0]);
    if (TypedDefiPools[DYDX_ADAPTER_NAME][pool].tokens.length == 1) {
      for (const story of testDeFiAdaptersScenario.stories) {
        it(`${pool} - ${story.description}`, async function () {
          if (underlyingTokenAddress === TypedTokens["SAI"]) {
            this.skip();
          }
          let defaultFundAmount: BigNumber = BigNumber.from("2");
          let limit: BigNumber = hre.ethers.BigNumber.from(0);
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          const liquidityPool = TypedDefiPools[DYDX_ADAPTER_NAME][pool].pool;
          const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
          const decimals = await ERC20Instance.decimals();
          const adapterAddress = dYdXAdapter.address;
          const dYdXSoloInstance = await hre.ethers.getContractAt(abis.dYdXSolo.abi, abis.dYdXSolo.address);
          let underlyingBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
          for (const action of story.setActions) {
            switch (action.action) {
              case "setMaxDepositProtocolMode(uint8)": {
                const { mode } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                const existingMode = await dYdXAdapter.maxDepositProtocolMode();
                if (existingMode != mode) {
                  await dYdXAdapter[action.action](mode);
                }
                break;
              }
              case "setMaxDepositProtocolPct(uint256)": {
                const existingPoolPct: BigNumber = await dYdXAdapter.maxDepositPoolPct(liquidityPool);
                if (!existingPoolPct.eq(BigNumber.from(0))) {
                  await dYdXAdapter.setMaxDepositPoolPct(liquidityPool, 0);
                }
                const { maxDepositProtocolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                const existingProtocolPct: BigNumber = await dYdXAdapter.maxDepositProtocolPct();
                if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                  await dYdXAdapter[action.action](maxDepositProtocolPct);
                }
                const poolValue: BigNumber = await dYdXAdapter.getPoolValue(liquidityPool, underlyingTokenAddress);
                limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                break;
              }
              case "setMaxDepositPoolPct(address,uint256)": {
                const { maxDepositPoolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                const existingPoolPct: BigNumber = await dYdXAdapter.maxDepositPoolPct(liquidityPool);
                if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                  await dYdXAdapter[action.action](liquidityPool, maxDepositPoolPct);
                }
                const poolValue: BigNumber = await dYdXAdapter.getPoolValue(liquidityPool, underlyingTokenAddress);
                limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                break;
              }
              case "setMaxDepositAmount(address,address,uint256)": {
                const { maxDepositAmount } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                const existingDepositAmount: BigNumber = await dYdXAdapter.maxDepositAmount(
                  liquidityPool,
                  underlyingTokenAddress,
                );
                if (
                  !existingDepositAmount.eq(
                    BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(decimals))),
                  )
                ) {
                  await dYdXAdapter[action.action](
                    liquidityPool,
                    underlyingTokenAddress,
                    BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(decimals))),
                  );
                }
                limit = await dYdXAdapter.maxDepositAmount(liquidityPool, underlyingTokenAddress);
                defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
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
                underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                break;
              }
              case "testGetWithdrawAllCodes(address,address,address)": {
                const underlyingTokenIndex = await dYdXAdapter.marketToIndexes(underlyingTokenAddress);
                console.log(
                  "Before withdraw: ",
                  (await dYdXSoloInstance.getAccountBalances([testDeFiAdapter.address, 0]))[2][
                    underlyingTokenIndex
                  ].value.toString(),
                );
                await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                console.log(
                  "After withdraw: ",
                  (await dYdXSoloInstance.getAccountBalances([testDeFiAdapter.address, 0]))[2][
                    underlyingTokenIndex
                  ].value.toString(),
                );
                break;
              }
              case "testGetDepositSomeCodes(address,address,address,uint256)": {
                underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                await testDeFiAdapter[action.action](
                  underlyingTokenAddress,
                  liquidityPool,
                  adapterAddress,
                  underlyingBalanceBefore,
                );
                break;
              }
              case "testGetWithdrawSomeCodes(address,address,address,uint256)": {
                const underlyingTokenIndex = await dYdXAdapter.marketToIndexes(underlyingTokenAddress);
                underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                const lpTokenBalance = await dYdXAdapter.getAllAmountInToken(
                  testDeFiAdapter.address,
                  underlyingTokenAddress,
                  liquidityPool,
                );
                console.log(
                  "Before withdraw some: ",
                  (await dYdXSoloInstance.getAccountBalances([testDeFiAdapter.address, 0]))[2][
                    underlyingTokenIndex
                  ].value.toString(),
                );
                console.log(
                  "Balance before withdraw: ",
                  (await ERC20Instance.balanceOf(testDeFiAdapter.address)).toString(),
                );
                console.log("lpTokenBalance: ", lpTokenBalance.toString());
                await testDeFiAdapter[action.action](
                  underlyingTokenAddress,
                  liquidityPool,
                  adapterAddress,
                  lpTokenBalance,
                );
                console.log(
                  "Balance after withdraw: ",
                  (await ERC20Instance.balanceOf(testDeFiAdapter.address)).toString(),
                );
                console.log(
                  "After withdraw some: ",
                  (await dYdXSoloInstance.getAccountBalances([testDeFiAdapter.address, 0]))[2][
                    underlyingTokenIndex
                  ].value.toString(),
                );
                break;
              }
            }
          }
          for (const action of story.getActions) {
            switch (action.action) {
              case "getLiquidityPoolTokenBalance(address,address,address)": {
                const underlyingTokenIndex = await dYdXAdapter.marketToIndexes(underlyingTokenAddress);
                const expectedValue = action.expectedValue;
                const expectedLpBalanceFromPool = (
                  await dYdXSoloInstance.getAccountBalances([testDeFiAdapter.address, 0])
                )[2][underlyingTokenIndex].value;
                const lpTokenBalance = await dYdXAdapter[action.action](
                  testDeFiAdapter.address,
                  underlyingTokenAddress,
                  liquidityPool,
                );
                expect(+lpTokenBalance).to.be.eq(+expectedLpBalanceFromPool);
                const existingMode = await dYdXAdapter.maxDepositProtocolMode();
                if (existingMode == 0) {
                  const existingDepositAmount: BigNumber = await dYdXAdapter.maxDepositAmount(
                    liquidityPool,
                    underlyingTokenAddress,
                  );
                  if (existingDepositAmount.eq(0)) {
                    expect(lpTokenBalance).to.be.eq(0);
                  } else {
                    expect(lpTokenBalance).to.be.gt(0);
                  }
                } else {
                  const existingPoolPct: BigNumber = await dYdXAdapter.maxDepositPoolPct(liquidityPool);
                  const existingProtocolPct: BigNumber = await dYdXAdapter.maxDepositProtocolPct();
                  if (existingPoolPct.eq(0) && existingProtocolPct.eq(0)) {
                    expect(lpTokenBalance).to.be.eq(0);
                  } else if (!existingPoolPct.eq(0) || !existingProtocolPct.eq(0)) {
                    expectedValue == "=0" ? expect(lpTokenBalance).to.be.eq(0) : expect(lpTokenBalance).to.be.gt(0);
                  }
                }
                break;
              }
              case "balanceOf(address)": {
                const expectedValue = action.expectedValue;
                const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](testDeFiAdapter.address);
                if (underlyingBalanceBefore.lt(limit)) {
                  expectedValue == ">0"
                    ? expect(+underlyingBalanceAfter).to.be.gt(+underlyingBalanceBefore)
                    : expect(underlyingBalanceAfter).to.be.eq(0);
                } else {
                  expectedValue == ">0"
                    ? expect(+underlyingBalanceAfter).to.be.gt(+underlyingBalanceBefore)
                    : expect(underlyingBalanceAfter).to.be.eq(underlyingBalanceBefore.sub(limit));
                }
                break;
              }
              case "isRedeemableAmountSufficient(address,address,address,uint256)": {
                const expectedValue = action.expectedValue;
                const amountInUnderlyingToken: BigNumber = await dYdXAdapter.getAllAmountInToken(
                  testDeFiAdapter.address,
                  underlyingTokenAddress,
                  liquidityPool,
                );
                if (expectedValue == ">") {
                  const isRedeemableAmountSufficient = await dYdXAdapter[action.action](
                    testDeFiAdapter.address,
                    underlyingTokenAddress,
                    liquidityPool,
                    amountInUnderlyingToken.add(BigNumber.from(10)),
                  );
                  expect(isRedeemableAmountSufficient).to.be.eq(false);
                } else if (expectedValue == "<") {
                  const isRedeemableAmountSufficient = await dYdXAdapter[action.action](
                    testDeFiAdapter.address,
                    underlyingTokenAddress,
                    liquidityPool,
                    +amountInUnderlyingToken > 0 ? amountInUnderlyingToken.sub(BigNumber.from(1)) : BigNumber.from(0),
                  );
                  expect(isRedeemableAmountSufficient).to.be.eq(true);
                }
                break;
              }
              case "calculateRedeemableLPTokenAmount(address,address,address,uint256)": {
                const lpTokenBalance: BigNumber = await dYdXAdapter.getLiquidityPoolTokenBalance(
                  testDeFiAdapter.address,
                  underlyingTokenAddress,
                  liquidityPool,
                );
                const testRedeemAmount: BigNumber = lpTokenBalance;
                const redeemableLpTokenAmt = await dYdXAdapter[action.action](
                  testDeFiAdapter.address,
                  underlyingTokenAddress,
                  liquidityPool,
                  testRedeemAmount,
                );
                const expectedRedeemableLpTokenAmt = lpTokenBalance;
                expect(redeemableLpTokenAmt).to.be.eq(expectedRedeemableLpTokenAmt);
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
                const lpTokenBalance = await dYdXAdapter[action.action](
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
      for (let i = 0; i < testDeFiAdaptersScenario?.adapterStandaloneStories.length; i++) {
        it(`${testDeFiAdaptersScenario?.adapterStandaloneStories[i].description}`, async function () {
          const story = testDeFiAdaptersScenario.adapterStandaloneStories[i];
          for (const action of story.setActions) {
            switch (action.action) {
              case "canStake(address)": {
                expect(await dYdXAdapter[action.action](ADDRESS_ZERO)).to.be.eq(false);
                break;
              }
            }
          }
          for (const action of story.getActions) {
            switch (action.action) {
              case "getRewardToken(address)": {
                expect(await dYdXAdapter[action.action](ADDRESS_ZERO)).to.be.eq(ADDRESS_ZERO);
                break;
              }
            }
          }
        });
      }
    }
  }
});
