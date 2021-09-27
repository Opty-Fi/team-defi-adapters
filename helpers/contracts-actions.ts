import { TOKENS, RISK_PROFILES, UNISWAP_ROUTER, SUSHISWAP_ROUTER, TOKEN_HOLDERS, CURVE_REGISTRY } from "./constants";
import { Contract, Signer, BigNumber } from "ethers";
import { CONTRACTS, STRATEGY_DATA } from "./type";
import { TypedAdapterStrategies, TypedTokens, TypedPairTokens, TypedCurveTokens } from "./data";
import { executeFunc, generateStrategyStep, generateTokenHash, getEthValueGasOverrideOptions } from "./helpers";
import { amountInHex, removeDuplicateFromStringArray } from "./utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import pair from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import router from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { expect } from "chai";
import { getAddress } from "ethers/lib/utils";
import Compound from "@compound-finance/compound-js";
import { Provider } from "@compound-finance/compound-js/dist/nodejs/types";

export async function approveLiquidityPoolAndMapAdapter(
  owner: Signer,
  registryContract: Contract,
  adapter: string,
  lqPool: string,
): Promise<void> {
  await executeFunc(registryContract, owner, "approveLiquidityPool(address)", [lqPool]);
  await executeFunc(registryContract, owner, "setLiquidityPoolToAdapter(address,address)", [lqPool, adapter]);
}

export async function approveLiquidityPoolAndMapAdapters(
  owner: Signer,
  registryContract: Contract,
  adapters: CONTRACTS,
): Promise<void> {
  const liquidityPools: string[] = [];
  const liquidityPoolsMapToAdapters: [string, string][] = [];
  const creditPools: string[] = [];
  for (const adapter in adapters) {
    if (TypedAdapterStrategies[adapter]) {
      for (const strategy of TypedAdapterStrategies[adapter]) {
        for (const pool of strategy.strategy) {
          if (pool.isBorrow) {
            creditPools.push(pool.contract);
          } else {
            liquidityPools.push(pool.contract);
            liquidityPoolsMapToAdapters.push([pool.contract, adapters[adapter].address]);
          }
        }
      }
    }
  }
  try {
    if (liquidityPools.length > 0) {
      await executeFunc(registryContract, owner, "approveLiquidityPool(address[])", [
        removeDuplicateFromStringArray(liquidityPools),
      ]);
    }
    if (liquidityPoolsMapToAdapters.length > 0) {
      await executeFunc(registryContract, owner, "setLiquidityPoolToAdapter((address,address)[])", [
        liquidityPoolsMapToAdapters,
      ]);
    }
    if (creditPools.length > 0) {
      await executeFunc(registryContract, owner, "approveCreditPool(address[])", [creditPools]);
    }
  } catch (error) {
    console.log(`Got error when executing approveLiquidityPoolAndMapAdapters : ${error}`);
  }
}

export async function approveToken(owner: Signer, registryContract: Contract, tokenAddresses: string[]): Promise<void> {
  if (tokenAddresses.length > 0) {
    await executeFunc(registryContract, owner, "approveToken(address[])", [tokenAddresses]);
    await executeFunc(registryContract, owner, "setTokensHashToTokens(address[][])", [
      tokenAddresses.map(addr => [addr]),
    ]);
  }
}

export async function approveTokens(owner: Signer, registryContract: Contract): Promise<void> {
  const tokenAddresses: string[] = [];
  for (const token in TOKENS) {
    tokenAddresses.push(TOKENS[token]);
  }
  try {
    await approveToken(owner, registryContract, tokenAddresses);
  } catch (error) {
    console.log(`Got error when executing approveTokens : ${error}`);
  }
}

export async function setAndApproveVaultRewardToken(
  owner: Signer,
  vaultContractAddress: string,
  rewardTokenAddress: string,
  registryContract: Contract,
): Promise<void> {
  try {
    if (vaultContractAddress.length > 0 && rewardTokenAddress.length > 0) {
      await executeFunc(registryContract, owner, "approveToken(address[])", [
        [vaultContractAddress, rewardTokenAddress],
      ]);
      await executeFunc(registryContract, owner, "setTokensHashToTokens(address[])", [
        [vaultContractAddress, rewardTokenAddress],
      ]);
    }
  } catch (error) {
    console.log(`Got error when executing approveTokens for vault and reward tokens : ${error}`);
  }
}

export async function setStrategy(
  strategy: STRATEGY_DATA[],
  tokens: string[],
  vaultStepInvestStrategyDefinitionRegistry: Contract,
): Promise<string> {
  const strategySteps: [string, string, boolean][] = generateStrategyStep(strategy);
  const tokensHash = generateTokenHash(tokens);
  const strategies = await vaultStepInvestStrategyDefinitionRegistry["setStrategy(bytes32,(address,address,bool)[])"](
    tokensHash,
    strategySteps,
  );
  const strategyReceipt = await strategies.wait();
  return strategyReceipt.events[0].args[1];
}

export async function setBestBasicStrategy(
  strategy: STRATEGY_DATA[],
  tokens: string[],
  vaultStepInvestStrategyDefinitionRegistry: Contract,
  strategyProvider: Contract,
  riskProfile: string,
): Promise<string> {
  const tokensHash = generateTokenHash(tokens);
  const strategyHash = await setStrategy(strategy, tokens, vaultStepInvestStrategyDefinitionRegistry);
  await strategyProvider.setBestStrategy(riskProfile, tokensHash, strategyHash);
  const strategyProviderStrategy = await strategyProvider.rpToTokenToBestStrategy(riskProfile, tokensHash);
  expect(strategyProviderStrategy).to.equal(strategyHash);
  return strategyHash;
}

export async function fundWalletToken(
  hre: HardhatRuntimeEnvironment,
  tokenAddress: string,
  wallet: Signer,
  fundAmount: BigNumber,
  deadlineTimestamp: number,
  toAddress?: string,
): Promise<BigNumber> {
  const amount = amountInHex(fundAmount);
  const address = toAddress === undefined ? await wallet.getAddress() : toAddress;
  const ValidatedPairTokens = Object.values(TypedPairTokens).map(({ address }) => getAddress(address));
  const ValidatedCurveTokens = Object.values(TypedCurveTokens).map(({ address }) => getAddress(address));
  const uniswapInstance = await hre.ethers.getContractAt(router.abi, UNISWAP_ROUTER);
  const tokenInstance = await hre.ethers.getContractAt("ERC20", tokenAddress);
  if (ValidatedPairTokens.includes(getAddress(tokenAddress))) {
    const pairInstance = await hre.ethers.getContractAt(pair.abi, tokenAddress);
    const pairSymbol = await pairInstance.symbol();
    if (["SLP", "UNI-V2"].includes(pairSymbol)) {
      const TOKEN0 = await pairInstance.token0();
      const TOKEN1 = await pairInstance.token1();
      let token0Path: string[] = [],
        token1Path: string[] = [];
      for (let i = 0; i < Object.values(TypedPairTokens).length; i++) {
        const value = Object.values(TypedPairTokens)[i];
        if (getAddress(value.address) === getAddress(tokenAddress)) {
          if (value.path0) {
            token0Path.push(getAddress(TypedTokens[value.path0[0]]));
          }
          if (value.path1) {
            token1Path.push(getAddress(TypedTokens[value.path1[0]]));
          }
          if (token0Path.length > 0 || getAddress(TOKEN0) !== getAddress(TypedTokens["WETH"])) {
            token0Path = [TypedTokens["WETH"], ...token0Path, getAddress(TOKEN0)];
          }
          if (token1Path.length > 0 || getAddress(TOKEN1) !== getAddress(TypedTokens["WETH"])) {
            token1Path = [TypedTokens["WETH"], ...token1Path, getAddress(TOKEN1)];
          }
        }
      }
      const routerInstance = await hre.ethers.getContractAt(
        router.abi,
        pairSymbol === "SLP" ? SUSHISWAP_ROUTER : UNISWAP_ROUTER,
      );

      if (getAddress(TOKEN1) === getAddress(TypedTokens["WETH"])) {
        await transferSLPOrUNI(
          hre,
          routerInstance,
          pairInstance,
          [{ path: token0Path, address: TOKEN0 }],
          wallet,
          deadlineTimestamp,
          address,
        );
      } else if (getAddress(TOKEN0) === getAddress(TypedTokens["WETH"])) {
        await transferSLPOrUNI(
          hre,
          routerInstance,
          pairInstance,
          [{ path: token1Path, address: TOKEN1 }],
          wallet,
          deadlineTimestamp,
          address,
        );
      } else {
        await transferSLPOrUNI(
          hre,
          routerInstance,
          pairInstance,
          [
            { path: token0Path, address: TOKEN0 },
            { path: token1Path, address: TOKEN1 },
          ],
          wallet,
          deadlineTimestamp,
          address,
        );
      }
    }
  } else if (ValidatedCurveTokens.includes(getAddress(tokenAddress))) {
    const curveToken = Object.values(TypedCurveTokens).find(
      ({ address }) => getAddress(tokenAddress) === getAddress(address),
    );
    if (curveToken) {
      const pool = curveToken.pool;
      const swap = curveToken?.swap;
      const old = curveToken?.old;
      const curveRegistryInstance = await hre.ethers.getContractAt("ICurveRegistry", CURVE_REGISTRY);
      const tokenAddressInstance = await hre.ethers.getContractAt("ERC20", tokenAddress);

      const instance = await hre.ethers.getContractAt(swap ? "ICurveSwap" : "ICurveDeposit", pool);
      const coin = swap
        ? await instance.coins(0)
        : old
        ? await instance.underlying_coins(0)
        : await instance.base_coins(0);
      const coinInstance = await hre.ethers.getContractAt("ERC20", coin);
      await uniswapInstance
        .connect(wallet)
        .swapExactETHForTokens(
          1,
          [TypedTokens["WETH"], coin],
          wallet.getAddress(),
          deadlineTimestamp,
          getEthValueGasOverrideOptions(hre, "9500"),
        );
      await coinInstance.connect(wallet).approve(pool, await coinInstance.balanceOf(wallet.getAddress()));

      const N_COINS = (await curveRegistryInstance.get_n_coins(pool))[1];
      if (N_COINS.toString() === "3") {
        await instance.connect(wallet).add_liquidity([await coinInstance.balanceOf(wallet.getAddress()), "0", "0"], 1);
        await tokenAddressInstance.connect(wallet).transfer(address, amount);
      } else if (getAddress(coin) === getAddress(TypedTokens.ETH)) {
        await instance.connect(wallet).add_liquidity(["9500", "0"], "1", getEthValueGasOverrideOptions(hre, "9500"));
        await tokenAddressInstance
          .connect(wallet)
          .transfer(address, await tokenAddressInstance.balanceOf(wallet.getAddress()));
      } else if (N_COINS.toString() === "2") {
        await instance.connect(wallet).add_liquidity([await coinInstance.balanceOf(wallet.getAddress()), "0"], "1");
        await tokenAddressInstance.connect(wallet).transfer(address, amount);
      } else if (N_COINS.toString() === "4") {
        if (old) {
          await instance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(await wallet.getAddress()), 0, 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else {
          await instance
            .connect(wallet)
            .add_liquidity([0, await coinInstance.balanceOf(await wallet.getAddress()), 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        }
      }
    }
  } else if (getAddress(tokenAddress) === getAddress(TypedTokens["WETH"])) {
    const wEthInstance = await hre.ethers.getContractAt("IWETH", TypedTokens["WETH"]);
    //  Funding user's wallet with WETH tokens
    await wEthInstance.deposit({ value: amount });
    await wEthInstance.transfer(address, amount);
  } else if (getAddress(tokenAddress) === getAddress(TypedTokens["YETH"])) {
    const yEthInstance = await hre.ethers.getContractAt("IWETH", TypedTokens["YETH"]);
    //  Funding user's wallet with WETH tokens
    await yEthInstance.depositETH({ value: amount });
    const balance = await yEthInstance.balanceOf(await wallet.getAddress());
    await yEthInstance.transfer(address, balance);
  } else {
    const tokenHolder = Object.keys(TOKEN_HOLDERS).filter(
      holder => getAddress(TypedTokens[holder]) === getAddress(tokenAddress),
    );
    if (tokenHolder.length > 0) {
      await fundWalletFromImpersonatedAccount(hre, tokenAddress, TOKEN_HOLDERS[tokenHolder[0]], fundAmount, address);
    } else {
      await uniswapInstance.swapETHForExactTokens(
        amount,
        [TypedTokens["WETH"], tokenAddress],
        address,
        deadlineTimestamp,
        getEthValueGasOverrideOptions(hre, "9500"),
      );
    }
  }
  return await tokenInstance.balanceOf(address);
}

async function transferSLPOrUNI(
  hre: HardhatRuntimeEnvironment,
  routerInstance: Contract,
  pairInstance: Contract,
  tokens: { path: string[]; address: string }[],
  wallet: Signer,
  deadlineTimestamp: number,
  toAddress: string,
) {
  for (let i = 0; i < tokens.length; i++) {
    await swapAndApproveToken(hre, routerInstance, wallet, deadlineTimestamp, tokens[i].address, tokens[i].path);
  }
  if (tokens.length === 1) {
    const tokenInstance = await hre.ethers.getContractAt("ERC20", tokens[0].address);
    await routerInstance
      .connect(wallet)
      .addLiquidityETH(
        tokens[0].address,
        await tokenInstance.balanceOf(await wallet.getAddress()),
        0,
        0,
        await wallet.getAddress(),
        deadlineTimestamp,
        getEthValueGasOverrideOptions(hre, "9500"),
      );
  } else {
    const token0Instance = await hre.ethers.getContractAt("ERC20", tokens[0].address);
    const token1Instance = await hre.ethers.getContractAt("ERC20", tokens[1].address);
    await routerInstance
      .connect(wallet)
      .addLiquidity(
        tokens[0].address,
        tokens[1].address,
        await token0Instance.balanceOf(await wallet.getAddress()),
        await token1Instance.balanceOf(await wallet.getAddress()),
        0,
        0,
        await wallet.getAddress(),
        deadlineTimestamp,
      );
  }
  await pairInstance.connect(wallet).transfer(toAddress, await pairInstance.balanceOf(await wallet.getAddress()));
}

async function swapAndApproveToken(
  hre: HardhatRuntimeEnvironment,
  routerInstance: Contract,
  wallet: Signer,
  deadlineTimestamp: number,
  tokenAddress: string,
  tokenPath: string[],
) {
  const tokenInstance = await hre.ethers.getContractAt("ERC20", tokenAddress);
  await routerInstance
    .connect(wallet)
    .swapExactETHForTokens(
      1,
      tokenPath,
      await wallet.getAddress(),
      deadlineTimestamp,
      getEthValueGasOverrideOptions(hre, "9500"),
    );
  await tokenInstance.connect(wallet).approve(routerInstance.address, 0);
  await tokenInstance
    .connect(wallet)
    .approve(routerInstance.address, await tokenInstance.balanceOf(await wallet.getAddress()));
}

export async function fundWalletFromImpersonatedAccount(
  hre: HardhatRuntimeEnvironment,
  tokenAddress: string,
  impersonatedAccountAddr: string,
  fundAmount: BigNumber,
  toAddress: string,
): Promise<void> {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [impersonatedAccountAddr],
  });
  const impersonatedAccount = await hre.ethers.getSigner(impersonatedAccountAddr);
  const erc20Instance = await hre.ethers.getContractAt("ERC20", tokenAddress);
  const balance = await erc20Instance.balanceOf(impersonatedAccountAddr);
  if (+balance >= +fundAmount) {
    await erc20Instance.connect(impersonatedAccount).transfer(toAddress, fundAmount);
  } else {
    throw new Error("not enough amount");
  }
}

export async function getBlockTimestamp(hre: HardhatRuntimeEnvironment): Promise<number> {
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const block = await hre.ethers.provider.getBlock(blockNumber);
  const timestamp = block.timestamp;
  return timestamp;
}

export async function getTokenName(hre: HardhatRuntimeEnvironment, tokenName: string): Promise<string> {
  if (tokenName.toLowerCase() == "mkr") {
    return "Maker";
  } else {
    const ERC20Instance = await hre.ethers.getContractAt("ERC20", TypedTokens[tokenName.toUpperCase()]);
    const name: string = await ERC20Instance.name();
    return name;
  }
}

export async function getTokenSymbol(hre: HardhatRuntimeEnvironment, tokenName: string): Promise<string> {
  if (tokenName.toLowerCase() == "mkr") {
    return "MKR";
  } else {
    const ERC20Instance = await hre.ethers.getContractAt("ERC20", TypedTokens[tokenName.toUpperCase()]);
    const symbol = await ERC20Instance.symbol();
    return symbol;
  }
}

export async function getTokenInforWithAddress(
  hre: HardhatRuntimeEnvironment,
  address: string,
): Promise<{ name: string; symbol: string }> {
  const ERC20Instance = await hre.ethers.getContractAt("ERC20", address);
  const symbol = await ERC20Instance.symbol();
  const name: string = await ERC20Instance.name();
  return { name, symbol };
}

export async function unpauseVault(
  owner: Signer,
  registryContract: Contract,
  vaultAddr: string,
  unpaused: boolean,
): Promise<void> {
  await executeFunc(registryContract, owner, "unpauseVaultContract(address,bool)", [vaultAddr, unpaused]);
}

export async function addRiskProfiles(owner: Signer, registry: Contract): Promise<void> {
  const profiles = Object.keys(RISK_PROFILES);
  for (let i = 0; i < profiles.length; i++) {
    const profile = await registry.getRiskProfile(RISK_PROFILES[profiles[i]].name);
    if (!profile.exists) {
      await executeFunc(registry, owner, "addRiskProfile(string,bool,(uint8,uint8))", [
        RISK_PROFILES[profiles[i]].name,
        RISK_PROFILES[profiles[i]].canBorrow,
        RISK_PROFILES[profiles[i]].poolRating,
      ]);
    }
  }
}

export async function addRiskProfile(
  registry: Contract,
  owner: Signer,
  name: string,
  canBorrow: boolean,
  poolRating: number[],
): Promise<void> {
  const profile = await registry.getRiskProfile(name);
  if (!profile.exists) {
    await executeFunc(registry, owner, "addRiskProfile(string,bool,(uint8,uint8))", [name, canBorrow, poolRating]);
  }
}

//  Function to check if cToken/crToken Pool is paused or not.
//  @dev: SAI,REP = Mint is paused for cSAI, cREP
//  @dev: WBTC has mint paused for latest blockNumbers, However WBTC2 works fine with the latest blockNumber (For Compound)
export async function lpPausedStatus(
  hre: HardhatRuntimeEnvironment,
  pool: string,
  comptrollerAddress: string,
): Promise<boolean> {
  return await executeComptrollerFunc(hre, comptrollerAddress, "function mintGuardianPaused(address) returns (bool)", [
    pool,
  ]);
}

export async function executeComptrollerFunc(
  hre: HardhatRuntimeEnvironment,
  comptrollerAddress: string,
  functionSignature: string,
  params: any[],
): Promise<any> {
  return await Compound.eth.read(comptrollerAddress, functionSignature, [...params], {
    provider: <Provider>(<unknown>hre.network.provider),
  });
}
