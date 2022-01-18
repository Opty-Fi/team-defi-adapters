import chai, { expect, assert } from "chai";
import hre from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract, Signer, BigNumber, utils, ethers, BigNumberish } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { CONTRACTS } from "../../helpers/type";
import { TESTING_DEPLOYMENT_ONCE, ADDRESS_ZERO } from "../../helpers/constants/utils";
import { CURVE_SWAP_POOL_ADAPTER_NAME, CURVE_DEPOSIT_POOL_ADAPTER_NAME } from "../../helpers/constants/adapters";
import { TypedAdapterStrategies, TypedContracts, TypedTokens } from "../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../helpers/contracts-actions";
import scenarios from "./scenarios/adapters.json";
import testDeFiAdapterScenario from "./scenarios/curve-test-defi-adapter.json";
import { deployContract, getDefaultFundAmountInDecimal } from "../../helpers/helpers";
import { ERC20 } from "../../typechain/ERC20";
import { to_10powNumber_BN } from "../../helpers/utils";
import { VAULT_TOKENS } from "../../helpers/constants/tokens";
import { default as CurveExports } from "@optyfi/defi-legos/ethereum/curve/contracts";

chai.use(solidity);

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

type TEST_DEFI_ADAPTER_ARGUMENTS = {
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
  mode?: string;
};

type ACTION_TYPES = {
  contract: string;
  action: string;
  executer: string;
  expectedValue: any;
};

interface PoolItem {
  pool: string;
  lpToken: string;
  stakingVault?: string;
  rewardToken?: string;
  tokens: string[];
  swap?: string;
  gauge?: string;
  deprecated?: boolean;
  tokenIndexes?: string[];
}

interface LiquidityPool {
  [name: string]: PoolItem;
}

const curveAdapters: CONTRACTS = {};

const POOLED_TOKENS = [TypedTokens.ADAI, TypedTokens.ASUSD, TypedTokens.AUSDC, TypedTokens.AUSDT, TypedTokens.STETH];
const YEARN_POOL = getAddress("0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF");
const vaultUnderlyingTokens = Object.values(VAULT_TOKENS).map(x => getAddress(x.address));
describe("CurveAdapters Unit test", () => {
  const MAX_AMOUNT: { [key: string]: BigNumber } = {
    DAI: BigNumber.from("1000000000000000000000"),
    USDC: BigNumber.from("1000000000"),
  };
  let adapterPrerequisites: CONTRACTS;
  let harvestCodeProviderContract: Contract;
  let ownerAddress: string;
  let users: { [key: string]: Signer };
  before(async () => {
    try {
      const [owner, admin, user1] = await hre.ethers.getSigners();
      users = { owner, admin, user1 };
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Adapter pre-requisites contracts not deployed");
      curveAdapters[CURVE_DEPOSIT_POOL_ADAPTER_NAME] = await deployAdapter(
        hre,
        owner,
        CURVE_DEPOSIT_POOL_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(curveAdapters[CURVE_DEPOSIT_POOL_ADAPTER_NAME], "CurveDepositPoolAdapter not deployed");
      curveAdapters[CURVE_SWAP_POOL_ADAPTER_NAME] = await deployAdapter(
        hre,
        owner,
        CURVE_SWAP_POOL_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(curveAdapters[CURVE_SWAP_POOL_ADAPTER_NAME], "CurveSwapPoolAdapter not deployed");
      harvestCodeProviderContract = adapterPrerequisites.harvestCodeProvider;
      assert.isDefined(harvestCodeProviderContract, "HarvestCodeProvider not deployed");
    } catch (error: any) {
      console.log(error);
    }
  });

  for (const curveAdapterName of [CURVE_DEPOSIT_POOL_ADAPTER_NAME, CURVE_SWAP_POOL_ADAPTER_NAME]) {
    const strategies = TypedAdapterStrategies[curveAdapterName];
    for (let i = 0; i < strategies.length; i++) {
      describe(`${curveAdapterName} - test getCodes() for ${strategies[i].strategyName}`, async () => {
        const strategy = strategies[i];
        let lpToken: string;
        let nCoins: string[];
        const depositAmount: string[] = [];
        before(async () => {
          try {
            const timestamp = (await getBlockTimestamp(hre)) * 2;
            nCoins = await curveAdapters[curveAdapterName].getUnderlyingTokens(
              strategy.strategy[0].contract,
              ADDRESS_ZERO,
            );
            for (let i = 0; i < nCoins.length; i++) {
              if (nCoins[i] === TypedTokens["DAI"]) {
                await fundWalletToken(hre, nCoins[i], users["owner"], MAX_AMOUNT["DAI"], timestamp);
                depositAmount.push(MAX_AMOUNT["DAI"].div(BigNumber.from("2")).toString());
              } else if (nCoins[i] === TypedTokens["USDC"]) {
                await fundWalletToken(hre, nCoins[i], users["owner"], MAX_AMOUNT["USDC"], timestamp);
                depositAmount.push(MAX_AMOUNT["USDC"].div(BigNumber.from("2")).toString());
              } else {
                depositAmount.push("0");
              }
            }
            lpToken = await curveAdapters[curveAdapterName].getLiquidityPoolToken(
              ADDRESS_ZERO,
              strategy.strategy[0].contract,
            );
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
                  if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                    const { amount }: ARGUMENTS = action.args;
                    if (amount) {
                      codes = await curveAdapters[curveAdapterName][action.action](
                        ADDRESS_ZERO,
                        nCoins[0], // DAI
                        strategy.strategy[0].contract,
                        depositAmount[0],
                      );
                    }
                  } else {
                    codes = await curveAdapters[curveAdapterName][action.action](
                      ownerAddress,
                      nCoins[0],
                      strategy.strategy[0].contract,
                    );
                  }
                  if (codes.length > 0) {
                    for (let i = 0; i < codes.length - 1; i = i + 2) {
                      const tokenIndex = i / 2;
                      if (parseInt(depositAmount[tokenIndex]) > 0) {
                        const inter = new utils.Interface(["function approve(address,uint256)"]);
                        const checkApproval = (code: string, amount: string) => {
                          if (code !== "0x") {
                            const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], code);
                            expect(address).to.equal(nCoins[tokenIndex]);
                            const value = inter.decodeFunctionData("approve", abiCode);
                            expect(value[0]).to.equal(strategy.strategy[0].contract);
                            if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                              expect(value[1]).to.equal(amount);
                            }
                          }
                        };
                        checkApproval(codes[i], "0");
                        checkApproval(codes[i + 1], depositAmount[tokenIndex]);
                      }
                    }
                    const inter = new utils.Interface([`function add_liquidity(uint256[${nCoins.length}],uint256)`]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(
                      ["address", "bytes"],
                      codes[codes.length - 1],
                    );
                    expect(address).to.equal(strategy.strategy[0].contract);
                    const value = inter.decodeFunctionData("add_liquidity", abiCode);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[0].length).to.equal(depositAmount.length);
                      expect(value[0][0]).to.equal(depositAmount[0]);
                    }
                    expect(value[1]).to.be.gte(0);
                  }

                  break;
                }
                case "getWithdrawAllCodes(address,address,address)":
                case "getWithdrawSomeCodes(address,address,address,uint256)": {
                  let codes;
                  const withdrawalAmount = BigNumber.from("1000000000");
                  if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
                    const { amount }: ARGUMENTS = action.args;
                    if (amount) {
                      codes = await curveAdapters[curveAdapterName][action.action](
                        ADDRESS_ZERO,
                        nCoins[0],
                        strategy.strategy[0].contract,
                        withdrawalAmount,
                      );
                    }
                  } else {
                    codes = await curveAdapters[curveAdapterName][action.action](
                      ownerAddress,
                      nCoins[0],
                      strategy.strategy[0].contract,
                    );
                  }

                  for (let i = 0; i < codes.length; i++) {
                    if (i < 2) {
                      const inter = new utils.Interface(["function approve(address,uint256)"]);
                      const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                      expect(address).to.equal(lpToken);
                      const value = inter.decodeFunctionData("approve", abiCode);
                      expect(value[0]).to.equal(strategy.strategy[0].contract);
                      if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
                        expect(value[1]).to.equal(i == 0 ? 0 : withdrawalAmount);
                      }
                    } else {
                      const inter = new utils.Interface([`function remove_liquidity_one_coin(uint256,int128,uint256)`]);
                      const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                      expect(address).to.equal(strategy.strategy[0].contract);
                      const value = inter.decodeFunctionData("remove_liquidity_one_coin", abiCode);
                      if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
                        expect(value[0]).to.equal(withdrawalAmount);
                      }
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
  }

  describe("CurveAdapters pools test", () => {
    let testDeFiAdapter: Contract;
    let uniswapV2FactoryInstance: Contract;

    before(async () => {
      testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
      uniswapV2FactoryInstance = await hre.ethers.getContractAt("IUniswapV2Factory", TypedContracts.UNISWAPV2_FACTORY);
    });

    for (const curveAdapterName of [CURVE_DEPOSIT_POOL_ADAPTER_NAME, CURVE_SWAP_POOL_ADAPTER_NAME]) {
      describe(`Test-${curveAdapterName}`, () => {
        const key: "CurveDepositPool" | "CurveSwapPool" =
          curveAdapterName == CURVE_DEPOSIT_POOL_ADAPTER_NAME ? "CurveDepositPool" : "CurveSwapPool";
        const typedPools = CurveExports[key] || [];
        const pools = Object.keys(typedPools);
        for (const pool of pools) {
          if ((CurveExports[key] as LiquidityPool)[pool].tokens.length == 1) {
            let gaugeContract: Contract;
            let swapPoolContract: Contract;
            let liquidityPoolContract: Contract;
            let lpTokenContract: Contract;
            let rewardTokenInstance: Contract;
            for (const story of testDeFiAdapterScenario.stories) {
              it(`${pool} - ${story.description}`, async function () {
                let limit: BigNumber;
                let lpTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let underlyingBalanceBefore: BigNumber = ethers.BigNumber.from(0);
                let limitInUnderlyingToken: BigNumber = ethers.BigNumber.from(0);
                let rewardTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let gaugeTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
                let isTestingStakingFunction = false;
                const underlyingTokenAddress = getAddress((CurveExports[key] as LiquidityPool)[pool].tokens[0]);
                const ERC20Instance = <ERC20>await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
                const decimals = await ERC20Instance.decimals();
                let defaultFundAmount: BigNumber = getDefaultFundAmountInDecimal(underlyingTokenAddress, decimals);
                const timestamp = (await getBlockTimestamp(hre)) * 2;
                const liquidityPool = (CurveExports[key] as LiquidityPool)[pool].pool;
                const lpToken = (CurveExports[key] as LiquidityPool)[pool].lpToken;
                const _underlyingTokens = (CurveExports[key] as LiquidityPool)[pool].tokens;
                const tokenIndexArr = (CurveExports[key] as LiquidityPool)[pool].tokenIndexes as string[];
                const checksumedUnderlyingTokens = _underlyingTokens.map((x: string) => {
                  if (getAddress(x) == getAddress(TypedTokens.WETH)) {
                    return "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
                  }
                  return getAddress(x);
                });
                const rewardTokenAddress = (CurveExports[key] as LiquidityPool)[pool].rewardToken as string;
                const swapPool = (CurveExports[key] as LiquidityPool)[pool].swap;
                liquidityPoolContract =
                  curveAdapterName == CURVE_DEPOSIT_POOL_ADAPTER_NAME && YEARN_POOL == getAddress(liquidityPool)
                    ? await hre.ethers.getContractAt("ICurveSwap", liquidityPool)
                    : await hre.ethers.getContractAt("ICurveDeposit", liquidityPool);
                lpTokenContract = await hre.ethers.getContractAt("ERC20", lpToken);
                // if swapPool is undefined, it is assumed that liquidityPool is the swap pool.
                swapPoolContract = swapPool
                  ? await hre.ethers.getContractAt("ICurveSwap", swapPool)
                  : await hre.ethers.getContractAt("ICurveSwap", liquidityPool);

                if ((CurveExports[key] as LiquidityPool)[pool].gauge != ADDRESS_ZERO) {
                  gaugeContract = await hre.ethers.getContractAt(
                    "ICurveGauge",
                    <string>(CurveExports[key] as LiquidityPool)[pool].gauge,
                  );
                }
                if (rewardTokenAddress != ADDRESS_ZERO) {
                  rewardTokenInstance = await hre.ethers.getContractAt("ERC20", rewardTokenAddress);
                }
                const LpERC20Instance = await hre.ethers.getContractAt("ERC20", lpToken);
                const adapterAddress = curveAdapters[curveAdapterName].address;
                for (const action of story.setActions) {
                  switch (action.action) {
                    case "setMaxDepositProtocolMode(uint8)": {
                      const { mode } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      const existingMode = await curveAdapters[curveAdapterName].maxDepositProtocolMode();
                      if (existingMode != mode) {
                        mode &&
                          (await expect(curveAdapters[curveAdapterName][action.action](mode))
                            .to.emit(curveAdapters[curveAdapterName], "LogMaxDepositProtocolMode")
                            .withArgs(+mode, ownerAddress));
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await curveAdapters[curveAdapterName].maxDepositPoolPct(
                        liquidityPool,
                      );
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await curveAdapters[curveAdapterName].setMaxDepositPoolPct(liquidityPool, 0);
                      }
                      const { maxDepositProtocolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      const existingProtocolPct: BigNumber = await curveAdapters[
                        curveAdapterName
                      ].maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        await expect(curveAdapters[curveAdapterName][action.action](maxDepositProtocolPct))
                          .to.emit(curveAdapters[curveAdapterName], "LogMaxDepositProtocolPct")
                          .withArgs(maxDepositProtocolPct, ownerAddress);
                      }
                      // Note: The pool value for curve pools will be in USD or BTC
                      const poolValue: BigNumber = await curveAdapters[curveAdapterName].getPoolValue(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from("10000"));
                      limitInUnderlyingToken = limit.div(to_10powNumber_BN(BigNumber.from("18").sub(decimals)));
                      defaultFundAmount = defaultFundAmount.lte(limitInUnderlyingToken)
                        ? defaultFundAmount
                        : limitInUnderlyingToken;
                      break;
                    }
                    case "setMaxDepositPoolPct(address,uint256)": {
                      const { maxDepositPoolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                      const existingPoolPct: BigNumber = await curveAdapters[curveAdapterName].maxDepositPoolPct(
                        liquidityPool,
                      );
                      if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                        await expect(curveAdapters[curveAdapterName][action.action](liquidityPool, maxDepositPoolPct))
                          .to.emit(curveAdapters[curveAdapterName], "LogMaxDepositPoolPct")
                          .withArgs(maxDepositPoolPct, ownerAddress);
                      }
                      // Note: The pool value for curve pools will be in USD or BTC
                      const poolValue: BigNumber = await curveAdapters[curveAdapterName].getPoolValue(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                      limitInUnderlyingToken = limit.div(to_10powNumber_BN(BigNumber.from("18").sub(decimals)));
                      defaultFundAmount = defaultFundAmount.lte(limitInUnderlyingToken)
                        ? defaultFundAmount
                        : limitInUnderlyingToken;
                      break;
                    }
                    case "setMaxDepositAmount(address,address,uint256)": {
                      const { maxDepositAmount }: TEST_DEFI_ADAPTER_ARGUMENTS = <TEST_DEFI_ADAPTER_ARGUMENTS>(
                        action.args
                      );
                      let amount = BigNumber.from("0");
                      const defaultFundAmountInToken: BigNumberish = defaultFundAmount.div(to_10powNumber_BN(decimals));
                      if (maxDepositAmount === ">") {
                        amount = defaultFundAmountInToken.mul(BigNumber.from("10")).mul(to_10powNumber_BN("18"));
                      } else if (maxDepositAmount === "<") {
                        amount = defaultFundAmountInToken.mul(to_10powNumber_BN("18")).div(BigNumber.from("10"));
                      }
                      const existingDepositAmount: BigNumber = await curveAdapters[curveAdapterName].maxDepositAmount(
                        liquidityPool,
                      );
                      if (!existingDepositAmount.eq(amount)) {
                        // Note: for curve amount for maxDepositAmount will be in USD or BTC
                        await expect(
                          curveAdapters[curveAdapterName][action.action](liquidityPool, underlyingTokenAddress, amount),
                        )
                          .to.emit(curveAdapters[curveAdapterName], "LogMaxDepositAmount")
                          .withArgs(amount, ownerAddress);
                      }
                      const updatedDepositAmount: BigNumber = await curveAdapters[curveAdapterName].maxDepositAmount(
                        liquidityPool,
                      );
                      limitInUnderlyingToken = BigNumber.from(updatedDepositAmount).div(
                        to_10powNumber_BN(BigNumber.from("18").sub(decimals)),
                      );
                      defaultFundAmount = defaultFundAmount.lte(limitInUnderlyingToken)
                        ? defaultFundAmount
                        : limitInUnderlyingToken;
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
                    case "fundTestDefiContractWithRewardToken()": {
                      if (!vaultUnderlyingTokens.includes(getAddress(underlyingTokenAddress))) {
                        console.log("skipping as underlying token is not a vault token");
                        this.skip();
                      }
                      if (!(rewardTokenAddress == ADDRESS_ZERO)) {
                        let rewardUnderlyingBalance: BigNumber = await rewardTokenInstance.balanceOf(
                          testDeFiAdapter.address,
                        );
                        if (rewardUnderlyingBalance.lte(BigNumber.from("0"))) {
                          await fundWalletToken(
                            hre,
                            rewardTokenInstance.address,
                            users["owner"],
                            getDefaultFundAmountInDecimal(rewardTokenAddress, "18"),
                            timestamp,
                            testDeFiAdapter.address,
                          );
                          rewardUnderlyingBalance = await rewardTokenInstance.balanceOf(testDeFiAdapter.address);
                          expect(rewardUnderlyingBalance).to.be.gt(BigNumber.from("0"));
                        }
                      }
                      break;
                    }
                    case "testGetDepositAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      lpTokenBalanceBefore = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                    case "testGetDepositSomeCodes(address,address,address,uint256)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      lpTokenBalanceBefore = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
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
                      lpTokenBalanceBefore = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
                      const somelpToken = lpTokenBalanceBefore.mul(BigNumber.from("3")).div(BigNumber.from("4"));
                      await testDeFiAdapter[action.action](
                        underlyingTokenAddress,
                        liquidityPool,
                        adapterAddress,
                        somelpToken,
                      );
                      break;
                    }
                    case "testGetHarvestAllCodes(address,address,address)": {
                      if (!vaultUnderlyingTokens.includes(getAddress(underlyingTokenAddress))) {
                        console.log("skipping as underlying token is not a vault token");
                        this.skip();
                      }
                      if (rewardTokenAddress == ADDRESS_ZERO) {
                        console.log("skipping as the pool does not have reward token");
                        this.skip();
                      }

                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await rewardTokenInstance.balanceOf(testDeFiAdapter.address);
                      const optimalAmount: BigNumber = await harvestCodeProviderContract.getOptimalTokenAmount(
                        rewardTokenAddress,
                        underlyingTokenAddress,
                        rewardTokenBalanceBefore,
                      );
                      if (optimalAmount.eq(BigNumber.from("0"))) {
                        console.log("skipping as swap optimal token amount is zero");
                        this.skip();
                      }
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        curveAdapters[curveAdapterName].address,
                      );
                      break;
                    }
                    case "testGetHarvestSomeCodes(address,address,address,uint256)": {
                      if (!vaultUnderlyingTokens.includes(getAddress(underlyingTokenAddress))) {
                        console.log("Skipping as underlying token is not vault token");
                        this.skip();
                      }
                      if (rewardTokenAddress == ADDRESS_ZERO) {
                        console.log("skipping as the pool does not have reward token");
                        this.skip();
                      }
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      rewardTokenBalanceBefore = await rewardTokenInstance.balanceOf(testDeFiAdapter.address);
                      const testRewardAmount = rewardTokenBalanceBefore
                        .mul(BigNumber.from("3"))
                        .div(BigNumber.from("4"));
                      const optimalAmount: BigNumber = await harvestCodeProviderContract.getOptimalTokenAmount(
                        rewardTokenAddress,
                        underlyingTokenAddress,
                        testRewardAmount,
                      );
                      if (optimalAmount.eq(BigNumber.from("0"))) {
                        console.log("Skipping as optimal amount is zero");
                        this.skip();
                      }
                      await testDeFiAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        curveAdapters[curveAdapterName].address,
                        testRewardAmount,
                      );
                      break;
                    }
                    case "testGetClaimRewardTokenCode(address,address)": {
                      if (gaugeContract) {
                        rewardTokenBalanceBefore = await rewardTokenInstance.balanceOf(testDeFiAdapter.address);
                        await testDeFiAdapter[action.action](liquidityPool, curveAdapters[curveAdapterName].address);
                      }
                      break;
                    }
                    case "testGetStakeAllCodes(address,address,address)": {
                      if (gaugeContract) {
                        gaugeTokenBalanceBefore = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapterAddress);
                      }
                      isTestingStakingFunction = true;
                      break;
                    }
                    case "testGetStakeSomeCodes(address,uint256,address)": {
                      if (gaugeContract) {
                        gaugeTokenBalanceBefore = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        const balanceFromPool = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
                        await testDeFiAdapter[action.action](liquidityPool, balanceFromPool, adapterAddress);
                      }
                      isTestingStakingFunction = true;
                      break;
                    }
                    case "testGetUnstakeAllCodes(address,address)": {
                      if (gaugeContract) {
                        await testDeFiAdapter[action.action](liquidityPool, adapterAddress);
                      }
                      break;
                    }
                    case "testGetUnstakeSomeCodes(address,uint256,address)": {
                      if (gaugeContract) {
                        const stakingBalance = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        await testDeFiAdapter[action.action](liquidityPool, stakingBalance, adapterAddress);
                      }
                      break;
                    }
                    case "testGetUnstakeAndWithdrawAllCodes(address,address,address)": {
                      if (gaugeContract) {
                        underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                        await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapterAddress);
                      }
                      break;
                    }
                    case "testGetUnstakeAndWithdrawSomeCodes(address,address,uint256,address)": {
                      if (gaugeContract) {
                        const stakingBalance = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                        await testDeFiAdapter[action.action](
                          liquidityPool,
                          underlyingTokenAddress,
                          stakingBalance,
                          adapterAddress,
                        );
                      }
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getAllAmountInTokenStake(address,address,address)": {
                      if (gaugeContract) {
                        const actual = await curveAdapters[curveAdapterName][action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                        );
                        const lpTokenStakedBalance: BigNumber = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        let expected: BigNumber;
                        if (lpTokenStakedBalance.gt(BigNumber.from("0"))) {
                          expected = await getAmountInToken(
                            curveAdapterName,
                            liquidityPool,
                            liquidityPoolContract,
                            lpTokenStakedBalance,
                            BigNumber.from(tokenIndexArr[0]),
                          );
                          expect(actual).to.equal(expected);
                        } else {
                          expect(actual).to.equal(BigNumber.from("0"));
                        }
                      }
                      break;
                    }
                    case "isRedeemableAmountSufficientStake(address,address,address,uint256)": {
                      if (gaugeContract) {
                        const lpTokenStakedBalance: BigNumber = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        let amountInToken: BigNumber = BigNumber.from("0");
                        if (lpTokenStakedBalance.gt(BigNumber.from("0"))) {
                          amountInToken = await getAmountInToken(
                            curveAdapterName,
                            liquidityPool,
                            liquidityPoolContract,
                            lpTokenStakedBalance,
                            BigNumber.from(tokenIndexArr[0]),
                          );
                          let actual = await curveAdapters[curveAdapterName][action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            amountInToken,
                          );
                          expect(actual).to.be.true;
                          actual = await curveAdapters[curveAdapterName][action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            amountInToken.mul(BigNumber.from("2")),
                          );
                          expect(actual).to.be.false;
                        } else {
                          const actual = await curveAdapters[curveAdapterName][action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            amountInToken,
                          );
                          expect(actual).to.be.true;
                        }
                      }
                      break;
                    }
                    case "calculateRedeemableLPTokenAmountStake(address,address,address,uint256)": {
                      if (gaugeContract) {
                        const lpTokenStakedBalance: BigNumber = await gaugeContract.balanceOf(testDeFiAdapter.address);
                        let amountInToken: BigNumber = BigNumber.from("0");
                        if (lpTokenStakedBalance.gt(BigNumber.from("0"))) {
                          amountInToken = await getAmountInToken(
                            curveAdapterName,
                            liquidityPool,
                            liquidityPoolContract,
                            lpTokenStakedBalance,
                            BigNumber.from(tokenIndexArr[0]),
                          );

                          const redeemAmount = amountInToken.mul(BigNumber.from("3")).div(BigNumber.from("4"));
                          const calculated = lpTokenStakedBalance
                            .mul(redeemAmount)
                            .div(amountInToken)
                            .add(BigNumber.from("1"));
                          const actual = await curveAdapters[curveAdapterName][action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            redeemAmount,
                          );
                          expect(actual).to.equal(calculated);
                        } else {
                          const actual = await curveAdapters[curveAdapterName][action.action](
                            testDeFiAdapter.address,
                            underlyingTokenAddress,
                            liquidityPool,
                            amountInToken,
                          );
                          expect(actual).to.equal(BigNumber.from("0"));
                        }
                      }
                      break;
                    }
                    case "testGetUnclaimedRewardTokenAmountWrite(address,address,address,address)": {
                      if (gaugeContract) {
                        await testDeFiAdapter[action.action](
                          liquidityPool,
                          underlyingTokenAddress,
                          gaugeContract.address,
                          curveAdapters[curveAdapterName].address,
                        );
                      }
                      break;
                    }
                    case "calculateAmountInLPToken(address,address,uint256)": {
                      await expect(
                        curveAdapters[curveAdapterName][action.action](ADDRESS_ZERO, ADDRESS_ZERO, "0"),
                      ).to.revertedWith("!empty");
                      break;
                    }
                    case "getPoolValue(address,address)": {
                      const _poolValue = await curveAdapters[curveAdapterName][action.action](
                        liquidityPool,
                        ADDRESS_ZERO,
                      );
                      const _virtualPrice = await swapPoolContract.get_virtual_price();
                      const _totalSupply = await LpERC20Instance.totalSupply();
                      const expectedPoolValue = BigNumber.from(_virtualPrice)
                        .mul(BigNumber.from(_totalSupply))
                        .div(to_10powNumber_BN("18"));
                      expect(_poolValue).to.be.eq(expectedPoolValue);
                      break;
                    }
                    case "getLiquidityPoolToken(address,address)": {
                      const _liquidityPool = await curveAdapters[curveAdapterName][action.action](
                        ADDRESS_ZERO,
                        liquidityPool,
                      );
                      expect(getAddress(_liquidityPool)).to.be.eq(getAddress(lpToken));
                      break;
                    }
                    case "getSomeAmountInToken(address,address,uint256)": {
                      const lpTokenBalanceOfTestDeFiAdapter: BigNumber = await lpTokenContract.balanceOf(
                        testDeFiAdapter.address,
                      );
                      const _amountInUnderlyingToken: BigNumber = await curveAdapters[curveAdapterName][action.action](
                        _underlyingTokens[0],
                        liquidityPool,
                        lpTokenBalanceOfTestDeFiAdapter,
                      );
                      if (lpTokenBalanceOfTestDeFiAdapter.gt(BigNumber.from("0"))) {
                        const expectedAmountInUnderlyingToken: BigNumber = await getAmountInToken(
                          curveAdapterName,
                          liquidityPool,
                          liquidityPoolContract,
                          lpTokenBalanceOfTestDeFiAdapter,
                          BigNumber.from(tokenIndexArr[0]),
                        );
                        expect(_amountInUnderlyingToken).to.be.eq(expectedAmountInUnderlyingToken);
                      } else {
                        expect(_amountInUnderlyingToken).to.be.eq(BigNumber.from("0"));
                      }
                      break;
                    }
                    case "getUnderlyingTokens(address,address)": {
                      const _underlyingAddressFromAdapter = await curveAdapters[curveAdapterName][action.action](
                        liquidityPool,
                        ADDRESS_ZERO,
                      );
                      const _checkSumedUnderlyingAddressFromAdapter = _underlyingAddressFromAdapter.map((x: string) =>
                        getAddress(x),
                      );
                      expect(_checkSumedUnderlyingAddressFromAdapter).to.include.members(checksumedUnderlyingTokens);
                      break;
                    }
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      const { expectedValue }: ACTION_TYPES = <ACTION_TYPES>action;
                      const expectedLpBalanceFromPool = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalanceAfter = await curveAdapters[curveAdapterName][action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      if (!gaugeContract && isTestingStakingFunction) {
                        expect(lpTokenBalanceAfter).to.be.eq(expectedLpBalanceFromPool);
                      } else {
                        const existingMode = await curveAdapters[curveAdapterName].maxDepositProtocolMode();
                        if (existingMode == 0) {
                          const existingDepositAmount: BigNumber = await curveAdapters[
                            curveAdapterName
                          ].maxDepositAmount(liquidityPool);
                          if (existingDepositAmount.eq(BigNumber.from("0"))) {
                            expect(lpTokenBalanceAfter).to.be.eq(BigNumber.from("0"));
                          } else {
                            expect(lpTokenBalanceAfter).to.be.gt(lpTokenBalanceBefore);
                          }
                        } else {
                          const existingPoolPct: BigNumber = await curveAdapters[curveAdapterName].maxDepositPoolPct(
                            liquidityPool,
                          );
                          const existingProtocolPct: BigNumber = await curveAdapters[
                            curveAdapterName
                          ].maxDepositProtocolPct();
                          if (existingPoolPct.eq(BigNumber.from("0")) && existingProtocolPct.eq(BigNumber.from("0"))) {
                            expect(lpTokenBalanceAfter).to.be.eq(BigNumber.from("0"));
                          } else if (
                            !existingPoolPct.eq(BigNumber.from("0")) ||
                            !existingProtocolPct.eq(BigNumber.from("0"))
                          ) {
                            expectedValue == "=0"
                              ? expect(lpTokenBalanceAfter).to.be.eq(BigNumber.from("0"))
                              : expectedValue == "<"
                              ? expect(lpTokenBalanceAfter).to.be.lte(lpTokenBalanceBefore)
                              : expect(lpTokenBalanceAfter).to.be.gt(BigNumber.from("0"));
                          }
                        }
                      }
                      break;
                    }
                    case "balanceOf(address)": {
                      const { expectedValue }: ACTION_TYPES = <ACTION_TYPES>action;
                      const underlyingBalanceAfter: BigNumber = await testDeFiAdapter.underlyingTokenBalance();
                      if (!gaugeContract && isTestingStakingFunction) {
                        expect(underlyingBalanceAfter).to.be.lte(underlyingBalanceBefore);
                      } else {
                        if (underlyingBalanceBefore.lt(limitInUnderlyingToken)) {
                          const delta = BigNumber.from("9").mul(to_10powNumber_BN(decimals - Math.floor(decimals / 6)));
                          POOLED_TOKENS.includes(underlyingTokenAddress)
                            ? expectedValue == ">"
                              ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                              : expect(underlyingBalanceAfter).to.be.closeTo(BigNumber.from("0"), delta.toNumber())
                            : expectedValue == ">"
                            ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                            : expect(underlyingBalanceAfter).to.be.eq(BigNumber.from("0"));
                        } else {
                          POOLED_TOKENS.includes(underlyingTokenAddress)
                            ? expectedValue == ">"
                              ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                              : // 9999999999999 is the delta for aToken like pools
                                expect(underlyingBalanceAfter).to.be.lte(
                                  underlyingBalanceBefore.sub(limitInUnderlyingToken).add("9999999999999"),
                                )
                            : expectedValue == ">"
                            ? expect(underlyingBalanceAfter).to.be.gt(underlyingBalanceBefore)
                            : expect(underlyingBalanceAfter).to.be.lte(
                                underlyingBalanceBefore.sub(limitInUnderlyingToken),
                              );
                        }
                      }
                      break;
                    }
                    case "getRewardTokenBalance(address)": {
                      // dai+usdc+usdt+rsv provides RSR rewards
                      // TODO curve adapters should handle mutiple rewards in future
                      if (
                        gaugeContract &&
                        gaugeContract.address !== getAddress("0x4dC4A289a8E33600D8bD4cf5F6313E43a37adec7")
                      ) {
                        const rewardTokenBalance: BigNumber = await rewardTokenInstance.balanceOf(
                          testDeFiAdapter.address,
                        );
                        const { expectedValue }: ACTION_TYPES = <ACTION_TYPES>action;
                        expectedValue == ">"
                          ? expect(rewardTokenBalance).to.gt(rewardTokenBalanceBefore)
                          : expectedValue == "<"
                          ? expect(rewardTokenBalance).to.lt(rewardTokenBalanceBefore)
                          : expect(rewardTokenBalance).to.be.eq(0);
                      }
                      break;
                    }
                    case "getLiquidityPoolTokenBalanceStake(address,address)": {
                      const { expectedValue }: ACTION_TYPES = <ACTION_TYPES>action;
                      if (gaugeContract) {
                        const expectedStakingBalanceFromPool: BigNumber = await gaugeContract.balanceOf(
                          testDeFiAdapter.address,
                        );
                        const stakingTokenBalanceAfter: BigNumber = await curveAdapters[curveAdapterName][
                          action.action
                        ](testDeFiAdapter.address, liquidityPool);

                        expect(stakingTokenBalanceAfter).to.be.eq(expectedStakingBalanceFromPool);

                        expectedValue == ">"
                          ? expect(stakingTokenBalanceAfter).to.be.gt(gaugeTokenBalanceBefore)
                          : expectedValue == "=0"
                          ? expect(stakingTokenBalanceAfter).to.be.eq(BigNumber.from("0"))
                          : expect(stakingTokenBalanceAfter).to.be.lte(gaugeTokenBalanceBefore);
                      } else {
                        await expect(
                          curveAdapters[curveAdapterName][action.action](testDeFiAdapter.address, liquidityPool),
                        ).to.be.revertedWith("function call to a non-contract account");
                      }
                      break;
                    }
                    case "getAllAmountInToken(address,address,address)": {
                      const _amountInUnderlyingToken = await curveAdapters[curveAdapterName][action.action](
                        testDeFiAdapter.address,
                        _underlyingTokens[0],
                        liquidityPool,
                      );
                      const lpTokenBalanceOfTestDeFiAdapter: BigNumber = await lpTokenContract.balanceOf(
                        testDeFiAdapter.address,
                      );
                      if (lpTokenBalanceOfTestDeFiAdapter.gt(BigNumber.from("0"))) {
                        const expectedAmountInUnderlyingToken: BigNumber = await getAmountInToken(
                          curveAdapterName,
                          liquidityPool,
                          liquidityPoolContract,
                          lpTokenBalanceOfTestDeFiAdapter,
                          BigNumber.from(tokenIndexArr[0]),
                        );
                        expect(_amountInUnderlyingToken).to.be.eq(expectedAmountInUnderlyingToken);
                      } else {
                        expect(_amountInUnderlyingToken).to.be.eq(BigNumber.from("0"));
                      }
                      break;
                    }
                    case "isRedeemableAmountSufficient(address,address,address,uint256)": {
                      const { expectedValue }: ACTION_TYPES = <ACTION_TYPES>action;
                      const lpTokenBalanceOfTestDeFiAdapter: BigNumber = await lpTokenContract.balanceOf(
                        testDeFiAdapter.address,
                      );
                      const _amountInUnderlyingToken: BigNumber = await getAmountInToken(
                        curveAdapterName,
                        liquidityPool,
                        liquidityPoolContract,
                        lpTokenBalanceOfTestDeFiAdapter,
                        BigNumber.from(tokenIndexArr[0]),
                      );
                      if (expectedValue == ">") {
                        const _isRedeemableAmountSufficient = await curveAdapters[curveAdapterName][action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          _amountInUnderlyingToken.add(BigNumber.from(10)),
                        );
                        expect(_isRedeemableAmountSufficient).to.be.eq(false);
                      } else if (expectedValue == "<") {
                        const _isRedeemableAmountSufficient = await curveAdapters[curveAdapterName][action.action](
                          testDeFiAdapter.address,
                          underlyingTokenAddress,
                          liquidityPool,
                          _amountInUnderlyingToken.gt(BigNumber.from("0"))
                            ? _amountInUnderlyingToken.sub(BigNumber.from(10))
                            : BigNumber.from(0),
                        );
                        expect(_isRedeemableAmountSufficient).to.be.eq(true);
                      }
                      break;
                    }
                    case "calculateRedeemableLPTokenAmount(address,address,address,uint256)": {
                      const _lpTokenBalance: BigNumber = await lpTokenContract.balanceOf(testDeFiAdapter.address);
                      const amountInUnderlyingToken: BigNumber = await getAmountInToken(
                        curveAdapterName,
                        liquidityPool,
                        liquidityPoolContract,
                        _lpTokenBalance,
                        BigNumber.from(tokenIndexArr[0]),
                      );
                      const _testRedeemAmount = amountInUnderlyingToken
                        .mul(BigNumber.from("3"))
                        .div(BigNumber.from("4"));
                      const _redeemableLpTokenAmt = await curveAdapters[curveAdapterName][action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                        _testRedeemAmount,
                      );
                      const expectedRedeemableLpTokenAmt = _lpTokenBalance
                        .mul(_testRedeemAmount)
                        .div(amountInUnderlyingToken)
                        .add(BigNumber.from("1"));
                      // Curve's lp tokens has 18 decimals, so using 15 decimals for delta
                      const delta = BigNumber.from("9").mul(to_10powNumber_BN(15));
                      expect(_redeemableLpTokenAmt).to.be.closeTo(expectedRedeemableLpTokenAmt, delta.toNumber());
                      break;
                    }
                    case "testGetAllAmountInTokenStakeWrite(address,address,address)": {
                      if (gaugeContract) {
                        if (!vaultUnderlyingTokens.includes(getAddress(underlyingTokenAddress))) {
                          console.log("Skipping as underlying token is not vault token");
                          this.skip();
                        }
                        if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WETH)) {
                          const pairWeth = await uniswapV2FactoryInstance.getPair(
                            rewardTokenAddress,
                            underlyingTokenAddress,
                          );
                          if (getAddress(pairWeth) == ADDRESS_ZERO) {
                            console.log("skipping as pair is not available with weth on uniswapV2");
                            this.skip();
                          }
                        }
                        const pairAddress1 = await uniswapV2FactoryInstance.getPair(
                          rewardTokenAddress,
                          TypedTokens.WETH,
                        );
                        const pairAddress2 = await uniswapV2FactoryInstance.getPair(
                          TypedTokens.WETH,
                          underlyingTokenAddress,
                        );
                        if (
                          getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WETH) &&
                          getAddress(pairAddress1) !== ADDRESS_ZERO
                        ) {
                          await testDeFiAdapter.testGetAllAmountInTokenStakeWrite(
                            underlyingTokenAddress,
                            liquidityPool,
                            gaugeContract.address,
                            rewardTokenAddress,
                            harvestCodeProviderContract.address,
                            tokenIndexArr[0],
                            curveAdapters[curveAdapterName].address,
                          );
                        } else {
                          if (getAddress(pairAddress1) == ADDRESS_ZERO || getAddress(pairAddress2) == ADDRESS_ZERO) {
                            console.log("skipping as required path is not available on uniswapV2");
                            this.skip();
                          } else {
                            await testDeFiAdapter.testGetAllAmountInTokenStakeWrite(
                              underlyingTokenAddress,
                              liquidityPool,
                              gaugeContract.address,
                              rewardTokenAddress,
                              harvestCodeProviderContract.address,
                              tokenIndexArr[0],
                              curveAdapters[curveAdapterName].address,
                            );
                          }
                        }
                      }
                      break;
                    }
                    case "testIsRedeemableAmountSufficientStakeWrite(address,address,address,address,address,int128,address)": {
                      if (gaugeContract) {
                        if (!vaultUnderlyingTokens.includes(getAddress(underlyingTokenAddress))) {
                          console.log("skipping as underlying token is not a vault token");
                          this.skip();
                        }
                        if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WETH)) {
                          const pairWeth = await uniswapV2FactoryInstance.getPair(
                            rewardTokenAddress,
                            underlyingTokenAddress,
                          );
                          if (getAddress(pairWeth) == ADDRESS_ZERO) {
                            console.log("skipping as pair is not available with weth on uniswapV2");
                            this.skip();
                          }
                        }
                        const pairAddress1 = await uniswapV2FactoryInstance.getPair(
                          rewardTokenAddress,
                          TypedTokens.WETH,
                        );
                        const pairAddress2 = await uniswapV2FactoryInstance.getPair(
                          TypedTokens.WETH,
                          underlyingTokenAddress,
                        );

                        if (getAddress(pairAddress1) == ADDRESS_ZERO || getAddress(pairAddress2) == ADDRESS_ZERO) {
                          console.log("skipping as required path is not available on uniswapV2");
                          this.skip();
                        }
                        await testDeFiAdapter.testIsRedeemableAmountSufficientStakeWrite(
                          underlyingTokenAddress,
                          liquidityPool,
                          gaugeContract.address,
                          rewardTokenAddress,
                          harvestCodeProviderContract.address,
                          tokenIndexArr[0],
                          curveAdapters[curveAdapterName].address,
                        );
                      }
                      break;
                    }
                    case "testCalculateRedeemableLPTokenAmountStakeWrite(address,address,address,address,address,int128,address)": {
                      if (gaugeContract) {
                        if (!vaultUnderlyingTokens.includes(getAddress(underlyingTokenAddress))) {
                          console.log("skipping as underlying token is not a vault token");
                          this.skip();
                        }
                        if (getAddress(underlyingTokenAddress) == getAddress(TypedTokens.WETH)) {
                          const pairWeth = await uniswapV2FactoryInstance.getPair(
                            rewardTokenAddress,
                            underlyingTokenAddress,
                          );
                          if (getAddress(pairWeth) == ADDRESS_ZERO) {
                            console.log("skipping as pair is not available with weth on uniswapV2");
                            this.skip();
                          }
                        }
                        const pairAddress1 = await uniswapV2FactoryInstance.getPair(
                          rewardTokenAddress,
                          TypedTokens.WETH,
                        );
                        const pairAddress2 = await uniswapV2FactoryInstance.getPair(
                          TypedTokens.WETH,
                          underlyingTokenAddress,
                        );

                        if (getAddress(pairAddress1) == ADDRESS_ZERO || getAddress(pairAddress2) == ADDRESS_ZERO) {
                          console.log("skipping as required is not available on uniswapV2");
                          this.skip();
                        }
                        await testDeFiAdapter.testCalculateRedeemableLPTokenAmountStakeWrite(
                          underlyingTokenAddress,
                          liquidityPool,
                          gaugeContract.address,
                          rewardTokenAddress,
                          harvestCodeProviderContract.address,
                          tokenIndexArr[0],
                          curveAdapters[curveAdapterName].address,
                        );
                      }
                      break;
                    }
                    case "canStake(address)": {
                      if (gaugeContract) {
                        expect(await curveAdapters[curveAdapterName][action.action](liquidityPool)).to.be.true;
                      } else {
                        expect(await curveAdapters[curveAdapterName][action.action](liquidityPool)).to.be.false;
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
                    case "testGetUnstakeAllCodes(address,address)": {
                      if (gaugeContract) {
                        await testDeFiAdapter[action.action](liquidityPool, adapterAddress);
                      }
                      break;
                    }
                  }
                }
              });
            }
          }
        }
      });
    }
    async function getAmountInToken(
      curveAdapterName: string,
      liquidityPool: string,
      liquidityPoolContract: Contract,
      lpTokenBalanceOfTestDeFiAdapter: BigNumber,
      tokenIndex: BigNumber,
    ): Promise<BigNumber> {
      return curveAdapterName == CURVE_DEPOSIT_POOL_ADAPTER_NAME && YEARN_POOL == getAddress(liquidityPool)
        ? await liquidityPoolContract["calc_withdraw_one_coin"](lpTokenBalanceOfTestDeFiAdapter, tokenIndex, true)
        : await liquidityPoolContract["calc_withdraw_one_coin"](lpTokenBalanceOfTestDeFiAdapter, tokenIndex);
    }
  });
});
