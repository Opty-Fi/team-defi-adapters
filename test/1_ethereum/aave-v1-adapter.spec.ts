import chai, { expect, assert } from "chai";
import { solidity } from "ethereum-waffle";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils } from "ethers";
import { CONTRACTS } from "../../helpers/type";
import { ADDRESS_ZERO, TESTING_DEPLOYMENT_ONCE } from "../../helpers/constants/utils";
import { VAULT_TOKENS } from "../../helpers/constants/tokens";
import { AAVE_V1_ADAPTER_NAME } from "../../helpers/constants/adapters";
import { TypedAdapterStrategies, TypedDefiPools, TypedTokens, TypedContracts } from "../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../helpers/contracts-actions";
import {
  deployContract,
  moveToNextBlock,
  getDefaultFundAmountInDecimal,
  moveToSpecificBlock,
} from "../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import scenarios from "./scenarios/adapters.json";
import testDeFiAdapterScenario from "./scenarios/aave-temp-defi-adapter.json";
import IUniswapV2Router02 from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { IAaveV1LendingPoolCore } from "../../typechain";

chai.use(solidity);

type ARGUMENTS = {
  amount?: { [key: string]: string };
  type?: number;
  userName?: string;
};

interface TEST_DEFI_ADAPTER_ARGUMENTS {
  maxDepositProtocolPct?: string | null;
  maxDepositPoolPct?: string | null;
  maxDepositAmount?: string | null;
  mode?: string | null;
}

describe(`${AAVE_V1_ADAPTER_NAME} Unit test`, () => {
  const strategies = TypedAdapterStrategies[AAVE_V1_ADAPTER_NAME];
  const MAX_AMOUNT = BigNumber.from("20000000000000000000");
  const BORROW_AMOUNT = BigNumber.from("200000000000000000");
  const SNTToken = "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F";
  let adapterPrerequisites: CONTRACTS;
  let aaveV1Adapter: Contract;
  let ownerAddress: string;
  let users: { [key: string]: Signer };
  before(async () => {
    try {
      const [owner, admin, user1] = await hre.ethers.getSigners();
      users = { owner, admin, user1 };
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Adapter pre-requisites contracts not deployed");
      aaveV1Adapter = await deployAdapter(
        hre,
        owner,
        AAVE_V1_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(aaveV1Adapter, "Adapter not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < strategies.length; i++) {
    describe(`test getCodes() for ${strategies[i].strategyName}`, async () => {
      const strategy = strategies[i];
      const token = VAULT_TOKENS[strategy.token].address;
      let lpProvider: Contract;
      let lpContract: Contract;
      let lpCoreAddress: string;
      let lpAddress: string;
      let lpToken: string;
      before(async () => {
        try {
          lpProvider = await hre.ethers.getContractAt(
            "IAaveV1LendingPoolAddressesProvider",
            strategy.strategy[0].contract,
          );
          lpCoreAddress = await lpProvider.getLendingPoolCore();
          lpAddress = await lpProvider.getLendingPool();
          lpContract = await hre.ethers.getContractAt("IAaveV1", lpAddress);
          lpToken = await aaveV1Adapter.getLiquidityPoolToken(token, lpProvider.address);
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          await fundWalletToken(hre, lpToken, users["owner"], MAX_AMOUNT, timestamp);
          await fundWalletToken(hre, token, users["owner"], MAX_AMOUNT, timestamp);
          await fundWalletToken(hre, SNTToken, users["owner"], MAX_AMOUNT, timestamp);
          await lpContract.setUserUseReserveAsCollateral(token, true);
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
                    codes = await aaveV1Adapter[action.action](
                      ownerAddress,
                      token,
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    depositAmount = amount[strategy.token];
                  }
                } else {
                  codes = await aaveV1Adapter[action.action](ownerAddress, token, strategy.strategy[0].contract);
                }

                for (let i = 0; i < codes.length; i++) {
                  if (i < 2) {
                    const inter = new utils.Interface(["function approve(address,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(token);
                    const value = inter.decodeFunctionData("approve", abiCode);
                    expect(value[0]).to.equal(lpCoreAddress);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[1]).to.equal(i === 0 ? 0 : depositAmount);
                    }
                  } else {
                    const inter = new utils.Interface(["function deposit(address,uint256,uint16)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(lpAddress);
                    const value = inter.decodeFunctionData("deposit", abiCode);
                    expect(value[0]).to.equal(token);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[1]).to.equal(depositAmount);
                    }
                    expect(value[2]).to.equal(0);
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
                    codes = await aaveV1Adapter[action.action](
                      ownerAddress,
                      token,
                      strategy.strategy[0].contract,
                      amount[strategy.token],
                    );
                    withdrawAmount = amount[strategy.token];
                  }
                } else {
                  codes = await aaveV1Adapter[action.action](ownerAddress, token, strategy.strategy[0].contract);
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
              case "getBorrowAllCodes(address,address,address,address)": {
                const codes = await aaveV1Adapter[action.action](
                  ownerAddress,
                  token,
                  strategy.strategy[0].contract,
                  SNTToken,
                );
                expect(codes.length).to.be.equal(1);

                const inter = new utils.Interface(["function borrow(address,uint256,uint256,uint16)"]);
                const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[0]);
                expect(address).to.be.equal(lpAddress);
                const value = inter.decodeFunctionData("borrow", abiCode);
                expect(value.length).to.be.equal(4);
                expect(value[0]).to.be.equal(SNTToken);

                break;
              }
              case "getRepayAndWithdrawAllCodes(address,address,address,address)": {
                await lpContract.borrow(SNTToken, BORROW_AMOUNT, 2, 0);
                const SNTContract = await hre.ethers.getContractAt("IERC20", SNTToken);
                const SNTBalance = await SNTContract.balanceOf(ownerAddress);
                const codes = await aaveV1Adapter[action.action](
                  ownerAddress,
                  token,
                  strategy.strategy[0].contract,
                  SNTToken,
                );
                expect(codes.length).to.equal(4);
                for (let i = 0; i < codes.length; i++) {
                  if (i === 3) {
                    const inter = new utils.Interface(["function redeem(uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(lpToken);
                    const value = inter.decodeFunctionData("redeem", abiCode);
                    expect(value[0]).to.gt(0);
                  } else if (i === 2) {
                    const inter = new utils.Interface(["function repay(address,uint256,address)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(lpAddress);
                    const value = inter.decodeFunctionData("repay", abiCode);
                    expect(value[0]).to.equal(SNTToken);
                    expect(value[1]).to.equal(SNTBalance);
                    expect(value[2]).to.equal(ownerAddress);
                  } else {
                    const inter = new utils.Interface(["function approve(address,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(SNTToken);
                    const value = inter.decodeFunctionData("approve", abiCode);
                    expect(value[0]).to.equal(lpCoreAddress);
                    expect(value[1]).to.equal(i === 0 ? 0 : SNTBalance);
                  }
                }
              }
            }
          }
        }).timeout(150000);
      }
    });
  }

  describe(`${testDeFiAdapterScenario.title} - AaveV1Adapter`, () => {
    const adapterNames = Object.keys(TypedDefiPools);
    let testDeFiAdapter: Contract;

    before(async () => {
      testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    });

    for (const adapterName of adapterNames) {
      // TODO: In future it can be leverage across all the adapters
      if (adapterName == "AaveV1Adapter") {
        const pools = Object.keys(TypedDefiPools[adapterName]);
        for (const pool of pools) {
          const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
          const liquidityPool = TypedDefiPools[adapterName][pool].pool;
          const lpToken = TypedDefiPools[adapterName][pool].lpToken;
          if (TypedDefiPools[adapterName][pool].tokens.length == 1) {
            for (const story of testDeFiAdapterScenario.stories) {
              it(`${pool} - ${story.description}`, async function () {
                const adapterAddress = aaveV1Adapter.address;
                if (
                  underlyingTokenAddress == getAddress(TypedTokens["REP"]) ||
                  underlyingTokenAddress == getAddress(TypedTokens["ETH"])
                ) {
                  this.skip();
                }
                const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
                const aTokenERC20Instance = await hre.ethers.getContractAt("ERC20", lpToken);
                const aTokenInstance = await hre.ethers.getContractAt("IAaveV1Token", lpToken);
                const getCode = await aTokenInstance.provider.getCode(aTokenInstance.address);
                if (getCode === "0x") {
                  this.skip();
                }
                const lendingPoolInstance = await hre.ethers.getContractAt(
                  "IAaveV1",
                  TypedContracts.AAVE_V1_LENDING_POOL,
                );
                const priceOracle = await hre.ethers.getContractAt(
                  "IAaveV1PriceOracle",
                  TypedContracts.AAVE_V1_PRICE_ORACLE,
                );
                const lendingPoolCoreInstance = <IAaveV1LendingPoolCore>(
                  await hre.ethers.getContractAt("IAaveV1LendingPoolCore", TypedContracts.AAVE_V1_LENDING_POOL_CORE)
                );
                const uniswapInstance = new hre.ethers.Contract(
                  TypedContracts.UNISWAPV2_ROUTER,
                  IUniswapV2Router02.abi,
                  users["owner"],
                );
                const borrowToken =
                  getAddress(underlyingTokenAddress) !== getAddress(TypedTokens.SNX)
                    ? TypedTokens.SNX
                    : TypedTokens.DAI;
                const borrowTokenInstance = await hre.ethers.getContractAt("ERC20", borrowToken);

                const timestamp = (await getBlockTimestamp(hre)) * 2;

                const decimals = await ERC20Instance.decimals();
                let defaultFundAmount: BigNumber = getDefaultFundAmountInDecimal(underlyingTokenAddress, decimals);
                let limit: BigNumber = hre.ethers.BigNumber.from(0);

                let underlyingBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let borrowTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let lpTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let isWithdrawSome: boolean = false;

                for (const action of story.setActions) {
                  switch (action.action) {
                    case "setMaxDepositProtocolMode(uint8)": {
                      const { mode } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      const existingMode = await aaveV1Adapter.maxDepositProtocolMode();
                      if (existingMode != mode) {
                        await aaveV1Adapter[action.action](mode);
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await aaveV1Adapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await aaveV1Adapter.setMaxDepositPoolPct(underlyingTokenAddress, 0);
                      }
                      const { maxDepositProtocolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      const existingProtocolPct: BigNumber = await aaveV1Adapter.maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        await aaveV1Adapter[action.action](maxDepositProtocolPct);
                      }
                      const poolValue: BigNumber = await aaveV1Adapter.getPoolValue(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      break;
                    }
                    case "setMaxDepositPoolPct(address,uint256)": {
                      const { maxDepositPoolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      const existingPoolPct: BigNumber = await aaveV1Adapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                        await aaveV1Adapter[action.action](liquidityPool, maxDepositPoolPct);
                      }
                      const poolValue: BigNumber = await aaveV1Adapter.getPoolValue(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      break;
                    }
                    case "setMaxDepositAmount(address,address,uint256)": {
                      const { maxDepositAmount } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      let amount = BigNumber.from("0");
                      if (maxDepositAmount === ">") {
                        amount = defaultFundAmount.mul(BigNumber.from("10"));
                      } else if (maxDepositAmount === "<") {
                        amount = defaultFundAmount.div(BigNumber.from("10"));
                      }
                      const existingDepositAmount: BigNumber = await aaveV1Adapter.maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (!existingDepositAmount.eq(amount)) {
                        await expect(aaveV1Adapter[action.action](liquidityPool, underlyingTokenAddress, amount))
                          .to.emit(aaveV1Adapter, "LogMaxDepositAmount")
                          .withArgs(amount, ownerAddress);
                        expect(await aaveV1Adapter.maxDepositAmount(liquidityPool, underlyingTokenAddress)).to.equal(
                          amount,
                        );
                      }
                      limit = await aaveV1Adapter.maxDepositAmount(liquidityPool, underlyingTokenAddress);
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
                      isWithdrawSome = false;
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                    case "testGetWithdrawSomeCodes(address,address,address,uint256)": {
                      isWithdrawSome = true;
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance: BigNumber = await aaveV1Adapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      lpTokenBalanceBefore = lpTokenBalance;
                      await testDeFiAdapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                        adapterAddress,
                        lpTokenBalance,
                      );
                      break;
                    }
                    case "testGetBorrowAllCodes(address,address,address,address)": {
                      if ((await lendingPoolCoreInstance.getReserveConfiguration(underlyingTokenAddress))[3] == false) {
                        this.skip();
                      }
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      borrowTokenBalanceBefore = await borrowTokenInstance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        borrowToken,
                        adapterAddress,
                      );
                      break;
                    }
                    case "wait10000Seconds": {
                      const blockNumber = await hre.ethers.provider.getBlockNumber();
                      const block = await hre.ethers.provider.getBlock(blockNumber);
                      await moveToSpecificBlock(hre, block.timestamp + 10000);
                      break;
                    }
                    case "getUnderlyingTokens(address,address)": {
                      const expectedUnderlyingAddress = await aaveV1Adapter[action.action](ADDRESS_ZERO, lpToken);
                      const underlyingAddress = await aTokenInstance.underlyingAssetAddress();
                      expect([getAddress(expectedUnderlyingAddress[0])]).to.have.members([
                        getAddress(underlyingAddress),
                      ]);
                      break;
                    }
                    case "calculateAmountInLPToken(address,address,uint256)": {
                      const depositAmount: BigNumber = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                      const amountInLPToken = await aaveV1Adapter[action.action](
                        ADDRESS_ZERO,
                        liquidityPool,
                        depositAmount,
                      );
                      expect(amountInLPToken).to.be.eq(depositAmount);
                      break;
                    }
                    case "getPoolValue(address,address)": {
                      const poolValue = await aaveV1Adapter[action.action](liquidityPool, underlyingTokenAddress);
                      const expectedPoolValue = (await lendingPoolInstance.getReserveData(underlyingTokenAddress))[1];
                      expect(poolValue).to.be.eq(expectedPoolValue);
                      break;
                    }
                    case "getLiquidityPoolToken(address,address)": {
                      const liquidityPoolFromAdapter = await aaveV1Adapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      expect(getAddress(liquidityPoolFromAdapter)).to.be.eq(getAddress(lpToken));
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      const expectedValue = action.expectedValue;
                      const underlyingBalanceAfter = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await aaveV1Adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const poolValue = await aaveV1Adapter["getPoolValue(address,address)"](
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      const existingMode = await aaveV1Adapter.maxDepositProtocolMode();
                      if (existingMode == 0) {
                        const existingDepositAmount: BigNumber = await aaveV1Adapter.maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        if (existingDepositAmount.eq(0)) {
                          expect(lpTokenBalance).to.be.eq(0);
                        } else {
                          expect(lpTokenBalance).to.be.gt(0);
                        }
                      } else {
                        const existingPoolPct: BigNumber = await aaveV1Adapter.maxDepositPoolPct(liquidityPool);
                        const existingProtocolPct: BigNumber = await aaveV1Adapter.maxDepositProtocolPct();
                        if ((existingPoolPct.eq(0) && existingProtocolPct.eq(0)) || poolValue.eq(0)) {
                          expect(lpTokenBalance).to.be.eq(0);
                        } else {
                          if (expectedValue == "=0") {
                            if (isWithdrawSome === false) {
                              expect(lpTokenBalance).to.be.eq(0);
                            } else {
                              expect(lpTokenBalanceBefore).to.be.eq(underlyingBalanceAfter);
                            }
                          } else {
                            expect(lpTokenBalance).to.be.gt(0);
                          }
                        }
                      }
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
                          ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                          : expect(underlyingBalanceAfter).to.be.eq(underlyingBalanceBefore.sub(limit));
                      }
                      break;
                    }
                    case "borrowTokenBalance": {
                      const expectedValue = action.expectedValue;
                      const borrowTokenBalanceAfter: BigNumber = await borrowTokenInstance.balanceOf(
                        testDeFiAdapter.address,
                      );
                      expectedValue == ">0"
                        ? expect(borrowTokenBalanceAfter).to.be.gt(borrowTokenBalanceBefore)
                        : expect(borrowTokenBalanceAfter).to.be.eq(0);
                      break;
                    }
                    case "isRedeemableAmountSufficient(address,address,address,uint256)": {
                      const expectedValue = action.expectedValue;
                      const amountInUnderlyingToken: BigNumber = await aaveV1Adapter.getAllAmountInToken(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      if (expectedValue == ">") {
                        const isRedeemableAmountSufficient = await aaveV1Adapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          amountInUnderlyingToken.add(BigNumber.from(10)),
                        );
                        expect(isRedeemableAmountSufficient).to.be.eq(false);
                      } else if (expectedValue == "<") {
                        const isRedeemableAmountSufficient = await aaveV1Adapter[action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          amountInUnderlyingToken.gt(0)
                            ? amountInUnderlyingToken.sub(BigNumber.from(1))
                            : BigNumber.from(0),
                        );
                        expect(isRedeemableAmountSufficient).to.be.eq(true);
                      }
                      break;
                    }
                    case "calculateRedeemableLPTokenAmount(address,address,address,uint256)": {
                      const lpTokenBalance: BigNumber = await aaveV1Adapter.getLiquidityPoolTokenBalance(
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const testRedeemAmount: BigNumber = lpTokenBalance;
                      const redeemableLpTokenAmt = await aaveV1Adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                        testRedeemAmount,
                      );
                      expect(redeemableLpTokenAmt).to.be.eq(lpTokenBalance);
                      break;
                    }
                    case "getAllAmountInToken(address,address,address)": {
                      const amountInUnderlyingToken = await aaveV1Adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      const lpTokenBalance = await aTokenERC20Instance.balanceOf(testDeFiAdapter.address);
                      expect(amountInUnderlyingToken).to.be.eq(lpTokenBalance);
                      break;
                    }
                    case "getSomeAmountInToken(address,address,uint256)": {
                      const lpTokenDecimals = await aTokenERC20Instance.decimals();
                      const lpTokenAmount = defaultFundAmount.mul(BigNumber.from(10).pow(lpTokenDecimals));
                      if (lpTokenAmount.gt(0)) {
                        const _amountInUnderlyingToken = await aaveV1Adapter[action.action](
                          ADDRESS_ZERO,
                          liquidityPool,
                          lpTokenAmount,
                        );
                        expect(_amountInUnderlyingToken).to.be.eq(lpTokenAmount);
                      }
                      break;
                    }
                    case "getAllAmountInTokenBorrow(address,address,address,address,uint256)": {
                      const borrowAmount = await borrowTokenInstance.balanceOf(testDeFiAdapter.address);
                      const amountInUnderlyingToken = await aaveV1Adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                        borrowToken,
                        borrowAmount,
                      );
                      const lpTokenBalance = await aTokenERC20Instance.balanceOf(testDeFiAdapter.address);
                      const debt = (
                        await lendingPoolInstance.getUserReserveData(borrowToken, testDeFiAdapter.address)
                      )[1];
                      const locked: BigNumber = borrowAmount.mul(BigNumber.from(10).pow(18)).div(debt);
                      const safeWithdraw: BigNumber = lpTokenBalance.mul(locked).div(BigNumber.from(10).pow(18));
                      const maxWithdrawal: BigNumber =
                        safeWithdraw > lpTokenBalance
                          ? lpTokenBalance
                          : lpTokenBalance.sub(lpTokenBalance.sub(safeWithdraw).mul(2));
                      const underlyingPrice: BigNumber = await priceOracle.getAssetPrice(underlyingTokenAddress);
                      const borrowTokenPrice: BigNumber = await priceOracle.getAssetPrice(borrowToken);
                      const eth: BigNumber = maxWithdrawal
                        .mul(underlyingPrice)
                        .mul(65)
                        .div(100)
                        .div(BigNumber.from(10).pow(decimals))
                        .div(2);
                      const totalBorrows: BigNumber = (
                        await lendingPoolInstance.getUserAccountData(testDeFiAdapter.address)
                      )[2];
                      const availableBorrows: BigNumber = (
                        await lendingPoolInstance.getUserAccountData(testDeFiAdapter.address)
                      )[4];
                      let maxSafeETH: BigNumber = totalBorrows.add(availableBorrows).div(2);
                      maxSafeETH = maxSafeETH.mul(105).div(100);
                      if (eth > maxSafeETH) {
                        maxSafeETH = BigNumber.from(0);
                      } else {
                        maxSafeETH = maxSafeETH.sub(eth);
                      }
                      let over: BigNumber;
                      if (maxSafeETH.lt(totalBorrows)) {
                        over = totalBorrows.mul(totalBorrows.sub(maxSafeETH)).div(totalBorrows);
                        over = over
                          .mul(BigNumber.from(10).pow(await borrowTokenInstance.decimals()))
                          .div(borrowTokenPrice);
                      } else {
                        over = BigNumber.from(0);
                      }
                      if (over > borrowAmount) {
                        expect(amountInUnderlyingToken).to.be.eq(maxWithdrawal);
                      } else {
                        const optimalAmount: BigNumber = (
                          await uniswapInstance.getAmountsOut(borrowAmount.sub(over), [
                            borrowToken,
                            TypedTokens.WETH,
                            underlyingTokenAddress,
                          ])
                        )[2];
                        const result: BigNumber = maxWithdrawal.add(optimalAmount);
                        expect(amountInUnderlyingToken).to.be.eq(result);
                      }
                      break;
                    }
                    case "getSomeAmountInTokenBorrow(address,address,address,uint256,address,uint256)": {
                      const borrowAmount = await borrowTokenInstance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await aTokenERC20Instance.balanceOf(testDeFiAdapter.address);
                      const amountInUnderlyingToken = await aaveV1Adapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                        lpTokenBalance,
                        borrowToken,
                        borrowAmount,
                      );
                      const debt = (
                        await lendingPoolInstance.getUserReserveData(borrowToken, testDeFiAdapter.address)
                      )[1];
                      const locked: BigNumber = borrowAmount.mul(BigNumber.from(10).pow(18)).div(debt);
                      const safeWithdraw: BigNumber = lpTokenBalance.mul(locked).div(BigNumber.from(10).pow(18));
                      const maxWithdrawal: BigNumber =
                        safeWithdraw > lpTokenBalance
                          ? lpTokenBalance
                          : lpTokenBalance.sub(lpTokenBalance.sub(safeWithdraw).mul(2));
                      const underlyingPrice: BigNumber = await priceOracle.getAssetPrice(underlyingTokenAddress);
                      const borrowTokenPrice: BigNumber = await priceOracle.getAssetPrice(borrowToken);
                      const eth: BigNumber = maxWithdrawal
                        .mul(underlyingPrice)
                        .div(BigNumber.from(10).pow(decimals))
                        .mul(65)
                        .div(100)
                        .div(2);
                      const totalBorrows: BigNumber = (
                        await lendingPoolInstance.getUserAccountData(testDeFiAdapter.address)
                      )[2];
                      const availableBorrows: BigNumber = (
                        await lendingPoolInstance.getUserAccountData(testDeFiAdapter.address)
                      )[4];
                      let maxSafeETH: BigNumber = totalBorrows.add(availableBorrows).div(2);
                      maxSafeETH = maxSafeETH.mul(105).div(100);
                      if (eth > maxSafeETH) {
                        maxSafeETH = BigNumber.from(0);
                      } else {
                        maxSafeETH = maxSafeETH.sub(eth);
                      }
                      let over: BigNumber;
                      if (maxSafeETH.lt(totalBorrows)) {
                        over = totalBorrows.mul(totalBorrows.sub(maxSafeETH)).div(totalBorrows);
                        over = over
                          .mul(BigNumber.from(10).pow(await borrowTokenInstance.decimals()))
                          .div(borrowTokenPrice);
                      } else {
                        over = BigNumber.from(0);
                      }
                      if (over > borrowAmount) {
                        expect(amountInUnderlyingToken).to.be.eq(maxWithdrawal);
                      } else {
                        const optimalAmount: BigNumber = (
                          await uniswapInstance.getAmountsOut(borrowAmount.sub(over), [
                            borrowToken,
                            TypedTokens.WETH,
                            underlyingTokenAddress,
                          ])
                        )[2];
                        const result: BigNumber = maxWithdrawal.add(optimalAmount);
                        expect(amountInUnderlyingToken).to.be.eq(result);
                      }
                      break;
                    }
                  }
                }
                for (const action of story.cleanActions) {
                  switch (action.action) {
                    case "fundTestDeFiAdapterContract": {
                      const underlyingBalance: BigNumber = await borrowTokenInstance.balanceOf(testDeFiAdapter.address);
                      await fundWalletToken(
                        hre,
                        borrowToken,
                        users["owner"],
                        underlyingBalance.div(2),
                        timestamp,
                        testDeFiAdapter.address,
                      );
                      break;
                    }
                    case "testGetWithdrawAllCodes(address,address,address)": {
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                    case "testGetRepayAndWithdrawAllCodes(address,address,address,address)": {
                      await moveToNextBlock(hre);
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        borrowToken,
                        adapterAddress,
                      );
                      break;
                    }
                    case "setMaxDepositProtocolMode(uint8)": {
                      await aaveV1Adapter[action.action](0);
                      break;
                    }
                    case "setMaxDepositPoolPct(address,uint256)": {
                      const existingPoolPct: BigNumber = await aaveV1Adapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(0)) {
                        await aaveV1Adapter[action.action](liquidityPool, 0);
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await aaveV1Adapter.maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await aaveV1Adapter.setMaxDepositPoolPct(underlyingTokenAddress, 0);
                      }
                      break;
                    }
                    case "burnTokens": {
                      await testDeFiAdapter.burnBorrowTokens(borrowToken);
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      const lpTokenBalance = await aaveV1Adapter[action.action](
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
              });
            }
            for (let i = 0; i < testDeFiAdapterScenario.adapterStandaloneStories.length; i++) {
              it(`${testDeFiAdapterScenario?.adapterStandaloneStories[i].description}`, async function () {
                const story = testDeFiAdapterScenario.adapterStandaloneStories[i];
                for (const action of story.setActions) {
                  switch (action.action) {
                    case "canStake(address)": {
                      const canStake = await aaveV1Adapter[action.action](ADDRESS_ZERO);
                      expect(canStake).to.be.eq(false);
                      break;
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
});
