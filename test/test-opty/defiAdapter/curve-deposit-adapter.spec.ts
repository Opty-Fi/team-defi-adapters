import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils, ethers } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, ZERO_ADDRESS } from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedBtcTokens, TypedDefiPools, TypedTokens } from "../../../helpers/data";
import {
  deployAdapter,
  deployEssentialContracts,
  deployAdapterPrerequisites,
  deployAdapters,
} from "../../../helpers/contracts-deployments";
import { approveTokens, fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";
import testDeFiAdapterScenario from "../scenarios/test-defi-adapter.json";
import { deployContract } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

interface TEST_DEFI_ADAPTER_ARGUMENTS {
  maxDepositProtocolPct?: string | null;
  maxDepositPoolPct?: string | null;
  maxDepositAmount?: string | null;
  mode?: string | null;
}

describe("CurveDepositPoolAdapter", () => {
  const ADAPTER_NAME = "CurveDepositPoolAdapter";
  const strategies = TypedAdapterStrategies[ADAPTER_NAME];
  const MAX_AMOUNT: { [key: string]: BigNumber } = {
    DAI: BigNumber.from("1000000000000000000000"),
    USDC: BigNumber.from("1000000000"),
  };
  let essentialContracts: CONTRACTS;
  let adapter: Contract;
  let ownerAddress: string;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      ownerAddress = await owner.getAddress();
      essentialContracts = await deployEssentialContracts(hre, owner, TESTING_DEPLOYMENT_ONCE);
      await approveTokens(owner, essentialContracts["registry"]);
      adapter = await deployAdapter(
        hre,
        owner,
        ADAPTER_NAME,
        essentialContracts["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      assert.isDefined(essentialContracts, "Essential contracts not deployed");
      assert.isDefined(adapter, "Adapter not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < strategies.length; i++) {
    describe(`${strategies[i].strategyName}`, async () => {
      const strategy = strategies[i];
      let lpToken: string;
      let nCoins: string[];
      const depositAmount: string[] = [];
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          nCoins = await adapter.getUnderlyingTokens(strategy.strategy[0].contract, ZERO_ADDRESS);
          for (let i = 0; i < nCoins.length; i++) {
            if (nCoins[i] === TOKENS["DAI"]) {
              await fundWalletToken(hre, nCoins[i], owner, MAX_AMOUNT["DAI"], timestamp);
              depositAmount.push(MAX_AMOUNT["DAI"].div(BigNumber.from("2")).toString());
            } else if (nCoins[i] === TOKENS["USDC"]) {
              await fundWalletToken(hre, nCoins[i], owner, MAX_AMOUNT["USDC"], timestamp);
              depositAmount.push(MAX_AMOUNT["USDC"].div(BigNumber.from("2")).toString());
            } else {
              depositAmount.push("0");
            }
          }
          lpToken = await adapter.getLiquidityPoolToken(ZERO_ADDRESS, strategy.strategy[0].contract);
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
                if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await adapter[action.action](
                      ZERO_ADDRESS,
                      [nCoins[0]], // DAI
                      strategy.strategy[0].contract,
                      depositAmount,
                    );
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, [nCoins[0]], strategy.strategy[0].contract);
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
                          if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
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
                  if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                    expect(value[0].length).to.equal(depositAmount.length);
                    expect(value[0][0]).to.equal(depositAmount[0]);
                  }
                  expect(value[1]).to.equal(0);
                }

                break;
              }
              case "getWithdrawAllCodes(address,address[],address)":
              case "getWithdrawSomeCodes(address,address[],address,uint256)": {
                let codes;
                const withdrawalAmount = BigNumber.from("1000000000");
                if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await adapter[action.action](
                      ZERO_ADDRESS,
                      nCoins,
                      strategy.strategy[0].contract,
                      withdrawalAmount,
                    );
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, nCoins, strategy.strategy[0].contract);
                }
                for (let i = 0; i < codes.length; i++) {
                  if (i < 2) {
                    const inter = new utils.Interface(["function approve(address,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(lpToken);
                    const value = inter.decodeFunctionData("approve", abiCode);
                    expect(value[0]).to.equal(strategy.strategy[0].contract);
                    if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                      expect(value[1]).to.equal(i == 0 ? 0 : withdrawalAmount);
                    }
                  } else {
                    const inter = new utils.Interface([`function remove_liquidity(uint256,uint256[${nCoins.length}])`]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(strategy.strategy[0].contract);
                    const value = inter.decodeFunctionData("remove_liquidity", abiCode);
                    if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
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
});

describe(`${testDeFiAdapterScenario.title} - CurveDepositPoolAdapter`, () => {
  let adapterPrerequisites: CONTRACTS;
  let users: { [key: string]: Signer };
  const adapterNames = Object.keys(TypedDefiPools);
  let testDeFiAdapter: Contract;
  let adapters: CONTRACTS;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, true);
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    adapters = await deployAdapters(hre, owner, adapterPrerequisites.registry.address, true);
  });

  const ValidatedBtcTokens = Object.values(TypedBtcTokens).map(t => getAddress(t));
  for (const adapterName of adapterNames) {
    // TODO: In future it can be leverage across all the adapters
    if (adapterName == "CurveDepositPoolAdapter") {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
        // TODO: Get USDK,LINKUSD,SBTC from DEX
        if (
          TypedDefiPools[adapterName][pool].tokens.length == 1 &&
          getAddress(underlyingTokenAddress) != getAddress(TypedTokens.USDK) &&
          getAddress(underlyingTokenAddress) != getAddress(TypedTokens.LINKUSD) &&
          getAddress(underlyingTokenAddress) != getAddress(TypedTokens.SBTC)
        ) {
          for (const story of testDeFiAdapterScenario.stories) {
            it(`${pool} - ${story.description}`, async () => {
              let defaultFundAmount: BigNumber = ValidatedBtcTokens.includes(underlyingTokenAddress)
                ? BigNumber.from("2")
                : BigNumber.from("20000");
              defaultFundAmount =
                underlyingTokenAddress == getAddress(TypedTokens.DUSD) ||
                underlyingTokenAddress == getAddress(TypedTokens.HUSD) ||
                underlyingTokenAddress == getAddress(TypedTokens.MUSD)
                  ? BigNumber.from("2000")
                  : defaultFundAmount;
              let limit: BigNumber;
              const timestamp = (await getBlockTimestamp(hre)) * 2;
              const liquidityPool = TypedDefiPools[adapterName][pool].pool;
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const decimals = await ERC20Instance.decimals();
              const adapterAddress = adapters[adapterName].address;
              let underlyingBalanceBefore: BigNumber = ethers.BigNumber.from(0);
              let limitInUnderlyingToken: BigNumber = ethers.BigNumber.from(0);
              for (const action of story.setActions) {
                switch (action.action) {
                  case "setMaxDepositPoolType(uint8)": {
                    const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingMode = await adapters[adapterName].maxExposureType();
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
                    const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                    if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                      await adapters[adapterName][action.action](maxDepositProtocolPct);
                    }
                    // Note: The pool value for curve pools will be in USD or BTC
                    const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                    limitInUnderlyingToken = limit.div(BigNumber.from(10).pow(BigNumber.from(18).sub(decimals)));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limitInUnderlyingToken)
                      ? defaultFundAmount
                      : limitInUnderlyingToken;
                    break;
                  }
                  case "setMaxDepositPoolPct(address,uint256)": {
                    const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                    if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                      await adapters[adapterName][action.action](liquidityPool, maxDepositPoolPct);
                    }
                    // Note: The pool value for curve pools will be in USD or BTC
                    const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                    limitInUnderlyingToken = limit.div(BigNumber.from(10).pow(BigNumber.from(18).sub(decimals)));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limitInUnderlyingToken)
                      ? defaultFundAmount
                      : limitInUnderlyingToken;
                    break;
                  }
                  case "setMaxDepositAmount(address,uint256)": {
                    // Note: for curve maxDepositAmount will be in USD or BTC
                    const { maxDepositAmount }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                      liquidityPool,
                    );
                    if (
                      !existingDepositAmount.eq(
                        BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(18))),
                      )
                    ) {
                      await adapters[adapterName][action.action](
                        liquidityPool,
                        BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(18))),
                      );
                    }
                    const updatedDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(liquidityPool);
                    limitInUnderlyingToken = BigNumber.from(updatedDepositAmount).div(
                      BigNumber.from(10).pow(BigNumber.from(18).sub(decimals)),
                    );
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
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
                  case "testGetDepositAllCodes(address,address,address)": {
                    underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
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
                    const existingMode = await adapters[adapterName].maxExposureType();
                    if (existingMode == 0) {
                      const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                        liquidityPool,
                      );
                      if (existingDepositAmount.eq(0)) {
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
                        expect(lpTokenBalance).to.be.gt(0);
                      }
                    }
                    break;
                  }
                  case "balanceOf(address)": {
                    const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](
                      testDeFiAdapter.address,
                    );
                    if (underlyingBalanceBefore.lt(limitInUnderlyingToken)) {
                      expect(underlyingBalanceAfter).to.be.eq(0);
                    } else {
                      expect(underlyingBalanceAfter.div(BigNumber.from(10).pow(BigNumber.from(decimals)))).to.be.eq(
                        underlyingBalanceBefore
                          .sub(limitInUnderlyingToken)
                          .div(BigNumber.from(10).pow(BigNumber.from(decimals))),
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
