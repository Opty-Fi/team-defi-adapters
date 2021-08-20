import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils, ethers } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import {
  TOKENS,
  TESTING_DEPLOYMENT_ONCE,
  ADDRESS_ZERO,
  COMPOUND_ADAPTER_NAME,
  CONTRACT_ADDRESSES,
} from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedTokens } from "../../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";
import { TypedDefiPools } from "../../../helpers/data";
//  TODO: This file is temporarily being used until all the adapters testing doesn't adapt this file
import testDeFiAdaptersScenario from "../scenarios/compound-temp-defi-adapter.json";
import { deployContract, expectInvestLimitEvents, getDefaultFundAmountInDecimal } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
// import abis from "../../../helpers/data/abis.json";
import { to_10powNumber_BN } from "../../../helpers/utils";
import Compound from "@compound-finance/compound-js";
import { Provider } from "@compound-finance/compound-js/dist/nodejs/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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
          lpToken = await compoundAdapter.getLiquidityPoolToken(token, strategy.strategy[0].contract);
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
                    codes = await compoundAdapter[action.action](ownerAddress, [token], strategy.strategy[0].contract, [
                      amount[strategy.token],
                    ]);
                    depositAmount = amount[strategy.token];
                  }
                } else {
                  codes = await compoundAdapter[action.action](ownerAddress, [token], strategy.strategy[0].contract);
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
                    codes = await compoundAdapter[action.action](
                      ownerAddress,
                      [token],
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    withdrawAmount = amount[strategy.token];
                  }
                } else {
                  codes = await compoundAdapter[action.action](ownerAddress, [token], strategy.strategy[0].contract);
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
        if (
          TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].tokens.length == 1
          // &&
          // getAddress(underlyingTokenAddress) == getAddress(TypedTokens.DAI)
        ) {
          // for (let i = 0; i < 1; i++) {
          for (let i = 0; i < testDeFiAdaptersScenario.stories.length; i++) {
            it(`${pool} - ${testDeFiAdaptersScenario.stories[i].description}`, async function () {
              const lpPauseStatus = await lpPausedStatus(
                hre,
                getAddress(TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].pool),
                CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER,
              );
              if (!lpPauseStatus) {
                const story = testDeFiAdaptersScenario.stories[i];
                const liquidityPool = TypedDefiPools[COMPOUND_ADAPTER_NAME][pool].pool;
                const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
                // const LpContractInstance = await hre.ethers.getContractAt(abis.cToken.abi, liquidityPool);
                const LpContractInstance = await hre.ethers.getContractAt(
                  Compound.util.getAbi("cErc20"),
                  liquidityPool,
                );
                console.log("Lp contract instance created");
                const rewardTokenAddress = await compoundAdapter.getRewardToken(ADDRESS_ZERO);
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
                if (+poolValue == 0) {
                  this.skip();
                }

                for (const action of story.setActions) {
                  switch (action.action) {
                    case "setMaxDepositProtocolMode(uint8)": {
                      const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingMode = await compoundAdapter.maxDepositProtocolMode();
                      if (existingMode != mode) {
                        const _setMaxDepositProtocolModeTx = await compoundAdapter[action.action](mode);
                        const setMaxDepositProtocolModeTx = await _setMaxDepositProtocolModeTx.wait();
                        const modeSet = await compoundAdapter.maxDepositProtocolMode();
                        expect(+modeSet).to.be.eq(+mode!);
                        expectInvestLimitEvents(
                          setMaxDepositProtocolModeTx,
                          "LogMaxDepositProtocolMode",
                          "LogMaxDepositProtocolMode(uint8,address)",
                          compoundAdapter.address,
                          ownerAddress,
                          mode!,
                        );
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await compoundAdapter.setMaxDepositPoolPct(liquidityPool, 0);
                        const maxDepositPoolPctSetToZero = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                        expect(+maxDepositPoolPctSetToZero).to.be.eq(0);
                      }
                      const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingProtocolPct: BigNumber = await compoundAdapter.maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        const _setMaxDepositProtocolPctTx = await compoundAdapter[action.action](maxDepositProtocolPct);
                        const setMaxDepositProtocolPctTx = await _setMaxDepositProtocolPctTx.wait();
                        const maxDepositProtocolPctSet = await compoundAdapter.maxDepositProtocolPct();
                        expect(+maxDepositProtocolPctSet).to.be.eq(+maxDepositProtocolPct!);
                        expectInvestLimitEvents(
                          setMaxDepositProtocolPctTx,
                          "LogMaxDepositProtocolPct",
                          "LogMaxDepositProtocolPct(uint256,address)",
                          compoundAdapter.address,
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
                      const existingPoolPct: BigNumber = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                        const _setMaxDepositPoolPctTx = await compoundAdapter[action.action](
                          liquidityPool,
                          maxDepositPoolPct,
                        );
                        const setMaxDepositPoolPctTx = await _setMaxDepositPoolPctTx.wait();
                        const maxDepositPoolPctSet = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                        expect(+maxDepositPoolPctSet).to.be.eq(+maxDepositPoolPct!);
                        expectInvestLimitEvents(
                          setMaxDepositPoolPctTx,
                          "LogMaxDepositPoolPct",
                          "LogMaxDepositPoolPct(uint256,address)",
                          compoundAdapter.address,
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
                      const existingDepositAmount: BigNumber = await compoundAdapter.maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (!existingDepositAmount.eq(amount)) {
                        const _setMaxDepositAmountTx = await compoundAdapter[action.action](
                          liquidityPool,
                          underlyingTokenAddress,
                          amount,
                        );
                        const setMaxDepositAmountTx = await _setMaxDepositAmountTx.wait();
                        const maxDepositAmountSet = await compoundAdapter.maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        expect(+maxDepositAmountSet).to.be.eq(+amount);
                        expectInvestLimitEvents(
                          setMaxDepositAmountTx,
                          "LogMaxDepositAmount",
                          "LogMaxDepositAmount(uint256,address)",
                          compoundAdapter.address,
                          ownerAddress,
                          amount.toString(),
                        );
                      }
                      limit = amount;
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
                      if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                        let compUnderlyingBalance: BigNumber = await RewardTokenERC20Instance!.balanceOf(
                          testDeFiAdapter.address,
                        );
                        if (+compUnderlyingBalance.lte(+0)) {
                          await fundWalletToken(
                            hre,
                            RewardTokenERC20Instance!.address,
                            users["owner"],
                            getDefaultFundAmountInDecimal(rewardTokenAddress, rewardTokenDecimals),
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
                      //  TODO: This condition has to be added in the contract (OPTY-339)
                      if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.COMP)) {
                        this.skip();
                      }
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await RewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapterAddress);
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
                        adapterAddress,
                        rewardTokenBalanceBefore,
                      );
                      break;
                    }
                    case "getUnclaimedRewardTokenAmount(address,address,address)": {
                      // const compoundController = await getComptroller(
                      //   hre,
                      //   abis.compoundComptroller.abi,
                      //   abis.compoundComptroller.address,
                      // );
                      // console.log("Action: ", action.action)
                      // let comptrollerAddress = await Compound.eth.read(
                      //   liquidityPool,
                      //   'function comptroller() returns (address)',
                      //   [],
                      //   {}
                      // );
                      // console.log("Comptroller using lib: ", comptrollerAddress);
                      // const _unclaimedCompAccured = await Compound.eth.read(
                      //   CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER,
                      //   'function compAccrued(address) returns (uint256)',
                      //   [testDeFiAdapter.address],
                      //   {provider: <Provider><unknown>hre.network.provider}
                      // )
                      // const _unclaimedCompAccured = await executeComptrollerFunc(hre, CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER,
                      //   'function compAccrued(address) returns (uint256)',
                      //   [testDeFiAdapter.address])
                      // console.log("Function executed")
                      // console.log("Unclaimed reward token: ", +_unclaimedCompAccured);
                      expect(
                        await compoundAdapter[action.action](testDeFiAdapter.address, ADDRESS_ZERO, ADDRESS_ZERO),
                      ).to.be.eq(
                        await executeComptrollerFunc(
                          hre,
                          CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER,
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
                      const expectedValue = action.expectedValue;
                      const expectedLpBalanceFromPool = await LpContractInstance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await compoundAdapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      expect(+lpTokenBalance).to.be.eq(+expectedLpBalanceFromPool);
                      const existingMode = await compoundAdapter.maxDepositProtocolMode();
                      if (existingMode == 0) {
                        const existingDepositAmount: BigNumber = await compoundAdapter.maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        if (existingDepositAmount.eq(0)) {
                          expect(lpTokenBalance).to.be.eq(0);
                        } else {
                          expect(lpTokenBalance).to.be.gt(0);
                        }
                      } else {
                        const existingPoolPct: BigNumber = await compoundAdapter.maxDepositPoolPct(liquidityPool);
                        const existingProtocolPct: BigNumber = await compoundAdapter.maxDepositProtocolPct();
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
                      if (+_unclaimedReward > 0) {
                        expectedAmountInUnderlyingToken = expectedAmountInUnderlyingToken.add(
                          await adapterPrerequisites["harvestCodeProvider"].rewardBalanceInUnderlyingTokens(
                            rewardTokenAddress,
                            underlyingTokenAddress,
                            _unclaimedReward,
                          ),
                        );
                      }
                      expect(
                        +(await compoundAdapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                        )),
                      ).to.be.eq(+expectedAmountInUnderlyingToken);
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
                            +_amountInUnderlyingToken > 0
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
                      if (+_lpTokenAmount > 0) {
                        expect(
                          await compoundAdapter[action.action](ADDRESS_ZERO, liquidityPool, _lpTokenAmount),
                        ).to.be.eq(
                          _lpTokenAmount.mul(await LpContractInstance.exchangeRateStored()).div(to_10powNumber_BN(18)),
                        );
                      }
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

      for (let i = 0; i < testDeFiAdaptersScenario?.adapterStandloneStories.length; i++) {
        it(`${testDeFiAdaptersScenario?.adapterStandloneStories[i].description}`, async function () {
          const story = testDeFiAdaptersScenario.adapterStandloneStories[i];
          for (const action of story.setActions) {
            switch (action.action) {
              case "canStake(address)": {
                const _canStake = await compoundAdapter[action.action](ADDRESS_ZERO);
                expect(_canStake).to.be.eq(false);
                break;
              }
              case "setRewardToken(address)": {
                if (action.expect == "success") {
                  await compoundAdapter[action.action](TypedTokens.COMP);
                } else {
                  //  TODO: Add test scenario if operator is trying to set ZERO/EOA ADDRESS as reward token address
                  await expect(
                    compoundAdapter.connect(users[action.executer])[action.action](TypedTokens.COMP),
                  ).to.be.revertedWith(action.message);
                }
                break;
              }
              case "setComptroller(address)": {
                if (action.expect == "success") {
                  await compoundAdapter[action.action](CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER);
                } else {
                  //  TODO: Add test scenario if operater is trying to set ZERO ADDRESS/EOA as comptroller's contract address
                  await expect(
                    compoundAdapter
                      .connect(users[action.executer])
                      [action.action](CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER),
                  ).to.be.revertedWith(action.message);
                }
                break;
              }
            }
          }
          for (const action of story.getActions) {
            switch (action.action) {
              case "getRewardToken(address)": {
                const _rewardTokenAddress = await compoundAdapter[action.action](ADDRESS_ZERO);
                expect(getAddress(_rewardTokenAddress)).to.be.eq(getAddress(TypedTokens.COMP));
                break;
              }
              case "comptroller()": {
                const _comptrollerAddress = await compoundAdapter[action.action]();
                expect(getAddress(_comptrollerAddress)).to.be.eq(getAddress(CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER));
              }
            }
          }
          for (const action of story.cleanActions) {
            switch (action.action) {
              case "setRewardToken(address)": {
                await compoundAdapter[action.action](TypedTokens.COMP);
                const _rewardTokenAddress = await compoundAdapter.getRewardToken(ADDRESS_ZERO);
                expect(getAddress(_rewardTokenAddress)).to.be.eq(getAddress(TypedTokens.COMP));
                break;
              }
              case "setComptroller(address)": {
                await compoundAdapter[action.action](CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER);
                const _comptrollerAddress = await compoundAdapter.comptroller();
                expect(getAddress(_comptrollerAddress)).to.be.eq(getAddress(CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER));
                break;
              }
            }
          }
        });
      }
    });
  });
});

//  Function to check if cToken/crToken Pool is paused or not.
//  @dev: SAI,REP = Mint is paused for cSAI, cREP
//  @dev: WBTC has mint paused for latest blockNumbers, However WBTC2 works fine with the latest blockNumber (For Compound)
export async function lpPausedStatus(
  hre: HardhatRuntimeEnvironment,
  pool: string,
  comptrollerAddress: string,
): Promise<boolean> {
  console.log("Coming in lpPausedStatus function");
  // const comptrollerAddress = CONTRACT_ADDRESSES.COMPOUND_COMPTROLLER
  console.log("Comptroller using lib: ", comptrollerAddress);

  const lpPauseStatus = await executeComptrollerFunc(
    hre,
    comptrollerAddress,
    "function mintGuardianPaused(address) returns (bool)",
    [pool],
  );
  // await Compound.eth.read(
  //   comptrollerAddress,
  //   'function mintGuardianPaused(address) returns (bool)',
  //   [pool],
  //   {provider: <Provider><unknown>hre.network.provider}
  // );

  console.log("lpPausedStatus using lib: ", lpPauseStatus);

  // const controller = await getComptroller(hre, controllerABI, controllerAddr);
  // const lpPauseStatus = await controller["mintGuardianPaused(address)"](pool);
  return lpPauseStatus;
}

export async function executeComptrollerFunc(
  hre: HardhatRuntimeEnvironment,
  comptrollerAddress: string,
  functionSignature: string,
  params: any[],
) {
  const funcExecutionOutput = await Compound.eth.read(comptrollerAddress, functionSignature, [...params], {
    provider: <Provider>(<unknown>hre.network.provider),
  });
  return funcExecutionOutput;
}
