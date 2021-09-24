import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, utils, BigNumber } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, ADDRESS_ZERO, SUSHISWAP_ADAPTER_NAME } from "../../../helpers/constants";
import { TypedAdapterStrategies, TypedTokens, TypedCurveTokens, TypedDefiPools } from "../../../helpers/data";
import { deployAdapter, deployAdapterPrerequisites } from "../../../helpers/contracts-deployments";
import { deployContract } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";
import testDeFiAdapterScenario from "../scenarios/sushiswap-test-defi-adapter.json";

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

interface TEST_DEFI_ADAPTER_ARGUMENTS {
  maxDepositProtocolPct?: string | null;
  maxDepositPoolPct?: string | null;
  maxDepositAmount?: string | null;
  mode?: string | null;
}

describe(`${SUSHISWAP_ADAPTER_NAME} Unit test`, () => {
  const strategies = TypedAdapterStrategies[SUSHISWAP_ADAPTER_NAME];
  let adapterPrerequisites: CONTRACTS;
  let adapter: Contract;
  let ownerAddress: string;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      ownerAddress = await owner.getAddress();
      adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, TESTING_DEPLOYMENT_ONCE);
      assert.isDefined(adapterPrerequisites, "Adapter pre-requisites contracts not deployed");
      adapter = await deployAdapter(
        hre,
        owner,
        SUSHISWAP_ADAPTER_NAME,
        adapterPrerequisites["registry"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      await adapter.setUnderlyingTokenToMasterChefToPid(
        TOKENS[strategies[0].token],
        "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd",
        1,
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
      const masterChef = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";
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
                    codes = await adapter[action.action](ownerAddress, token, masterChef, amount[strategy.token]);
                    depositAmount = amount[strategy.token];
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, token, masterChef);
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
                    const inter = new utils.Interface(["function deposit(uint256,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(masterChef);
                    const value = inter.decodeFunctionData("deposit", abiCode);
                    if (action.action === "getDepositSomeCodes(address,address,address,uint256)") {
                      expect(value[0]).to.equal(1);
                      expect(value[1]).to.equal(depositAmount);
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
                    codes = await adapter[action.action](ownerAddress, token, masterChef, amount[strategy.token]);
                    withdrawAmount = amount[strategy.token];
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, token, masterChef);
                }

                for (let i = 0; i < codes.length; i++) {
                  const inter = new utils.Interface(["function withdraw(uint256,uint256)"]);
                  const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                  expect(address).to.be.equal(masterChef);
                  const value = inter.decodeFunctionData("withdraw", abiCode);
                  if (action.action === "getWithdrawSomeCodes(address,address,address,uint256)") {
                    expect(value[0]).to.equal(1);
                    expect(value[1]).to.equal(withdrawAmount);
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

describe(`${testDeFiAdapterScenario.title} - ${SUSHISWAP_ADAPTER_NAME}`, () => {
  let adapterPrerequisites: CONTRACTS;
  let users: { [key: string]: Signer };
  const adapterNames = Object.keys(TypedDefiPools);
  let testDeFiAdapter: Contract;
  let sushiswapAdapter: Contract;
  let masterChefInstance: Contract;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, true);
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    sushiswapAdapter = await deployAdapter(
      hre,
      owner,
      SUSHISWAP_ADAPTER_NAME,
      adapterPrerequisites.registry.address,
      true,
    );
    masterChefInstance = await hre.ethers.getContractAt(
      "ISushiswapMasterChef",
      "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd",
    );
  });

  const ValidatedPairTokens = Object.values(TypedTokens)
    .map(({ address }) => address)
    .map(t => getAddress(t));
  const ValidatedCurveTokens = Object.values(TypedCurveTokens)
    .map(({ address }) => address)
    .map(t => getAddress(t));
  for (const adapterName of adapterNames) {
    // TODO: In future it can be leverage across all the adapters
    if (adapterName == SUSHISWAP_ADAPTER_NAME) {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
        const pid = TypedDefiPools[adapterName][pool].pid;
        let alreadySet: boolean = false;
        if (TypedDefiPools[adapterName][pool].tokens.length == 1) {
          for (const story of testDeFiAdapterScenario.stories) {
            it(`${pool} - ${story.description}`, async () => {
              if (alreadySet === false) {
                await sushiswapAdapter.setUnderlyingTokenToMasterChefToPid(
                  underlyingTokenAddress,
                  masterChefInstance.address,
                  pid,
                );
                alreadySet = true;
              }
              let defaultFundAmount: BigNumber = BigNumber.from("2");
              let limit: BigNumber = hre.ethers.BigNumber.from(0);
              const timestamp = (await getBlockTimestamp(hre)) * 2;
              const liquidityPool = TypedDefiPools[adapterName][pool].pool;
              const pairInstance = await hre.ethers.getContractAt("IUniswapV2Pair", underlyingTokenAddress);
              const token0Address = await pairInstance.token0();
              const token1Address = await pairInstance.token1();
              const token0Instance = await hre.ethers.getContractAt("ERC20", token0Address);
              const token1Instance = await hre.ethers.getContractAt("ERC20", token1Address);
              const rewardTokenAddress = await sushiswapAdapter.getRewardToken(liquidityPool);
              let rewardTokenERC20Instance: Contract;
              if (rewardTokenAddress !== ADDRESS_ZERO) {
                rewardTokenERC20Instance = await hre.ethers.getContractAt("ERC20", rewardTokenAddress);
              }
              const rewardTokenDecimals = await rewardTokenERC20Instance!.decimals();
              const decimals = await pairInstance.decimals();
              const adapterAddress = sushiswapAdapter.address;
              let underlyingBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              let token0BalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              let token1BalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              let rewardTokenBalanceBefore: BigNumber = hre.ethers.BigNumber.from(0);
              for (const action of story.setActions) {
                switch (action.action) {
                  case "setMaxDepositProtocolMode(uint8)": {
                    const { mode } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                    const existingMode = await sushiswapAdapter.maxDepositProtocolMode();
                    if (existingMode != mode) {
                      await sushiswapAdapter[action.action](mode);
                    }
                    break;
                  }
                  case "setMaxDepositProtocolPct(uint256)": {
                    const existingPoolPct: BigNumber = await sushiswapAdapter.maxDepositPoolPct(underlyingTokenAddress);
                    if (!existingPoolPct.eq(BigNumber.from(0))) {
                      await sushiswapAdapter.setMaxDepositPoolPct(underlyingTokenAddress, 0);
                    }
                    const { maxDepositProtocolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                    const existingProtocolPct: BigNumber = await sushiswapAdapter.maxDepositProtocolPct();
                    if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                      await sushiswapAdapter[action.action](maxDepositProtocolPct);
                    }
                    const poolValue: BigNumber = await sushiswapAdapter.getPoolValue(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    break;
                  }
                  case "setMaxDepositPoolPct(address,uint256)": {
                    const { maxDepositPoolPct } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                    const existingPoolPct: BigNumber = await sushiswapAdapter.maxDepositPoolPct(underlyingTokenAddress);
                    if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                      await sushiswapAdapter[action.action](underlyingTokenAddress, maxDepositPoolPct);
                    }
                    const poolValue: BigNumber = await sushiswapAdapter.getPoolValue(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    break;
                  }
                  case "setMaxDepositAmount(address,address,uint256)": {
                    const { maxDepositAmount } = action.args as TEST_DEFI_ADAPTER_ARGUMENTS;
                    const existingDepositAmount: BigNumber = await sushiswapAdapter.maxDepositAmount(
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    if (
                      !existingDepositAmount.eq(
                        BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(decimals))),
                      )
                    ) {
                      await sushiswapAdapter[action.action](
                        liquidityPool,
                        underlyingTokenAddress,
                        BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(BigNumber.from(decimals))),
                      );
                    }
                    limit = await sushiswapAdapter.maxDepositAmount(liquidityPool, underlyingTokenAddress);
                    defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                    defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                    break;
                  }
                  case "fundTestDeFiAdapterContract": {
                    const underlyingBalance: BigNumber = await pairInstance.balanceOf(testDeFiAdapter.address);
                    if (ValidatedPairTokens.includes(underlyingTokenAddress)) {
                      defaultFundAmount = defaultFundAmount.div(BigNumber.from(10).pow(3));
                    } else if (ValidatedCurveTokens.includes(underlyingTokenAddress)) {
                      defaultFundAmount = defaultFundAmount.div(BigNumber.from(10).pow(6));
                    }
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
                  case "fundTestDeFiAdapterContractWithRewardToken": {
                    if (rewardTokenAddress !== ADDRESS_ZERO) {
                      let rewardTokenBalance: BigNumber = await rewardTokenERC20Instance!.balanceOf(
                        testDeFiAdapter.address,
                      );
                      if (rewardTokenBalance.lte(0)) {
                        await fundWalletToken(
                          hre,
                          rewardTokenERC20Instance!.address,
                          users["owner"],
                          defaultFundAmount.mul(BigNumber.from(10).pow(rewardTokenDecimals)),
                          timestamp,
                          testDeFiAdapter.address,
                        );
                        rewardTokenBalance = await rewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                        expect(rewardTokenBalance).to.be.gt(0);
                      }
                    }
                    break;
                  }
                  case "testGetDepositAllCodes(address,address,address)": {
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                  case "testGetDepositSomeCodes(address,address,address,uint256)": {
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](
                      underlyingTokenAddress,
                      liquidityPool,
                      adapterAddress,
                      underlyingBalanceBefore,
                    );
                    break;
                  }
                  case "testGetWithdrawAllCodes(address,address,address)": {
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                    break;
                  }
                  case "testGetWithdrawSomeCodes(address,address,address,uint256)": {
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    const lpTokenBalance = await await sushiswapAdapter.getLiquidityPoolTokenBalance(
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
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    rewardTokenBalanceBefore = await rewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                    token0BalanceBefore = await token0Instance.balanceOf(testDeFiAdapter.address);
                    token1BalanceBefore = await token1Instance.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](liquidityPool, underlyingTokenAddress, adapterAddress);
                    break;
                  }
                  case "testGetHarvestSomeCodes(address,address,address,uint256)": {
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    rewardTokenBalanceBefore = await rewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                    token0BalanceBefore = await token0Instance.balanceOf(testDeFiAdapter.address);
                    token1BalanceBefore = await token1Instance.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](
                      liquidityPool,
                      underlyingTokenAddress,
                      adapterAddress,
                      rewardTokenBalanceBefore,
                    );
                    break;
                  }
                  case "testGetAddLiquidityCodes(address,address)": {
                    underlyingBalanceBefore = await pairInstance.balanceOf(testDeFiAdapter.address);
                    token0BalanceBefore = await token0Instance.balanceOf(testDeFiAdapter.address);
                    token1BalanceBefore = await token1Instance.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](underlyingTokenAddress, adapterAddress);
                    break;
                  }
                  case "getUnclaimedRewardTokenAmount(address,address,address)": {
                    const unclaimedRewardTokenAmount = await sushiswapAdapter[action.action](
                      testDeFiAdapter.address,
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    const expectedUnclaimedRewardTokenAmount = await masterChefInstance.pendingSushi(
                      pid,
                      testDeFiAdapter.address,
                    );
                    expect(unclaimedRewardTokenAmount).to.be.eq(expectedUnclaimedRewardTokenAmount);
                    break;
                  }
                  case "testGetClaimRewardTokenCodes(address,address)": {
                    rewardTokenBalanceBefore = await rewardTokenERC20Instance!.balanceOf(testDeFiAdapter.address);
                    await testDeFiAdapter[action.action](liquidityPool, sushiswapAdapter.address);
                    break;
                  }
                  case "getUnderlyingTokens(address,address)": {
                    await expect(sushiswapAdapter[action.action](ADDRESS_ZERO, ADDRESS_ZERO)).to.be.revertedWith(
                      "!empty",
                    );
                    break;
                  }
                  case "calculateAmountInLPToken(address,address,uint256)": {
                    await expect(sushiswapAdapter[action.action](ADDRESS_ZERO, ADDRESS_ZERO, 0)).to.be.revertedWith(
                      "!empty",
                    );
                    break;
                  }
                  case "getPoolValue(address,address)": {
                    const poolValue = await sushiswapAdapter[action.action](liquidityPool, underlyingTokenAddress);
                    const expectedPoolValue = await pairInstance.balanceOf(masterChefInstance.address);
                    expect(poolValue).to.be.eq(expectedPoolValue);
                    break;
                  }
                  case "getLiquidityPoolToken(address,address)": {
                    const liquidityPoolFromAdapter = await sushiswapAdapter[action.action](
                      underlyingTokenAddress,
                      ADDRESS_ZERO,
                    );
                    expect(getAddress(liquidityPoolFromAdapter)).to.be.eq(getAddress(underlyingTokenAddress));
                    break;
                  }
                  case "wait10000Seconds": {
                    const blockNumber = await hre.ethers.provider.getBlockNumber();
                    const block = await hre.ethers.provider.getBlock(blockNumber);
                    await hre.network.provider.send("evm_setNextBlockTimestamp", [block.timestamp + 10000]);
                    await hre.network.provider.send("evm_mine");
                    break;
                  }
                }
              }
              for (const action of story.getActions) {
                switch (action.action) {
                  case "getLiquidityPoolTokenBalance(address,address,address)": {
                    const expectedValue = action.expectedValue;
                    const lpTokenBalance = await sushiswapAdapter[action.action](
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    const poolValue = await sushiswapAdapter["getPoolValue(address,address)"](
                      liquidityPool,
                      underlyingTokenAddress,
                    );
                    const existingMode = await sushiswapAdapter.maxDepositProtocolMode();
                    if (existingMode == 0) {
                      const existingDepositAmount: BigNumber = await sushiswapAdapter.maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (existingDepositAmount.eq(0)) {
                        expect(+lpTokenBalance).to.be.eq(0);
                      } else {
                        expect(+lpTokenBalance).to.be.gt(0);
                      }
                    } else {
                      const existingPoolPct: BigNumber = await sushiswapAdapter.maxDepositPoolPct(liquidityPool);
                      const existingProtocolPct: BigNumber = await sushiswapAdapter.maxDepositProtocolPct();
                      if ((existingPoolPct.eq(0) && existingProtocolPct.eq(0)) || poolValue.eq(0)) {
                        expect(+lpTokenBalance).to.be.eq(0);
                      } else {
                        expectedValue == "=0"
                          ? expect(+lpTokenBalance).to.be.eq(0)
                          : expect(+lpTokenBalance).to.be.gt(0);
                      }
                    }
                    break;
                  }
                  case "balanceOf(address)": {
                    const expectedValue = action.expectedValue;
                    const underlyingBalanceAfter: BigNumber = await pairInstance[action.action](
                      testDeFiAdapter.address,
                    );
                    if (underlyingBalanceBefore.lt(limit)) {
                      expectedValue == ">0"
                        ? expect(+underlyingBalanceAfter).to.be.gt(+underlyingBalanceBefore)
                        : +rewardTokenBalanceBefore > 0
                        ? expect(+underlyingBalanceAfter).to.be.eq(+underlyingBalanceBefore)
                        : expect(+underlyingBalanceAfter).to.be.eq(0);
                    } else {
                      expectedValue == ">0"
                        ? expect(+underlyingBalanceAfter).to.be.gt(+underlyingBalanceBefore)
                        : expect(+underlyingBalanceAfter).to.be.eq(+underlyingBalanceBefore.sub(limit));
                    }
                    break;
                  }
                  case "getRewardTokenBalance(address)": {
                    const rewardTokenBalanceAfter: BigNumber = await rewardTokenERC20Instance!.balanceOf(
                      testDeFiAdapter.address,
                    );
                    const token0BalanceAfter: BigNumber = await token0Instance.balanceOf(testDeFiAdapter.address);
                    const token1BalanceAfter: BigNumber = await token1Instance.balanceOf(testDeFiAdapter.address);
                    const expectedValue = action.expectedValue;
                    if (expectedValue == ">0") {
                      expect(+rewardTokenBalanceAfter).to.be.gt(+rewardTokenBalanceBefore);
                    } else if (expectedValue == "=0") {
                      expect(+token0BalanceAfter).to.be.gt(+token0BalanceBefore);
                      expect(+token1BalanceAfter).to.be.gt(+token1BalanceBefore);
                      expect(+rewardTokenBalanceAfter).to.be.eq(0);
                    } else {
                      expect(+token0BalanceAfter).to.be.lt(+token0BalanceBefore);
                      expect(+token1BalanceAfter).to.be.lt(+token1BalanceBefore);
                      expect(+rewardTokenBalanceAfter).to.be.lt(+rewardTokenBalanceBefore);
                    }
                    break;
                  }
                  case "isRedeemableAmountSufficient(address,address,address,uint256)": {
                    const expectedValue = action.expectedValue;
                    const amountInUnderlyingToken: BigNumber = await sushiswapAdapter.getAllAmountInToken(
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    if (expectedValue == ">") {
                      const isRedeemableAmountSufficient = await sushiswapAdapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                        amountInUnderlyingToken.add(BigNumber.from(10)),
                      );
                      expect(isRedeemableAmountSufficient).to.be.eq(false);
                    } else if (expectedValue == "<") {
                      const isRedeemableAmountSufficient = await sushiswapAdapter[action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                        +amountInUnderlyingToken > 0
                          ? amountInUnderlyingToken.sub(BigNumber.from(1))
                          : BigNumber.from(0),
                      );
                      expect(isRedeemableAmountSufficient).to.be.eq(true);
                    }
                    break;
                  }
                  case "calculateRedeemableLPTokenAmount(address,address,address,uint256)": {
                    const lpTokenBalance: BigNumber = await sushiswapAdapter.getLiquidityPoolTokenBalance(
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    const expectedRedeemableLpTokenAmt = (
                      await masterChefInstance.userInfo(pid, testDeFiAdapter.address)
                    )[0];
                    expect(+lpTokenBalance).to.be.eq(+expectedRedeemableLpTokenAmt);
                    break;
                  }
                  case "getAllAmountInToken(address,address,address)": {
                    const amountInUnderlyingToken = await sushiswapAdapter[action.action](
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    let expectedAmountInUnderlyingToken = (
                      await masterChefInstance.userInfo(pid, testDeFiAdapter.address)
                    )[0];
                    const expectedUnclaimedRewardTokenAmount = await masterChefInstance.pendingSushi(
                      pid,
                      testDeFiAdapter.address,
                    );
                    if (+expectedUnclaimedRewardTokenAmount > 0) {
                      expectedAmountInUnderlyingToken = expectedAmountInUnderlyingToken.add(
                        await adapterPrerequisites["harvestCodeProvider"].rewardBalanceInUnderlyingTokens(
                          rewardTokenAddress,
                          underlyingTokenAddress,
                          expectedUnclaimedRewardTokenAmount,
                        ),
                      );
                    }
                    expect(+amountInUnderlyingToken).to.be.eq(+expectedAmountInUnderlyingToken);
                    break;
                  }
                  case "getSomeAmountInToken(address,address,uint256)": {
                    await expect(sushiswapAdapter[action.action](ADDRESS_ZERO, ADDRESS_ZERO, 0)).to.be.revertedWith(
                      "!empty",
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
                    const lpTokenBalance = await sushiswapAdapter[action.action](
                      testDeFiAdapter.address,
                      underlyingTokenAddress,
                      liquidityPool,
                    );
                    expect(+lpTokenBalance).to.be.eq(0);
                    break;
                  }
                  case "balanceOf(address)": {
                    const underlyingBalance: BigNumber = await pairInstance.balanceOf(testDeFiAdapter.address);
                    expect(+underlyingBalance).to.be.gt(0);
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
                    const canStake = await sushiswapAdapter[action.action](ADDRESS_ZERO);
                    expect(canStake).to.be.eq(false);
                    break;
                  }
                  case "setRewardToken(address)": {
                    if (action.expect == "success") {
                      await sushiswapAdapter[action.action](TypedTokens.SUSHI);
                    } else {
                      await expect(
                        sushiswapAdapter.connect(users[action.executer])[action.action](TypedTokens.SUSHI),
                      ).to.be.revertedWith(action.message);
                    }
                    break;
                  }
                }
              }
              for (const action of story.getActions) {
                switch (action.action) {
                  case "getRewardToken(address)": {
                    const _rewardTokenAddress = await sushiswapAdapter[action.action](ADDRESS_ZERO);
                    expect(getAddress(_rewardTokenAddress)).to.be.eq(getAddress(TypedTokens.SUSHI));
                    break;
                  }
                }
              }
              for (const action of story.cleanActions) {
                switch (action.action) {
                  case "setRewardToken(address)": {
                    await sushiswapAdapter[action.action](TypedTokens.SUSHI);
                    const _rewardTokenAddress = await sushiswapAdapter.getRewardToken(ADDRESS_ZERO);
                    expect(getAddress(_rewardTokenAddress)).to.be.eq(getAddress(TypedTokens.SUSHI));
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
