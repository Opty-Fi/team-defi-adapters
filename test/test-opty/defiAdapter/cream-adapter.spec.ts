import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, CREAM_ADAPTER_NAME, ADDRESS_ZERO } from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedTokens, TypedDefiPools } from "../../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp, lpPausedStatus } from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";
//  TODO: This file is temporarily being used until all the adapters testing doesn't adapt this file
import testDeFiAdaptersScenario from "../scenarios/compound-temp-defi-adapter.json";
import { deployContract, expectInvestLimitEvents, getDefaultFundAmountInDecimal } from "../../../helpers/helpers";
import { to_10powNumber_BN } from "../../../helpers/utils";
import { getAddress } from "ethers/lib/utils";
import creamComptrollerABI from "../../../helpers/data/ABI/cream-comptroller.json";
import creamLpABI from "../../../helpers/data/ABI/cream-liquidity-pool.json";
import COMPTROLLER from "../../../helpers/data/comptroller.json";
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
              const story = testDeFiAdaptersScenario.stories[i];
              const lpContract = await hre.ethers.getContractAt(creamLpABI, liquidityPool);
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const LpERC20Instance = await hre.ethers.getContractAt("ERC20", liquidityPool);
              const getLPERC20Code = await LpERC20Instance.provider.getCode(LpERC20Instance.address);
              const getERC20Code = await ERC20Instance.provider.getCode(ERC20Instance.address);
              const getLPCode = await lpContract.provider.getCode(lpContract.address);
              let poolValue: BigNumber = BigNumber.from("0");
              if (getLPCode !== "0x") {
                poolValue = await adapter.getPoolValue(liquidityPool, underlyingTokenAddress);
              }
              if (getLPERC20Code !== "0x" && getERC20Code !== "0x" && getLPCode !== "0x" && +poolValue > 0) {
                const compTroller = await lpContract.comptroller();
                const compTrollerInstance = await hre.ethers.getContractAt(creamComptrollerABI, compTroller);
                const rewardTokenAddress = await adapter.getRewardToken(ADDRESS_ZERO);
                let RewardTokenERC20Instance: Contract;
                if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                  RewardTokenERC20Instance = await hre.ethers.getContractAt("ERC20", rewardTokenAddress);
                }
                const compRate = await compTrollerInstance.compRate();
                const lpPauseStatus = await lpPausedStatus(
                  hre,
                  getAddress(liquidityPool),
                  compTroller,
                  creamComptrollerABI,
                );
                const decimals = await ERC20Instance.decimals();

                let limit: BigNumber = hre.ethers.BigNumber.from(0);
                let defaultFundAmount: BigNumber = getDefaultFundAmountInDecimal(underlyingTokenAddress, decimals);
                let underlyingBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let rewardTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let isTestingRewardTokenDistribution: boolean = false;
                const timestamp = (await getBlockTimestamp(hre)) * 2;
                let availableToHarvestToken: BigNumber = hre.ethers.BigNumber.from(0);
                let isTestingHarvest = false;

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
                      break;
                    }
                    case "setMaxDepositAmount(address,address,uint256)": {
                      const { maxDepositAmount }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      let amount = BigNumber.from("0");
                      if (maxDepositAmount === ">") {
                        amount = defaultFundAmount.mul(BigNumber.from("10"));
                      } else if (maxDepositAmount === "<") {
                        amount = defaultFundAmount.div(BigNumber.from("10"));
                      }
                      const existingDepositAmount: BigNumber = await adapter.maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (!existingDepositAmount.eq(amount)) {
                        const _setMaxDepositAmountTx = await adapter[action.action](
                          liquidityPool,
                          underlyingTokenAddress,
                          amount,
                        );
                        const setMaxDepositAmountTx = await _setMaxDepositAmountTx.wait();
                        const maxDepositAmountSet = await adapter.maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        expect(+maxDepositAmountSet).to.be.eq(+amount);
                        expectInvestLimitEvents(
                          setMaxDepositAmountTx,
                          "LogMaxDepositAmount",
                          "LogMaxDepositAmount(uint256,address)",
                          adapter.address,
                          ownerAddress,
                          amount.toString(),
                        );
                      }
                      limit = amount;
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
                        defaultFundAmount = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      }
                      break;
                    }
                    case "fundTestDefiContractWithRewardToken()": {
                      if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                        let compUnderlyingBalance: BigNumber = await RewardTokenERC20Instance!.balanceOf(
                          testDeFiAdapter.address,
                        );
                        if (+compUnderlyingBalance.lte(+0)) {
                          await fundWalletToken(
                            hre,
                            RewardTokenERC20Instance!.address,
                            users["owner"],
                            getDefaultFundAmountInDecimal(rewardTokenAddress, "18"),
                            timestamp,
                            testDeFiAdapter.address,
                          );
                          compUnderlyingBalance = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                          expect(+compUnderlyingBalance).to.be.gt(+0);
                        }
                        availableToHarvestToken = await adapterPrerequisites.harvestCodeProvider.getOptimalTokenAmount(
                          rewardTokenAddress,
                          underlyingTokenAddress,
                          compUnderlyingBalance,
                        );
                        console.log("availableToHarvestToken", +availableToHarvestToken);
                      }
                      break;
                    }
                    case "testGetDepositAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      console.log("lpPauseStatus", lpPauseStatus);
                      if (lpPauseStatus && +limit !== 0) {
                        await expect(
                          testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapter.address),
                        ).to.be.revertedWith("depositAll");
                      } else {
                        await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapter.address);
                      }
                      break;
                    }
                    case "testGetDepositSomeCodes(address,address,address,uint256)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      if (lpPauseStatus && +limit !== 0) {
                        await expect(
                          testDeFiAdapter[action.action](
                            underlyingTokenAddress,
                            liquidityPool,
                            adapter.address,
                            underlyingBalanceBefore,
                          ),
                        ).to.be.revertedWith("depositSome");
                      } else {
                        await testDeFiAdapter[action.action](
                          underlyingTokenAddress,
                          liquidityPool,
                          adapter.address,
                          underlyingBalanceBefore,
                        );
                      }
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
                      if (getAddress(underlyingTokenAddress) === getAddress(rewardTokenAddress)) {
                        this.skip();
                      }

                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapter.address);
                      isTestingHarvest = true;
                      break;
                    }
                    case "testGetHarvestSomeCodes(address,address,address,uint256)": {
                      //  TODO: This condition has to be added in the contract (OPTY-339)
                      if (getAddress(underlyingTokenAddress) === getAddress(rewardTokenAddress)) {
                        this.skip();
                      }
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      console.log(rewardTokenBalanceBefore.toString());
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        adapter.address,
                        rewardTokenBalanceBefore,
                      );
                      isTestingHarvest = true;
                      break;
                    }
                    case "getUnclaimedRewardTokenAmount(address,address,address)": {
                      const unclaimedRewardTokenAmount = await adapter[action.action](
                        testDeFiAdapter.address,
                        ADDRESS_ZERO,
                        ADDRESS_ZERO,
                      );
                      const expectedUnclaimedRewardTokenAmount = await compTrollerInstance.compAccrued(
                        testDeFiAdapter.address,
                      );
                      expect(unclaimedRewardTokenAmount).to.be.eq(expectedUnclaimedRewardTokenAmount);
                      break;
                    }
                    case "testGetClaimRewardTokenCode(address,address)": {
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](liquidityPool, adapter.address);
                      isTestingRewardTokenDistribution = true;
                      break;
                    }

                    case "calculateAmountInLPToken(address,address,uint256)": {
                      const _depositAmount: BigNumber = getDefaultFundAmountInDecimal(underlyingTokenAddress, decimals);
                      const _amountInLPToken = await adapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                        _depositAmount,
                      );
                      const exchangeRateStored = await lpContract.exchangeRateStored();
                      const expectedAmountInLPToken = _depositAmount
                        .mul(to_10powNumber_BN(18))
                        .div(BigNumber.from(exchangeRateStored));
                      expect(_amountInLPToken).to.be.eq(expectedAmountInLPToken);
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getPoolValue(address,address)": {
                      const _poolValue = await adapter[action.action](liquidityPool, ADDRESS_ZERO);
                      const expectedPoolValue = await lpContract.getCash();
                      expect(_poolValue).to.be.eq(expectedPoolValue);
                      break;
                    }
                    case "getLiquidityPoolToken(address,address)": {
                      const _liquidityPool = await adapter[action.action](ADDRESS_ZERO, liquidityPool);
                      expect(getAddress(_liquidityPool)).to.be.eq(getAddress(liquidityPool));
                      break;
                    }
                    case "getSomeAmountInToken(address,address,uint256)": {
                      const _lpTokenAmount = getDefaultFundAmountInDecimal(liquidityPool, decimals);
                      if (+_lpTokenAmount > 0) {
                        const _amountInUnderlyingToken = await adapter[action.action](
                          ADDRESS_ZERO,
                          liquidityPool,
                          _lpTokenAmount,
                        );
                        const exchangeRateStored = await lpContract.exchangeRateStored();
                        const expectedAmountInUnderlyingToken = _lpTokenAmount
                          .mul(exchangeRateStored)
                          .div(to_10powNumber_BN(18));
                        expect(_amountInUnderlyingToken).to.be.eq(expectedAmountInUnderlyingToken);
                      }
                      break;
                    }
                    case "getUnderlyingTokens(address,address)": {
                      const _underlyingAddressFromAdapter = await adapter[action.action](liquidityPool, ADDRESS_ZERO);
                      let _underlyingAddressFromPoolContract: string;
                      //  @reason Underlying is considered WETH in case of lp = CETH and as CETH doesn't have underlying()
                      //  function because CETH has ETH as underlying.
                      if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WETH)) {
                        _underlyingAddressFromPoolContract = TypedTokens.WETH;
                      } else {
                        _underlyingAddressFromPoolContract = await lpContract.underlying();
                      }
                      expect([getAddress(_underlyingAddressFromAdapter[0])]).to.have.members([
                        getAddress(_underlyingAddressFromPoolContract),
                      ]);
                      break;
                    }
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
                      if (lpPauseStatus) {
                        expect(+lpTokenBalance).to.be.eq(0);
                      } else {
                        if (existingMode == 0) {
                          const existingDepositAmount: BigNumber = await adapter.maxDepositAmount(
                            liquidityPool,
                            underlyingTokenAddress,
                          );
                          if (existingDepositAmount.eq(0)) {
                            expect(+lpTokenBalance).to.be.eq(0);
                          } else {
                            expect(+lpTokenBalance).to.be.gt(0);
                          }
                        } else {
                          const existingPoolPct: BigNumber = await adapter.maxDepositPoolPct(liquidityPool);
                          const existingProtocolPct: BigNumber = await adapter.maxDepositProtocolPct();
                          if (existingPoolPct.eq(0) && existingProtocolPct.eq(0)) {
                            expect(+lpTokenBalance).to.be.eq(0);
                          } else if (!existingPoolPct.eq(0) || !existingProtocolPct.eq(0)) {
                            expectedValue == "=0"
                              ? expect(+lpTokenBalance).to.be.eq(0)
                              : expect(+lpTokenBalance).to.be.gt(0);
                          }
                        }
                      }

                      break;
                    }
                    case "balanceOf(address)": {
                      const expectedValue = action.expectedValue;
                      const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](
                        testDeFiAdapter.address,
                      );
                      console.log(+underlyingBalanceAfter);
                      console.log(+underlyingBalanceBefore);
                      if (lpPauseStatus || (isTestingHarvest && +availableToHarvestToken === 0)) {
                        expect(+underlyingBalanceAfter).to.be.gte(+underlyingBalanceBefore);
                      } else {
                        if (underlyingBalanceBefore.lt(limit)) {
                          expectedValue == ">0"
                            ? expect(+underlyingBalanceAfter).to.be.gt(+underlyingBalanceBefore)
                            : expect(+underlyingBalanceAfter).to.be.eq(0);
                        } else {
                          expectedValue == ">0"
                            ? expect(+underlyingBalanceAfter).to.be.gt(+underlyingBalanceBefore)
                            : expect(+underlyingBalanceAfter).to.be.eq(+underlyingBalanceBefore.sub(limit));
                        }
                      }
                      break;
                    }
                    case "getRewardTokenBalance(address)": {
                      const rewardTokenBalanceAfter: BigNumber = await RewardTokenERC20Instance!.balanceOf(
                        testDeFiAdapter.address,
                      );
                      const expectedValue = action.expectedValue;

                      if (
                        (+compRate === 0 && isTestingRewardTokenDistribution) ||
                        (isTestingHarvest && +availableToHarvestToken === 0)
                      ) {
                        expect(+rewardTokenBalanceAfter).to.be.eq(+rewardTokenBalanceBefore);
                      } else {
                        expectedValue == ">0"
                          ? expect(+rewardTokenBalanceAfter).to.be.gt(+rewardTokenBalanceBefore)
                          : expectedValue == "=0"
                          ? expect(+rewardTokenBalanceAfter).to.be.eq(0)
                          : expect(+rewardTokenBalanceAfter).to.be.lt(+rewardTokenBalanceBefore);
                      }
                      break;
                    }
                    case "getAllAmountInToken(address,address,address)": {
                      const _amountInUnderlyingToken = await adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const _lpTokenBalance = await adapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      let expectedAmountInUnderlyingToken: BigNumber = await adapter.getSomeAmountInToken(
                        underlyingTokenAddress,
                        liquidityPool,
                        _lpTokenBalance,
                      );
                      const _unclaimedReward: BigNumber = await adapter.getUnclaimedRewardTokenAmount(
                        testDeFiAdapter.address,
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (+_unclaimedReward > 0) {
                        expectedAmountInUnderlyingToken = expectedAmountInUnderlyingToken.add(
                          await adapterPrerequisites["harvestCodeProvider"].rewardBalanceInUnderlyingTokens(
                            rewardTokenAddress,
                            underlyingTokenAddress,
                            _unclaimedReward,
                          ),
                        );
                      }
                      expect(+_amountInUnderlyingToken).to.be.eq(+expectedAmountInUnderlyingToken);
                      break;
                    }
                    case "isRedeemableAmountSufficient(address,address,address,uint256)": {
                      const expectedValue = action.expectedValue;
                      const _amountInUnderlyingToken: BigNumber = await adapter.getAllAmountInToken(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      if (expectedValue == ">") {
                        const _isRedeemableAmountSufficient = await adapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          _amountInUnderlyingToken.add(BigNumber.from(10)),
                        );
                        expect(_isRedeemableAmountSufficient).to.be.eq(false);
                      } else if (expectedValue == "<") {
                        const _isRedeemableAmountSufficient = await adapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          +_amountInUnderlyingToken > 0
                            ? _amountInUnderlyingToken.sub(BigNumber.from(10))
                            : BigNumber.from(0),
                        );
                        expect(_isRedeemableAmountSufficient).to.be.eq(true);
                      }
                      break;
                    }
                    case "calculateRedeemableLPTokenAmount(address,address,address,uint256)": {
                      const _lpTokenBalance: BigNumber = await adapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const _balanceInToken: BigNumber = await adapter.getAllAmountInToken(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );

                      if (lpPauseStatus) {
                        expect(+_lpTokenBalance).to.eq(0);
                        expect(+_balanceInToken).to.eq(0);
                      } else {
                        const _testRedeemAmount: BigNumber = _lpTokenBalance;

                        const _redeemableLpTokenAmt = await adapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          _testRedeemAmount,
                        );
                        const expectedRedeemableLpTokenAmt = _lpTokenBalance
                          .mul(_testRedeemAmount)
                          .div(_balanceInToken)
                          .add(BigNumber.from(1));
                        expect(_redeemableLpTokenAmt).to.be.eq(expectedRedeemableLpTokenAmt);
                      }

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
      for (let i = 0; i < testDeFiAdaptersScenario?.adapterStandloneStories.length; i++) {
        it(`${testDeFiAdaptersScenario?.adapterStandloneStories[i].description}`, async function () {
          const story = testDeFiAdaptersScenario.adapterStandloneStories[i];
          for (const action of story.setActions) {
            switch (action.action) {
              case "canStake(address)": {
                const _canStake = await adapter[action.action](ADDRESS_ZERO);
                expect(_canStake).to.be.eq(false);
                break;
              }
              case "setRewardToken(address)": {
                if (action.expect == "success") {
                  await adapter[action.action](TypedTokens.COMP);
                } else {
                  //  TODO: Add test scenario if operator is trying to set ZERO/EOA ADDRESS as reward token address
                  await expect(
                    adapter.connect(users[action.executer])[action.action](TypedTokens.COMP),
                  ).to.be.revertedWith(action.message);
                }
                break;
              }
              case "setComptroller(address)": {
                if (action.expect == "success") {
                  await adapter[action.action](COMPTROLLER.CreamAdapter);
                } else {
                  //  TODO: Add test scenario if operater is trying to set ZERO ADDRESS/EOA as comptroller's contract address
                  await expect(
                    adapter.connect(users[action.executer])[action.action](COMPTROLLER.CreamAdapter),
                  ).to.be.revertedWith(action.message);
                }
                break;
              }
            }
          }
          for (const action of story.getActions) {
            switch (action.action) {
              case "getRewardToken(address)": {
                const _rewardTokenAddress = await adapter[action.action](ADDRESS_ZERO);
                expect(getAddress(_rewardTokenAddress)).to.be.eq(getAddress(TypedTokens.COMP));
                break;
              }
              case "comptroller()": {
                const _comptrollerAddress = await adapter[action.action]();
                expect(getAddress(_comptrollerAddress)).to.be.eq(getAddress(COMPTROLLER.CreamAdapter));
              }
            }
          }
        });
      }
    });
  });
});

// "hfil": {
//   "pool": "0xd5103AfcD0B3fA865997Ef2984C66742c51b2a8b",
//   "lpToken": "0xd5103AfcD0B3fA865997Ef2984C66742c51b2a8b",
//   "tokens": ["0x9afb950948c2370975fb91a441f36fdc02737cd4"]
// }, // cannot execute code in depositAll and depositSome

// "creth2": {
//   "pool": "0xfd609a03B393F1A1cFcAcEdaBf068CAD09a924E2",
//   "lpToken": "0xfd609a03B393F1A1cFcAcEdaBf068CAD09a924E2",
//   "tokens": ["0xcbc1065255cbc3ab41a6868c22d1f1c573ab89fd"]
// },
// "uni_v2_eth_usdt": {
//   "pool": "0xE6C3120F38F56deb38B69b65cC7dcAF916373963",
//   "lpToken": "0xE6C3120F38F56deb38B69b65cC7dcAF916373963",
//   "tokens": ["0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"]
// },
// "uni_v2_usdc_eth": {
//   "pool": "0x4Fe11BC316B6d7A345493127fBE298b95AdaAd85",
//   "lpToken": "0x4Fe11BC316B6d7A345493127fBE298b95AdaAd85",
//   "tokens": ["0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"]
// },
// "uni_v2_dai_eth": {
//   "pool": "0xcD22C4110c12AC41aCEfA0091c432ef44efaAFA0",
//   "lpToken": "0xcD22C4110c12AC41aCEfA0091c432ef44efaAFA0",
//   "tokens": ["0xa478c2975ab1ea89e8196811f51a7b7ade33eb11"]
// }
// "xsushi": {
//   "pool": "0x228619CCa194Fbe3Ebeb2f835eC1eA5080DaFbb2",
//   "lpToken": "0x228619CCa194Fbe3Ebeb2f835eC1eA5080DaFbb2",
//   "tokens": ["0x8798249c2e607446efb7ad49ec89dd1865ff4272"]
// }
// "bbadger": {
//   "pool": "0x8B950f43fCAc4931D408F1fcdA55C6CB6cbF3096",
//   "lpToken": "0x8B950f43fCAc4931D408F1fcdA55C6CB6cbF3096",
//   "tokens": ["0x19d97d8fa813ee2f51ad4b4e04ea08baf4dffc28"]
// },
// error with uniswap fund wallet
