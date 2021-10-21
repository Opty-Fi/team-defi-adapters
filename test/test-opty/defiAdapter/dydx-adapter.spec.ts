import chai, { expect, assert } from "chai";
import { solidity } from "ethereum-waffle";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, ADDRESS_ZERO, DYDX_ADAPTER_NAME } from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedDefiPools } from "../../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites, deployAdapters } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import testDeFiAdapterScenario from "../scenarios/test-defi-adapter.json";
import scenarios from "../scenarios/adapters.json";
import { deployContract } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";

chai.use(solidity);

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

interface TEST_DEFI_ADAPTER_ARGUMENTS {
  maxDepositProtocolPct?: string | null;
  maxDepositPoolPct?: string | null;
  maxDepositAmount?: string | null;
  mode?: string | null;
}

describe(`${DYDX_ADAPTER_NAME} Unit test`, () => {
  const strategies = TypedAdapterStrategies[DYDX_ADAPTER_NAME];
  const MAX_AMOUNT = BigNumber.from("20000000000000000000");
  let adapterPrerequisites: CONTRACTS;
  let adapter: Contract;
  let ownerAddress: string;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Essential contracts not deployed");
      adapter = await deployAdapter(
        hre,
        owner,
        DYDX_ADAPTER_NAME,
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
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          await fundWalletToken(hre, token, owner, MAX_AMOUNT, timestamp);
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
                    codes = await adapter[action.action](
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
                    codes = await adapter[action.action](
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

describe(`${testDeFiAdapterScenario.title} - DyDxAdapter`, () => {
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

  for (const adapterName of adapterNames) {
    // TODO: In future it can be leverage across all the adapters
    if (adapterName == "DyDxAdapter") {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
        if (TypedDefiPools[adapterName][pool].tokens.length == 1) {
          for (const story of testDeFiAdapterScenario.stories) {
            it(`${pool} - ${story.description}`, async () => {
              let defaultFundAmount: BigNumber = BigNumber.from("2");
              let limit: BigNumber = hre.ethers.BigNumber.from(0);
              const timestamp = (await getBlockTimestamp(hre)) * 2;
              const liquidityPool = TypedDefiPools[adapterName][pool].pool;
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const decimals = await ERC20Instance.decimals();
              const adapterAddress = adapters[adapterName].address;
              let underlyingBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              for (const action of story.setActions) {
                switch (action.action) {
                  case "setMaxDepositProtocolMode(uint8)": {
                    const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
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
                    const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                    if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                      await adapters[adapterName][action.action](maxDepositProtocolPct);
                    }
                    const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    break;
                  }
                  case "setMaxDepositPoolPct(address,uint256)": {
                    const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                    if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                      await adapters[adapterName][action.action](liquidityPool, maxDepositPoolPct);
                    }
                    const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    break;
                  }
                  case "setMaxDepositAmount(address,address,uint256)": {
                    const { maxDepositAmount }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args;
                    const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    if (
                      !existingDepositAmount.eq(
                        BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(decimals))),
                      )
                    ) {
                      await adapters[adapterName][action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(decimals))),
                      );
                    }
                    limit = await adapters[adapterName].maxDepositAmount(liquidityPool, underlyingTokenAddress);
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
                    const poolValue = await adapters[adapterName]["getPoolValue(address,address)"](
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    const existingMode = await adapters[adapterName].maxDepositProtocolMode();
                    if (existingMode == 0) {
                      const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (existingDepositAmount.eq(0)) {
                        expect(lpTokenBalance).to.be.eq(0);
                      } else {
                        expect(lpTokenBalance).to.be.gt(0);
                      }
                    } else {
                      const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                      const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                      if ((existingPoolPct.eq(0) && existingProtocolPct.eq(0)) || poolValue.eq(0)) {
                        expect(lpTokenBalance).to.be.eq(0);
                      } else {
                        expect(lpTokenBalance).to.be.gt(0);
                      }
                    }
                    break;
                  }
                  case "balanceOf(address)": {
                    const underlyingBalanceAfter: BigNumber = await ERC20Instance[action.action](
                      testDeFiAdapter.address,
                    );
                    if (underlyingBalanceBefore.lt(limit)) {
                      expect(underlyingBalanceAfter).to.be.eq(0);
                    } else {
                      expect(underlyingBalanceAfter).to.be.eq(underlyingBalanceBefore.sub(limit));
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
