import hre from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { deployAdapterPrerequisites, deployAdapters } from "../../helpers/contracts-deployments";
import scenario from "./scenarios/defi-adapter.json";
import { deployContract } from "../../helpers/helpers";
import { CONTRACTS } from "../../helpers/type";
import { TypedDefiPools } from "../../helpers/data";
import { fundWalletToken, getBlockTimestamp } from "../../helpers/contracts-actions";
import { expect } from "chai";

type ARGUMENTS = {
  maxDepositProtocolPct?: string;
  maxDepositPoolPct?: string;
  maxDepositAmount?: string;
  mode?: string;
};

describe(scenario.title, () => {
  let adapterPrerequisites: CONTRACTS;
  let users: { [key: string]: Signer };
  const adapterNames = Object.keys(TypedDefiPools);
  let testDeFiAdapter: Contract;
  let adapters: CONTRACTS;
  const defaultFundAmount: BigNumber = BigNumber.from("10");
  let maxFundAmount: BigNumber;

  before(async () => {
    const [owner, admin, user1] = await hre.ethers.getSigners();
    users = { owner, admin, user1 };
    adapterPrerequisites = await deployAdapterPrerequisites(hre, owner, true);
    testDeFiAdapter = await deployContract(hre, "TestDeFiAdapter", false, users["owner"], []);
    adapters = await deployAdapters(hre, owner, adapterPrerequisites.registry.address, true);
  });

  for (const adapterName of adapterNames) {
    // TODO: In future it can be leverage across all the adapters
    if (adapterName == "CurveDepositPoolAdapter") {
      const pools = Object.keys(TypedDefiPools[adapterName]);
      for (const pool of pools) {
        if (TypedDefiPools[adapterName][pool].tokens.length == 1) {
          for (const story of scenario.stories) {
            it(`${pool} - ${story.description}`, async () => {
              const timestamp = (await getBlockTimestamp(hre)) * 2;
              const underlyingTokenAddress = TypedDefiPools[adapterName][pool].tokens[0];
              const liquidityPool = TypedDefiPools[adapterName][pool].pool;
              const ERC20Instance = await hre.ethers.getContractAt("ERC20", underlyingTokenAddress);
              const decimals = await ERC20Instance.decimals();
              const adapterAddress = adapters[adapterName].address;
              for (const action of story.setActions) {
                const poolValue: BigNumber = await adapters[adapterName].getPoolValue(
                  liquidityPool,
                  underlyingTokenAddress,
                );
                switch (action.action) {
                  case "setMaxDepositPoolType(uint8)": {
                    const { mode }: ARGUMENTS = action.args;
                    const existingMode = await adapters[adapterName].maxExposureType();
                    if (existingMode != mode) {
                      await adapters[adapterName][action.action](mode);
                    }
                    break;
                  }
                  case "setMaxDepositProtocolPct(uint256)": {
                    const { maxDepositProtocolPct }: ARGUMENTS = action.args;
                    const existingProtocolPct: BigNumber = await adapters[adapterName].maxDepositProtocolPct();
                    if (!existingProtocolPct.eq(BigNumber.from(maxDepositProtocolPct))) {
                      await adapters[adapterName][action.action](maxDepositProtocolPct);
                    }
                    maxFundAmount = poolValue.mul(BigNumber.from(maxDepositProtocolPct)).div(BigNumber.from(10000));
                    maxFundAmount = defaultFundAmount.lte(maxFundAmount) ? defaultFundAmount : maxFundAmount;
                    break;
                  }
                  case "fundTestDeFiAdapterContract": {
                    const underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    if (underlyingBalance.lt(maxFundAmount)) {
                      await fundWalletToken(
                        hre,
                        underlyingTokenAddress,
                        users["owner"],
                        maxFundAmount.mul(BigNumber.from(10).pow(decimals)),
                        timestamp,
                        testDeFiAdapter.address,
                      );
                    }
                    break;
                  }
                  case "depositAll(address,address,address)": {
                    await testDeFiAdapter.depositAll(underlyingTokenAddress, liquidityPool, adapterAddress);
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
                    expect(lpTokenBalance).to.be.gt(0);
                    break;
                  }
                  case "balanceOf(address": {
                    const underlyingBalance: BigNumber = await ERC20Instance.balanceOf(testDeFiAdapter.address);
                    expect(underlyingBalance).to.be.eq(0);
                  }
                }
              }
              for (const action of story.cleanActions) {
                switch (action.action) {
                  case "withdrawAll(address,address,address)": {
                    await testDeFiAdapter.withdrawAll(underlyingTokenAddress, liquidityPool, adapterAddress);
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
