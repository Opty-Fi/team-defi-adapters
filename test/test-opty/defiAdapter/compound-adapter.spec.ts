import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils, ethers } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, ADDRESS_ZERO } from "../../../helpers/constants";
import { TypedAdapterStrategies } from "../../../helpers/data";
import {
  deployAdapter,
  deployEssentialContracts,
  deployAdapterPrerequisites,
} from "../../../helpers/contracts-deployments";
import { approveTokens, fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";
import { TypedDefiPools } from "../../../helpers/data";
import testDeFiAdaptersScenario from "../scenarios/test-defi-adapter.json";
import { deployContract, edgeCaseTokens, getDefaultFundAmount } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import abis from "../../../helpers/data/abis.json";

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

type TEST_DEFI_ADAPTER_ARGUMENTS = {
  mode?: string;
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
};

describe("CompoundAdapter", () => {
  const ADAPTER_NAME = "CompoundAdapter";
  const strategies = TypedAdapterStrategies[ADAPTER_NAME];
  const MAX_AMOUNT = BigNumber.from("20000000000000000000");
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
      const token = TOKENS[strategy.token];
      let lpToken: string;
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          await fundWalletToken(hre, token, owner, MAX_AMOUNT, timestamp);
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
});

describe(`${testDeFiAdaptersScenario.title} - CompoundAdapter`, async () => {
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
    const CompoundAdapter = await deployAdapter(
      hre,
      owner,
      "CompoundAdapter",
      adapterPrerequisites.registry.address,
      true,
    );
    adapters = { CompoundAdapter };
  });

  for (const adapterName of adapterNames) {
    // TODO: In future it can be leverage across all the adapters
    if (adapterName == "CompoundAdapter") {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        const underlyingTokenAddress = getAddress(TypedDefiPools[adapterName][pool].tokens[0]);
        if (
          TypedDefiPools[adapterName][pool].tokens.length == 1 &&
          !edgeCaseTokens(adapterName, underlyingTokenAddress)
        ) {
          for (let i = 0; i < testDeFiAdaptersScenario.stories.length; i++) {
            it(`${pool} - ${testDeFiAdaptersScenario.stories[i].description}`, async () => {
              const lpPauseStatus = await lpPausedStatus(getAddress(TypedDefiPools[adapterName][pool].pool));
              if (!lpPauseStatus) {
                const story = testDeFiAdaptersScenario.stories[i];
                let defaultFundAmount: BigNumber = getDefaultFundAmount(underlyingTokenAddress);
                let limit: BigNumber = ethers.BigNumber.from(0);
                const timestamp = (await getBlockTimestamp(hre)) * 2;
                const liquidityPool = TypedDefiPools[adapterName][pool].pool;
                const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
                const LpERC20Instance = await hre.ethers.getContractAt("ERC20", liquidityPool);
                let underlyingBalanceBefore: BigNumber = ethers.BigNumber.from(0);
                const decimals = await ERC20Instance.decimals();
                const adapterAddress = adapters[adapterName].address;

                const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                  liquidityPool,
                  underlyingTokenAddress,
                );

                for (const action of story.setActions) {
                  switch (action.action) {
                    case "setMaxDepositProtocolMode(uint8)": {
                      const { mode }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingMode = await adapters[adapterName].maxDepositProtocolMode();
                      if (existingMode != mode) {
                        await adapters[adapterName][action.action](mode);
                        const modeSet = await adapters[adapterName].maxDepositProtocolMode();
                        expect(+modeSet).to.be.eq(+mode!);
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await adapters[adapterName].setMaxDepositPoolPct(liquidityPool, 0);
                        const maxDepositPoolPctSetToZero = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                        expect(+maxDepositPoolPctSetToZero).to.be.eq(0);
                      }
                      const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        await adapters[adapterName][action.action](maxDepositProtocolPct);
                        const maxDepositProtocolPctSet = await adapters[adapterName].maxDepositProtocolPct();
                        expect(+maxDepositProtocolPctSet).to.be.eq(+maxDepositProtocolPct!);
                      }
                      limit = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                      break;
                    }
                    case "setMaxDepositPoolPct(address,uint256)": {
                      const { maxDepositPoolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(maxDepositPoolPct))) {
                        await adapters[adapterName][action.action](liquidityPool, maxDepositPoolPct);
                        const maxDepositPoolPctSet = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                        expect(+maxDepositPoolPctSet).to.be.eq(+maxDepositPoolPct!);
                      }
                      limit = poolValue.mul(BigNumber.from(maxDepositPoolPct)).div(BigNumber.from(10000));
                      defaultFundAmount = defaultFundAmount.lte(limit) ? defaultFundAmount : limit;
                      defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
                      break;
                    }
                    case "setMaxDepositAmount(address,address,uint256)": {
                      let { maxDepositAmount }: any = action.args;
                      maxDepositAmount = BigNumber.from(maxDepositAmount).mul(BigNumber.from(10).pow(decimals));
                      const existingDepositAmount: BigNumber = await adapters[adapterName].maxDepositAmount(
                        liquidityPool,
                        underlyingTokenAddress,
                      );
                      if (!existingDepositAmount.eq(BigNumber.from(maxDepositAmount))) {
                        await adapters[adapterName][action.action](
                          liquidityPool,
                          underlyingTokenAddress,
                          maxDepositAmount,
                        );
                        const maxDepositAmountSet = await adapters[adapterName].maxDepositAmount(
                          liquidityPool,
                          underlyingTokenAddress,
                        );
                        expect(+maxDepositAmountSet).to.be.eq(+maxDepositAmount);
                      }
                      limit = BigNumber.from(maxDepositAmount);
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
                    case "testGetDepositAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                    case "testGetWithdrawAllCodes(address,address,address)": {
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      const expectedValue = action.expectedValue;
                      const expectedLpBalanceFromPool = await LpERC20Instance.balanceOf(testDeFiAdapter.address);
                      const lpTokenBalance = await adapters[adapterName][action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
                      );
                      expect(+lpTokenBalance).to.be.eq(+expectedLpBalanceFromPool);
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
              }
            });
          }
        }
      }
    }
  }
});

//  Function to check if cToken Pool is paused or not.
//  @dev: SAI,REP = Mint is paused
//  @dev: WBTC has mint paused for latest blockNumbers, However WBTC2 works fine with the latest blockNumber
async function lpPausedStatus(pool: string): Promise<boolean> {
  const compoundController = await hre.ethers.getContractAt(
    abis.compoundComptroller.abi,
    abis.compoundComptroller.address,
  );
  const lpPauseStatus = await compoundController["mintGuardianPaused(address)"](pool);
  return lpPauseStatus;
}
