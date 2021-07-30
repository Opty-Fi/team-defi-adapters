import { expect } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, ethers } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TESTING_DEPLOYMENT_ONCE } from "../../../helpers/constants";
import { TypedDefiPools } from "../../../helpers/data";
import { deployAdapters, deployRegistry } from "../../../helpers/contracts-deployments";
import { fundWalletToken, getBlockTimestamp } from "../../../helpers/contracts-actions";
// import testDeFiAdaptersScenario from "../scenarios/test-all-defi-adapters.json";
import testDeFiAdaptersScenario from "../scenarios/test-defi-adapter.json";
import { deployContract, edgeCaseTokens, getDefaultFundAmount } from "../../../helpers/helpers";
import { getAddress } from "ethers/lib/utils";
import abis from "../../../helpers/data/abis.json";

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

type TEST_DEFI_ADAPTER_ARGUMENTS = {
  mode?: string;
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
};

describe(`${testDeFiAdaptersScenario.title} - CompoundAdapter`, async () => {
  let registry: Contract;
  let users: { [key: string]: Signer };
  const adapterNames = Object.keys(TypedDefiPools);
  let testDeFiAdapter: Contract;
  let adapters: CONTRACTS;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    registry = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    adapters = await deployAdapters(hre, owner, registry.address, true);
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
          // for (let i = 0; i < 1; i++) {
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
                      }
                      break;
                    }
                    case "setMaxDepositProtocolPct(uint256)": {
                      const existingPoolPct: BigNumber = await adapters[adapterName].maxDepositPoolPct(liquidityPool);
                      if (!existingPoolPct.eq(BigNumber.from(0))) {
                        await adapters[adapterName].setMaxDepositPoolPct(liquidityPool, 0);
                      }
                      const { maxDepositProtocolPct }: TEST_DEFI_ADAPTER_ARGUMENTS = action.args!;
                      const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                      if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                        await adapters[adapterName][action.action](maxDepositProtocolPct);
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
                      }
                      limit = BigNumber.from(maxDepositAmount);
                      defaultFundAmount = defaultFundAmount.mul(BigNumber.from(10).pow(decimals));
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
                    case "testGetWithdrawAllCodes(address,address,address)": {
                      console.log("Action: ", action.action);
                      underlyingBalanceBefore = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                      await testDeFiAdapter[action.action](underlyingTokenAddress, liquidityPool, adapterAddress);
                      break;
                    }
                  }
                }
                for (const action of story.getActions) {
                  switch (action.action) {
                    case "getLiquidityPoolTokenBalance(address,address,address)": {
                      console.log("Action: ", action.action);
                      const expectedValue = action.expectedValue;
                      // const expectedValue = await LpTokenERC20Instance.balanceOf(testDeFiAdapter.address)
                      const lpTokenBalance = await adapters[adapterName][action.action](
                        testDeFiAdapter.address,
                        underlyingTokenAddress,
                        liquidityPool,
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
