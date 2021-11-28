import chai, { expect, assert } from "chai";
import hre from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract, Signer, BigNumber, utils, ethers } from "ethers";
import Compound from "@compound-finance/compound-js";
import { CONTRACTS } from "../../helpers/type";
import { TESTING_DEPLOYMENT_ONCE, ADDRESS_ZERO } from "../../helpers/constants/utils";
import { VAULT_TOKENS } from "../../helpers/constants/tokens";
import { COMPOUND_ADAPTER_NAME } from "../../helpers/constants/adapters";
import { TypedAdapterStrategies, TypedTokens } from "../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../helpers/contracts-deployments";
import {
  fundWalletToken,
  getBlockTimestamp,
  lpPausedStatus,
  executeComptrollerFunc,
} from "../../helpers/contracts-actions";
import scenarios from "./scenarios/adapters.json";
import { TypedDefiPools } from "../../helpers/data";
import { ERC20 } from "../../typechain/ERC20";
//  TODO: This file is temporarily being used until all the adapters testing doesn't adapt this file
import testDeFiAdaptersScenario from "./scenarios/compound-temp-defi-adapter.json";
import { deployContract, getDefaultFundAmountInDecimal } from "../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import { to_10powNumber_BN } from "../../helpers/utils";

chai.use(solidity);

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

type TEST_DEFI_ADAPTER_ARGUMENTS = {
  mode?: string;
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
};

describe(`${COMPOUND_ADAPTER_NAME} Unit test`, () => {
  const strategies = TypedAdapterStrategies[COMPOUND_ADAPTER_NAME];
  const MAX_AMOUNT = BigNumber.from("20000000000000000000");
  let adapterPrerequisites: CONTRACTS;
  let compoundAdapter: Contract;
  let ownerAddress: string;
  let users: { [key: string]: Signer };
  before(async () => {
    try {
      const [owner, admin, user1] = await hre.ethers.getSigners();
      users = { owner, admin, user1 };
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Adapter pre-requisites contracts not deployed");
      compoundAdapter = await deployAdapter(
        hre,
        owner,
        COMPOUND_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(compoundAdapter, "Adapter not deployed");
    } catch (error: any) {
      console.log(error);
    }
  });

  for (let i = 0; i < strategies.length; i++) {
    describe(`test getCodes() for ${strategies[i].strategyName}`, async () => {
      const strategy = strategies[i];
      const token = VAULT_TOKENS[strategy.token].address;
      let lpToken: string;
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          await fundWalletToken(hre, token, users["owner"], MAX_AMOUNT, timestamp);
          lpToken = await compoundAdapter.getLiquidityPoolToken(token, strategy.strategy[0].contract);
        } catch (error: any) {
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
                    codes = await compoundAdapter[action.action](
                      ownerAddress,
                      token,
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    depositAmount = amount[strategy.token];
                  }
                } else {
                  codes = await compoundAdapter[action.action](ownerAddress, token, strategy.strategy[0].contract);
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
                    const inter = new utils.Interface(["function mint(uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(strategy.strategy[0].contract);
                    const value = inter.decodeFunctionData("mint", abiCode);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[0]).to.equal(depositAmount);
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
                    codes = await compoundAdapter[action.action](
                      ownerAddress,
                      token,
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    withdrawAmount = amount[strategy.token];
                  }
                } else {
                  codes = await compoundAdapter[action.action](ownerAddress, token, strategy.strategy[0].contract);
                }

                for (let i = 0; i < codes.length; i++) {
                  const inter = new utils.Interface(["function redeem(uint256)"]);
                  const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                  expect(address).to.be.equal(lpToken);
                  const value = inter.decodeFunctionData("redeem", abiCode);
                  if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
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
  describe(`CompoundAdapter pools test`, async () => {
    let testDeFiAdapter: Contract;

    before(async () => {
      testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", TESTING_DEPLOYMENT_ONCE, users["owner"], []);
    });

    // TODO: In future it can be leverage across all the adapters
    const pools = Object.keys(TypedDefiPools[COMPOUND_ADAPTER_NAME]);
    describe(`Test-${COMPOUND_ADAPTER_NAME}`, () => {
      for (const pool of pools) {
        //  @reason: ETH: This is an exception as input is not considered in ETH rather it is replaced with WETH.
        const underlyingTokenAddress =
          getAddress(TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].tokens[0]) == getAddress(TypedTokens.ETH)
            ? getAddress(TypedTokens.WETH)
            : getAddress(TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].tokens[0]);
        if (TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].tokens.length == 1) {
          for (let i = 0; i < testDeFiAdaptersScenario.stories.length; i++) {
            it(`${pool} - ${testDeFiAdaptersScenario.stories[i].description}`, async function () {
              const story = testDeFiAdaptersScenario.stories[i];
              const ERC20Instance = <ERC20>await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const liquidityPool = TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].pool;
              const LpContractInstance = await hre.ethers.getContractAt(Compound.util.getAbi("cErc20"), liquidityPool);
              const compTroller = await LpContractInstance.comptroller();
              const lpPauseStatus = await lpPausedStatus(
                hre,
                getAddress(TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].pool),
                compTroller,
              );
              if (!lpPauseStatus) {
                const rewardTokenAddress = await compoundAdapter.getRewardToken(liquidityPool);
                let RewardTokenERC20Instance: Contract;
                if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                  RewardTokenERC20Instance = await hre.ethers.getContractAt("ERC20", rewardTokenAddress);
                }
                //  @reason: Some LpToken contracts (like cLink's contract) are not detectable as Contract with the blockNumber being used in Hardhat config.
                //  However, it works fine if existing blockNumber is removed with the latest blockNumber.
                const getCode = await LpContractInstance.provider.getCode(LpContractInstance.address);
                if (getCode === "0x") {
                  this.skip();
                }

                const decimals = await ERC20Instance.decimals();
                let defaultFundAmount: BigNumber = getDefaultFundAmountInDecimal(underlyingTokenAddress, decimals);
                let limit: BigNumber = ethers.BigNumber.from(0);
                const timestamp = (await getBlockTimestamp(hre)) * 2;
                let underlyingBalanceBefore: BigNumber = ethers.BigNumber.from(0);
                let rewardTokenBalanceBefore: BigNumber = ethers.BigNumber.from(0);
                const rewardTokenDecimals = await RewardTokenERC20Instance!.decimals();
                const adapterAddress = compoundAdapter.address;

                const poolValue: BigNumber = await compoundAdapter.getPoolValue(liquidityPool, underlyingTokenAddress);
                //  @reason: Exception when PoolValue comes `0` with existing blockNumber in hardhat config. Eg: TUSD token. However, it works fine with
                //  the latest blockNumber for TUSD
                if (poolValue.eq(0)) {
                  this.skip();
                }

                for (const action of story.setActions) {
                  switch (action.action) {
                    case "setMaxDepositProtocolMode(uint8)": {
                      const { mode }: any = action.args!;
                      const existingMode = await compoundAdapter.maxDepositProtocolMode();
                      if (existingMode != mode) {
                        await expect(compoundAdapter[action.action](mode))
                          .to.emit(compoundAdapter, "LogMaxDepositProtocolMode")
                          .withArgs(+mode, ownerAddress);
                        expect(await compoundAdapter.maxDepositProtocolMode()).to.equal(+mode);
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await compoundAdapter.setMaxDepositPoolPct(liquidityPool, 0);
                        expect(await compoundAdapter.maxDepositPoolPct(liquidityPool)).to.be.eq(0);
                      }
                      const { maxDepositProtocolPct }: any = action.args!;
                      const existingProtocolPct: BigNumber = await compoundAdapter.maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        await expect(compoundAdapter[action.action](maxDepositProtocolPct))
                          .to.emit(compoundAdapter, "LogMaxDepositProtocolPct")
                          .withArgs(+maxDepositProtocolPct, ownerAddress);
                        expect(await compoundAdapter.maxDepositProtocolPct()).to.equal(+maxDepositProtocolPct);
                      }
                      limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      break;
                    }
                    case "setMaxDepositPoolPct(address,uint256)": {
                      const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingPoolPct: BigNumber = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                        await expect(compoundAdapter[action.action](liquidityPool, maxDepositPoolPct))
                          .to.emit(compoundAdapter, "LogMaxDepositPoolPct")
                          .withArgs(maxDepositPoolPct, ownerAddress);
                        expect(await compoundAdapter.maxDepositPoolPct(liquidityPool)).to.equal(maxDepositPoolPct);
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
                      const existingDepositAmount: BigNumber = await compoundAdapter.maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (!existingDepositAmount.eq(amount)) {
                        await expect(compoundAdapter[action.action](liquidityPool, underlyingTokenAddress, amount))
                          .to.emit(compoundAdapter, "LogMaxDepositAmount")
                          .withArgs(amount, ownerAddress);
                        expect(await compoundAdapter.maxDepositAmount(liquidityPool, underlyingTokenAddress)).to.equal(
                          amount,
                        );
                      }
                      limit = amount;
                      break;
                    }
                    case "fundTestDeFiAdapterContract": {
                      const underlyingBalanceBefore: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      if (underlyingBalanceBefore.lt(defaultFundAmount)) {
                        await fundWalletToken(
                          hre,
                          underlyingTokenAddress,
                          users["owner"],
                          defaultFundAmount,
                          timestamp,
                          testDeFiAdapter.address,
                        );
                        const underlyingBalanceAfter = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                        expect(underlyingBalanceAfter).to.gte(underlyingBalanceBefore);
                      }
                      break;
                    }
                    case "fundTestDefiContractWithRewardToken()": {
                      if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                        let compUnderlyingBalance: BigNumber = await RewardTokenERC20Instance!.balanceOf(
                          testDeFiAdapter.address,
                        );
                        if (compUnderlyingBalance.lte(0)) {
                          await fundWalletToken(
                            hre,
                            RewardTokenERC20Instance!.address,
                            users["owner"],
                            getDefaultFundAmountInDecimal(rewardTokenAddress, rewardTokenDecimals),
                            timestamp,
                            testDeFiAdapter.address,
                          );
                          compUnderlyingBalance = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                          expect(compUnderlyingBalance).to.be.gt(0);
                        }
                      }
                      break;
                    }
                    case "testGetDepositAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
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
                    case "testGetWithdrawAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                    case "testGetWithdrawSomeCodes(address,address,address,uint256)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await compoundAdapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      await testDeFiAdapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                        adapterAddress,
                        lpTokenBalance,
                      );
                      break;
                    }
                    case "testGetHarvestAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapterAddress);
                      break;
                    }
                    case "testGetHarvestSomeCodes(address,address,address,uint256)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        adapterAddress,
                        rewardTokenBalanceBefore,
                      );
                      break;
                    }
                    case "getUnclaimedRewardTokenAmount(address,address,address)": {
                      expect(
                        await compoundAdapter[action.action](testDeFiAdapter.address, liquidityPool, ADDRESS_ZERO),
                      ).to.be.eq(
                        await executeComptrollerFunc(
                          hre,
                          compTroller,
                          "function compAccrued(address) returns (uint256)",
                          [testDeFiAdapter.address],
                        ),
                      );
                      break;
                    }
                    case "testGetClaimRewardTokenCode(address,address)": {
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](liquidityPool, compoundAdapter.address);
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      expect(
                        await compoundAdapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                        ),
                      ).to.be.eq(await LpContractInstance.balanceOf(testDeFiAdapter.address));
                      break;
                    }
                    case "balanceOf(address)": {
                      const expectedValue = action.expectedValue;
                      const underlyingBalanceAfter: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      if (underlyingBalanceBefore.lt(limit)) {
                        expectedValue == ">0"
                          ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                          : expect(underlyingBalanceAfter).to.be.eq(0);
                      } else {
                        expectedValue == ">0"
                          ? getAddress(underlyingTokenAddress) != getAddress(rewardTokenAddress)
                            ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                            : expect(underlyingBalanceAfter).to.be.eq(underlyingBalanceBefore)
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
                        ? expect(rewardTokenBalanceAfter).to.be.gt(rewardTokenBalanceBefore)
                        : expectedValue == "=0"
                        ? getAddress(underlyingTokenAddress) != getAddress(rewardTokenAddress)
                          ? expect(rewardTokenBalanceAfter).to.be.eq(0)
                          : expect(rewardTokenBalanceAfter).to.be.eq(rewardTokenBalanceBefore)
                        : getAddress(underlyingTokenAddress) != getAddress(rewardTokenAddress)
                        ? expect(rewardTokenBalanceAfter).to.be.lt(rewardTokenBalanceBefore)
                        : expect(rewardTokenBalanceAfter).to.be.eq(rewardTokenBalanceBefore);
                      break;
                    }
                    case "getAllAmountInToken(address,address,address)": {
                      const _lpTokenBalance = await compoundAdapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      let expectedAmountInUnderlyingToken: BigNumber = await compoundAdapter.getSomeAmountInToken(
                        underlyingTokenAddress,
                        liquidityPool,
                        _lpTokenBalance,
                      );
                      const _unclaimedReward: BigNumber = await compoundAdapter.getUnclaimedRewardTokenAmount(
                        testDeFiAdapter.address,
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (_unclaimedReward.gt(0)) {
                        expectedAmountInUnderlyingToken = expectedAmountInUnderlyingToken.add(
                          await adapterPrerequisites["harvestCodeProvider"].rewardBalanceInUnderlyingTokens(
                            rewardTokenAddress,
                            underlyingTokenAddress,
                            _unclaimedReward,
                          ),
                        );
                      }
                      expect(
                        await compoundAdapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                        ),
                      ).to.be.eq(expectedAmountInUnderlyingToken);
                      break;
                    }
                    case "isRedeemableAmountSufficient(address,address,address,uint256)": {
                      const expectedValue = action.expectedValue;
                      const _amountInUnderlyingToken: BigNumber = await compoundAdapter.getAllAmountInToken(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      if (expectedValue == ">") {
                        expect(
                          await compoundAdapter[action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            _amountInUnderlyingToken.add(BigNumber.from(10)),
                          ),
                        ).to.be.eq(false);
                      } else if (expectedValue == "<") {
                        expect(
                          await compoundAdapter[action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            _amountInUnderlyingToken.gt(0)
                              ? _amountInUnderlyingToken.sub(BigNumber.from(10))
                              : BigNumber.from(0),
                          ),
                        ).to.be.eq(true);
                      }
                      break;
                    }
                    case "calculateRedeemableLPTokenAmount(address,address,address,uint256)": {
                      const _lpTokenBalance: BigNumber = await compoundAdapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const _balanceInToken: BigNumber = await compoundAdapter.getAllAmountInToken(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const _testRedeemAmount: BigNumber = _lpTokenBalance;
                      const expectedRedeemableLpTokenAmt = _lpTokenBalance
                        .mul(_testRedeemAmount)
                        .div(_balanceInToken)
                        .add(BigNumber.from(1));
                      expect(
                        await compoundAdapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          _testRedeemAmount,
                        ),
                      ).to.be.eq(expectedRedeemableLpTokenAmt);
                      break;
                    }
                    case "getUnderlyingTokens(address,address)": {
                      //  @reason Underlying is considered WETH in case of lp = CETH and as CETH doesn't have underlying()
                      //  function because CETH has ETH as underlying.
                      expect([
                        getAddress((await compoundAdapter[action.action](liquidityPool, ADDRESS_ZERO))[0]),
                      ]).to.have.members([
                        getAddress(
                          getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WETH)
                            ? TypedTokens.WETH
                            : await LpContractInstance.underlying(),
                        ),
                      ]);
                      break;
                    }
                    case "calculateAmountInLPToken(address,address,uint256)": {
                      const _depositAmount: BigNumber = getDefaultFundAmountInDecimal(underlyingTokenAddress, decimals);
                      expect(
                        await compoundAdapter[action.action](underlyingTokenAddress, liquidityPool, _depositAmount),
                      ).to.be.eq(
                        _depositAmount.mul(to_10powNumber_BN(18)).div(await LpContractInstance.exchangeRateStored()),
                      );
                      break;
                    }
                    case "getPoolValue(address,address)": {
                      expect(await compoundAdapter[action.action](liquidityPool, ADDRESS_ZERO)).to.be.eq(
                        await LpContractInstance.getCash(),
                      );
                      break;
                    }
                    case "getLiquidityPoolToken(address,address)": {
                      expect(getAddress(await compoundAdapter[action.action](ADDRESS_ZERO, liquidityPool))).to.be.eq(
                        getAddress(liquidityPool),
                      );
                      break;
                    }
                    case "getSomeAmountInToken(address,address,uint256)": {
                      const _lpTokenDecimals = await LpContractInstance.decimals();
                      const _lpTokenAmount = getDefaultFundAmountInDecimal(liquidityPool, _lpTokenDecimals);
                      if (_lpTokenAmount.gt(0)) {
                        expect(
                          await compoundAdapter[action.action](ADDRESS_ZERO, liquidityPool, _lpTokenAmount),
                        ).to.be.eq(
                          _lpTokenAmount.mul(await LpContractInstance.exchangeRateStored()).div(to_10powNumber_BN(18)),
                        );
                      }
                      break;
                    }
                    case "getRewardToken(address)": {
                      expect(getAddress(await compoundAdapter[action.action](liquidityPool))).to.be.eq(
                        await executeComptrollerFunc(
                          hre,
                          compTroller,
                          "function getCompAddress() returns (address)",
                          [],
                        ),
                      );
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
                      expect(
                        await compoundAdapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                        ),
                      ).to.be.eq(0);
                      break;
                    }
                    case "balanceOf(address)": {
                      expect(await ERC20Instance.balanceOf(testDeFiAdapter.address)).to.be.gt(0);
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

      for (let i = 0; i < testDeFiAdaptersScenario?.adapterStandaloneStories.length; i++) {
        it(`${testDeFiAdaptersScenario?.adapterStandaloneStories[i].description}`, async function () {
          const story = testDeFiAdaptersScenario.adapterStandaloneStories[i];
          for (const action of story.setActions) {
            switch (action.action) {
              case "canStake(address)": {
                expect(await compoundAdapter[action.action](ADDRESS_ZERO)).to.be.eq(false);
                break;
              }
            }
          }
        });
      }
    });
  });
});
