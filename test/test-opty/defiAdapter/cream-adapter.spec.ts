import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, CREAM_ADAPTER_NAME, ADDRESS_ZERO } from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedTokens } from "../../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp, lpPausedStatus } from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";
import { TypedDefiPools } from "../../../helpers/data";
//  TODO: This file is temporarily being used until all the adapters testing doesn't adapt this file
import testDeFiAdaptersScenario from "../scenarios/compound-temp-defi-adapter.json";
import { deployContract, expectInvestLimitEvents, getDefaultFundAmount } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import creamComptrollerABI from "../../../helpers/data/ABI/cream-comptroller.json";
import creamLpABI from "../../../helpers/data/ABI/cream-liquidity-pool.json";

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

type TEST_DEFI_ADAPTER_ARGUMENTS = {
  mode?: string;
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
};

describe(`${CREAM_ADAPTER_NAME} Unit Test`, () => {
  const strategies = TypedAdapterStrategies[CREAM_ADAPTER_NAME];
  const MAX_AMOUNT = BigNumber.from("20000000");
  let adapterPrerequisites: CONTRACTS;
  let adapter: Contract;
  let ownerAddress: string;
  let users: { [key: string]: Signer };
  before(async () => {
    try {
      const [owner, admin, user1] = await hre.ethers.getSigners();
      users = { owner, admin, user1 };
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Adapter pre-requisites contracts not deployed");
      adapter = await deployAdapter(
        hre,
        owner,
        CREAM_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(adapter, "Adapter not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < strategies.length; i++) {
    describe(`test getCodes() for ${strategies[i].strategyName}`, async () => {
      const strategy = strategies[i];
      const token = TOKENS[strategy.token];
      let lpToken: string;
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          await fundWalletToken(hre, token, users["owner"], MAX_AMOUNT, timestamp);
          lpToken = await adapter.getLiquidityPoolToken(token, strategy.strategy[0].contract);
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
              case "getDepositSomeCodes(address,address[],address,uint256[])":
              case "getDepositAllCodes(address,address[],address)": {
                let codes;
                let depositAmount;
                if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await adapter[action.action](ownerAddress, [token], strategy.strategy[0].contract, [
                      amount[strategy.token],
                    ]);
                    depositAmount = amount[strategy.token];
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, [token], strategy.strategy[0].contract);
                }
                for (let i = 0; i < codes.length; i++) {
                  if (i < 2) {
                    const inter = new utils.Interface(["function approve(address,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(token);
                    const value = inter.decodeFunctionData("approve", abiCode);
                    expect(value[0]).to.equal(strategy.strategy[0].contract);
                    if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                      expect(value[1]).to.equal(i === 0 ? 0 : depositAmount);
                    }
                  } else {
                    const inter = new utils.Interface(["function mint(uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(strategy.strategy[0].contract);
                    const value = inter.decodeFunctionData("mint", abiCode);
                    if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                      expect(value[0]).to.equal(depositAmount);
                    }
                  }
                }
                break;
              }
              case "getWithdrawAllCodes(address,address[],address)":
              case "getWithdrawSomeCodes(address,address[],address,uint256)": {
                let codes;
                let withdrawAmount;
                if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await adapter[action.action](
                      ownerAddress,
                      [token],
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    withdrawAmount = amount[strategy.token];
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, [token], strategy.strategy[0].contract);
                }

                for (let i = 0; i < codes.length; i++) {
                  const inter = new utils.Interface(["function redeem(uint256)"]);
                  const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                  expect(address).to.be.equal(lpToken);
                  const value = inter.decodeFunctionData("redeem", abiCode);
                  if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                    expect(value[0]).to.be.equal(withdrawAmount);
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

  describe(`CreamAdapter pools test`, async () => {
    let testDeFiAdapter: Contract;

    before(async () => {
      testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", TESTING_DEPLOYMENT_ONCE, users["owner"], []);
    });

    const pools = Object.keys(TypedDefiPools[CREAM_ADAPTER_NAME]);

    describe(`Test-${CREAM_ADAPTER_NAME}`, () => {
      for (const pool of pools) {
        const poolDetail = TypedDefiPools[CREAM_ADAPTER_NAME][pool];
        const liquidityPool = poolDetail.pool;
        const underlyingTokenAddress =
          getAddress(poolDetail.tokens[0]) == getAddress(TypedTokens.ETH)
            ? getAddress(TypedTokens.WETH)
            : getAddress(TypedDefiPools[CREAM_ADAPTER_NAME][pool].tokens[0]);

        if (TypedDefiPools[CREAM_ADAPTER_NAME][pool].tokens.length == 1) {
          for (let i = 0; i < testDeFiAdaptersScenario.stories.length; i++) {
            it(`${pool} - ${testDeFiAdaptersScenario.stories[i].description}`, async function () {
              const lpContract = await hre.ethers.getContractAt(creamLpABI, liquidityPool);
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const LpERC20Instance = await hre.ethers.getContractAt("ERC20", liquidityPool);
              const compTroller = await lpContract.comptroller();
              const compTrollerInstance = await hre.ethers.getContractAt(creamComptrollerABI, compTroller);
              const rewardTokenAddress = await adapter.getRewardToken(ADDRESS_ZERO);
              let RewardTokenERC20Instance: Contract;
              if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                RewardTokenERC20Instance = await hre.ethers.getContractAt("ERC20", rewardTokenAddress);
              }

              const compRate = await compTrollerInstance.compRate();
              const getCode = await LpERC20Instance.provider.getCode(LpERC20Instance.address);
              const poolValue: BigNumber = await adapter.getPoolValue(liquidityPool, underlyingTokenAddress);
              const lpPauseStatus = await lpPausedStatus(
                hre,
                getAddress(liquidityPool),
                compTroller,
                creamComptrollerABI,
              );
              const decimals = await ERC20Instance.decimals();

              let limit: BigNumber = hre.ethers.BigNumber.from(0);
              let defaultFundAmount: BigNumber = getDefaultFundAmount(underlyingTokenAddress);
              let underlyingBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              let rewardTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              const timestamp = (await getBlockTimestamp(hre)) * 2;
              if (!lpPauseStatus && getCode !== "0x" && +poolValue > 0) {
                const story = testDeFiAdaptersScenario.stories[i];
                for (const action of story.setActions) {
                  switch (action.action) {
                    case "setMaxDepositProtocolMode(uint8)": {
                      const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingMode = await adapter.maxDepositProtocolMode();
                      if (existingMode != mode) {
                        const _setMaxDepositProtocolModeTx = await adapter[action.action](mode);
                        const setMaxDepositProtocolModeTx = await _setMaxDepositProtocolModeTx.wait();
                        const modeSet = await adapter.maxDepositProtocolMode();
                        expect(+modeSet).to.be.eq(+mode!);
                        expectInvestLimitEvents(
                          setMaxDepositProtocolModeTx,
                          "LogMaxDepositProtocolMode",
                          "LogMaxDepositProtocolMode(uint8,address)",
                          adapter.address,
                          ownerAddress,
                          mode!,
                        );
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await adapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await adapter.setMaxDepositPoolPct(liquidityPool, 0);
                        const maxDepositPoolPctSetToZero = await adapter.maxDepositPoolPct(liquidityPool);
                        expect(+maxDepositPoolPctSetToZero).to.be.eq(0);
                      }
                      const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingProtocolPct: BigNumber = await adapter.maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        const _setMaxDepositProtocolPctTx = await adapter[action.action](maxDepositProtocolPct);
                        const setMaxDepositProtocolPctTx = await _setMaxDepositProtocolPctTx.wait();
                        const maxDepositProtocolPctSet = await adapter.maxDepositProtocolPct();
                        expect(+maxDepositProtocolPctSet).to.be.eq(+maxDepositProtocolPct!);
                        expectInvestLimitEvents(
                          setMaxDepositProtocolPctTx,
                          "LogMaxDepositProtocolPct",
                          "LogMaxDepositProtocolPct(uint256,address)",
                          adapter.address,
                          ownerAddress,
                          maxDepositProtocolPct!,
                        );
                      }
                      limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                      break;
                    }
                    case "setMaxDepositPoolPct(address,uint256)": {
                      const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingPoolPct: BigNumber = await adapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                        const _setMaxDepositPoolPctTx = await adapter[action.action](liquidityPool, maxDepositPoolPct);
                        const setMaxDepositPoolPctTx = await _setMaxDepositPoolPctTx.wait();
                        const maxDepositPoolPctSet = await adapter.maxDepositPoolPct(liquidityPool);
                        expect(+maxDepositPoolPctSet).to.be.eq(+maxDepositPoolPct!);
                        expectInvestLimitEvents(
                          setMaxDepositPoolPctTx,
                          "LogMaxDepositPoolPct",
                          "LogMaxDepositPoolPct(uint256,address)",
                          adapter.address,
                          ownerAddress,
                          maxDepositPoolPct!,
                        );
                      }
                      limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                      break;
                    }
                    case "setMaxDepositAmount(address,address,uint256)": {
                      const { maxDepositAmount }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const convertedMaxDepositAmount = BigNumber.from(maxDepositAmount!).mul(
                        BigNumber.from(10).pow(decimals),
                      );
                      const existingDepositAmount: BigNumber = await adapter.maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (!existingDepositAmount.eq(convertedMaxDepositAmount)) {
                        const _setMaxDepositAmountTx = await adapter[action.action](
                          liquidityPool,
                          underlyingTokenAddress,
                          convertedMaxDepositAmount,
                        );
                        const setMaxDepositAmountTx = await _setMaxDepositAmountTx.wait();
                        const maxDepositAmountSet = await adapter.maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        expect(+maxDepositAmountSet).to.be.eq(+convertedMaxDepositAmount);
                        expectInvestLimitEvents(
                          setMaxDepositAmountTx,
                          "LogMaxDepositAmount",
                          "LogMaxDepositAmount(uint256,address)",
                          adapter.address,
                          ownerAddress,
                          convertedMaxDepositAmount.toString(),
                        );
                      }
                      limit = convertedMaxDepositAmount;
                      defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                      break;
                    }
                    case "fundTestDeFiAdapterContract": {
                      let underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      if (underlyingBalance.lt(defaultFundAmount)) {
                        await fundWalletToken(
                          hre,
                          underlyingTokenAddress,
                          users["owner"],
                          defaultFundAmount,
                          timestamp,
                          testDeFiAdapter.address,
                        );
                        underlyingBalance = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                        expect(+underlyingBalance).to.be.gte(+defaultFundAmount);
                      }
                      break;
                    }
                    case "fundTestDefiContractWithRewardToken()": {
                      if (+compRate === 0) {
                        this.skip();
                      }
                      console.log("compRate", compRate);
                      if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                        let compUnderlyingBalance: BigNumber = await RewardTokenERC20Instance!.balanceOf(
                          testDeFiAdapter.address,
                        );
                        if (+compUnderlyingBalance.lte(+0)) {
                          await fundWalletToken(
                            hre,
                            RewardTokenERC20Instance!.address,
                            users["owner"],
                            getDefaultFundAmount(rewardTokenAddress).mul(BigNumber.from(10).pow(18)),
                            timestamp,
                            testDeFiAdapter.address,
                          );
                          compUnderlyingBalance = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                          expect(+compUnderlyingBalance).to.be.gt(+0);
                        }
                      }
                      break;
                    }
                    case "testGetDepositAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapter.address);
                      break;
                    }
                    case "testGetDepositSomeCodes(address,address,address,uint256)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                        adapter.address,
                        underlyingBalanceBefore,
                      );
                      break;
                    }
                    case "testGetWithdrawAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapter.address);
                      break;
                    }
                    case "testGetWithdrawSomeCodes(address,address,address,uint256)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await adapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      await testDeFiAdapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                        adapter.address,
                        lpTokenBalance,
                      );
                      break;
                    }
                    case "testGetHarvestAllCodes(address,address,address)": {
                      //  TODO: This condition has to be added in the contract (OPTY-339)
                      if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.COMP)) {
                        this.skip();
                      }
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapter.address);
                      break;
                    }
                    case "testGetHarvestSomeCodes(address,address,address,uint256)": {
                      //  TODO: This condition has to be added in the contract (OPTY-339)
                      if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.COMP)) {
                        this.skip();
                      }
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        adapter.address,
                        rewardTokenBalanceBefore,
                      );
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      const expectedValue = action.expectedValue;
                      const expectedLpBalanceFromPool = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      expect(+lpTokenBalance).to.be.eq(+expectedLpBalanceFromPool);
                      const existingMode = await adapter.maxDepositProtocolMode();
                      if (existingMode == 0) {
                        const existingDepositAmount: BigNumber = await adapter.maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        if (existingDepositAmount.eq(0)) {
                          expect(lpTokenBalance).to.be.eq(0);
                        } else {
                          expect(lpTokenBalance).to.be.gt(0);
                        }
                      } else {
                        const existingPoolPct: BigNumber = await adapter.maxDepositPoolPct(liquidityPool);
                        const existingProtocolPct: BigNumber = await adapter.maxDepositProtocolPct();
                        if (existingPoolPct.eq(0) && existingProtocolPct.eq(0)) {
                          expect(lpTokenBalance).to.be.eq(0);
                        } else if (!existingPoolPct.eq(0) || !existingProtocolPct.eq(0)) {
                          expectedValue == "=0"
                            ? expect(lpTokenBalance).to.be.eq(0)
                            : expect(lpTokenBalance).to.be.gt(0);
                        }
                      }
                      break;
                    }
                    case "balanceOf(address)": {
                      const expectedValue = action.expectedValue;
                      const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](
                        testDeFiAdapter.address,
                      );
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
                    case "getRewardTokenBalance(address)": {
                      const rewardTokenBalanceAfter: BigNumber = await RewardTokenERC20Instance!.balanceOf(
                        testDeFiAdapter.address,
                      );
                      const expectedValue = action.expectedValue;
                      expectedValue == ">0"
                        ? expect(+rewardTokenBalanceAfter).to.be.gt(+rewardTokenBalanceBefore)
                        : expectedValue == "=0"
                        ? expect(+rewardTokenBalanceAfter).to.be.eq(0)
                        : expect(+rewardTokenBalanceAfter).to.be.lt(+rewardTokenBalanceBefore);
                      break;
                    }
                  }
                }
                for (const action of story.cleanActions) {
                  switch (action.action) {
                    case "testGetWithdrawAllCodes(address,address,address)": {
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapter.address);
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      const lpTokenBalance = await adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      expect(lpTokenBalance).to.be.eq(0);
                      break;
                    }
                    case "balanceOf(address)": {
                      const underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      expect(underlyingBalance).to.be.gt(0);
                      break;
                    }
                  }
                }
              } else {
                return this.skip();
              }
            });
          }
        }
      }
    });
  });
});
