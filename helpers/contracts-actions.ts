import { TOKENS, RISK_PROFILES, TOKEN_HOLDERS, ADDRESS_ETH } from "./constants";
import { Contract, Signer, BigNumber } from "ethers";
import { CONTRACTS, STRATEGY_DATA } from "./type";
import { TypedCurveTokens, TypedAdapterStrategies, TypedTokens } from "./data";
import { executeFunc, generateStrategyStep, generateTokenHash, getEthValueGasOverrideOptions } from "./helpers";
import { amountInHex, removeDuplicateFromStringArray } from "./utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import exchange from "./data/exchange.json";
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
): Promise<void> {
  const amount = amountInHex(fundAmount);
  const address = toAddress === undefined ? await wallet.getAddress() : toAddress;
  const ValidatedPairTokens = Object.values(TypedTokens)
    .map(({ address }) => address)
    .map(t => getAddress(t));
  const ValidatedCurveTokens = Object.values(TypedCurveTokens)
    .map(({ address }) => address)
    .map(t => getAddress(t));
  const uniswapInstance = new hre.ethers.Contract(exchange.uniswap.address, "IUniswapV2Router02", wallet);
  const sushiswapInstance = new hre.ethers.Contract(exchange.sushiswap.address, "IUniswapV2Router02", wallet);
  if (ValidatedPairTokens.includes(getAddress(tokenAddress))) {
    const pairInstance = new hre.ethers.Contract(tokenAddress, "IUniswapV2Pair", wallet);
    const TOKEN0 = await pairInstance.token0();
    const TOKEN1 = await pairInstance.token1();
    const token0Instance = await hre.ethers.getContractAt("ERC20", TOKEN0);
    const token1Instance = await hre.ethers.getContractAt("ERC20", TOKEN1);
    let token0Path = Object.values(TypedTokens)
      .filter(({ address }) => tokenAddress.includes(address))
      .map(({ path0 }) => path0)[0];
    let token1Path = Object.values(TypedTokens)
      .filter(({ address }) => tokenAddress.includes(address))
      .map(({ path1 }) => path1)[0];
    if (token0Path === undefined) {
      if (TOKEN0 !== TypedTokens["WETH"]) {
        token0Path = [TypedTokens["WETH"], TOKEN0];
      }
    } else {
      token0Path = token0Path.map(token => TypedTokens[token]);
      token0Path.unshift(TypedTokens["WETH"]);
      token0Path.push(TOKEN0);
    }
    if (token1Path === undefined) {
      if (TOKEN1 !== TypedTokens["WETH"]) {
        token1Path = [TypedTokens["WETH"], TOKEN1];
      }
    } else {
      token1Path = token1Path.map(token => TypedTokens[token]);
      token1Path.unshift(TypedTokens["WETH"]);
      token1Path.push(TOKEN1);
    }
    if ((await pairInstance.symbol()) === "SLP") {
      if (TOKEN1 === TypedTokens["WETH"]) {
        await sushiswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token0Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await token0Instance.connect(wallet).approve(exchange.sushiswap.address, 0);
        await token0Instance
          .connect(wallet)
          .approve(exchange.sushiswap.address, await token0Instance.balanceOf(await wallet.getAddress()));
        await sushiswapInstance
          .connect(wallet)
          .addLiquidityETH(
            TOKEN0,
            await token0Instance.balanceOf(await wallet.getAddress()),
            0,
            0,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await pairInstance.connect(wallet).transfer(address, amount);
      } else if (TOKEN0 === TypedTokens["WETH"]) {
        await sushiswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token1Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await token1Instance.connect(wallet).approve(exchange.sushiswap.address, 0);
        await token1Instance
          .connect(wallet)
          .approve(exchange.sushiswap.address, await token1Instance.balanceOf(await wallet.getAddress()));
        await sushiswapInstance
          .connect(wallet)
          .addLiquidityETH(
            TOKEN1,
            await token1Instance.balanceOf(await wallet.getAddress()),
            0,
            0,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await pairInstance.connect(wallet).transfer(address, amount);
      } else {
        await sushiswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token0Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await sushiswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token1Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await token0Instance.connect(wallet).approve(exchange.sushiswap.address, 0);
        await token1Instance.connect(wallet).approve(exchange.sushiswap.address, 0);
        await token0Instance
          .connect(wallet)
          .approve(exchange.sushiswap.address, await token0Instance.balanceOf(await wallet.getAddress()));
        await token1Instance
          .connect(wallet)
          .approve(exchange.sushiswap.address, await token1Instance.balanceOf(await wallet.getAddress()));
        await sushiswapInstance
          .connect(wallet)
          .addLiquidity(
            TOKEN0,
            TOKEN1,
            await token0Instance.balanceOf(await wallet.getAddress()),
            await token1Instance.balanceOf(await wallet.getAddress()),
            0,
            0,
            await wallet.getAddress(),
            deadlineTimestamp,
          );
        await pairInstance.connect(wallet).transfer(address, amount);
      }
    } else if ((await pairInstance.symbol()) === "UNI-V2") {
      const TOKEN0 = await pairInstance.token0();
      const TOKEN1 = await pairInstance.token1();
      const token0Instance = await hre.ethers.getContractAt("ERC20", TOKEN0);
      const token1Instance = await hre.ethers.getContractAt("ERC20", TOKEN1);
      if (TOKEN1 === TypedTokens["WETH"]) {
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token0Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await token0Instance.connect(wallet).approve(exchange.uniswap.address, 0);
        await token0Instance
          .connect(wallet)
          .approve(exchange.uniswap.address, await token0Instance.balanceOf(await wallet.getAddress()));
        await uniswapInstance
          .connect(wallet)
          .addLiquidityETH(
            TOKEN0,
            await token0Instance.balanceOf(await wallet.getAddress()),
            0,
            0,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await pairInstance.connect(wallet).transfer(address, amount);
      } else if (TOKEN0 === TypedTokens["WETH"]) {
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token1Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await token1Instance.connect(wallet).approve(exchange.uniswap.address, 0);
        await token1Instance
          .connect(wallet)
          .approve(exchange.uniswap.address, await token1Instance.balanceOf(await wallet.getAddress()));
        await uniswapInstance
          .connect(wallet)
          .addLiquidityETH(
            TOKEN1,
            await token1Instance.balanceOf(await wallet.getAddress()),
            0,
            0,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await pairInstance.connect(wallet).transfer(address, amount);
      } else {
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token0Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token1Path,
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await token0Instance.connect(wallet).approve(exchange.uniswap.address, 0);
        await token1Instance.connect(wallet).approve(exchange.uniswap.address, 0);
        await token0Instance
          .connect(wallet)
          .approve(exchange.uniswap.address, await token0Instance.balanceOf(await wallet.getAddress()));
        await token1Instance
          .connect(wallet)
          .approve(exchange.uniswap.address, await token1Instance.balanceOf(await wallet.getAddress()));
        await uniswapInstance
          .connect(wallet)
          .addLiquidity(
            TOKEN0,
            TOKEN1,
            await token0Instance.balanceOf(await wallet.getAddress()),
            await token1Instance.balanceOf(await wallet.getAddress()),
            0,
            0,
            await wallet.getAddress(),
            deadlineTimestamp,
          );
        await pairInstance.connect(wallet).transfer(address, amount);
      }
    }
  } else if (ValidatedCurveTokens.includes(getAddress(tokenAddress))) {
    const pool = Object.values(TypedCurveTokens)
      .filter(({ address }) => tokenAddress.includes(address))
      .map(({ pool }) => pool)[0];
    const swap = Object.values(TypedCurveTokens)
      .filter(({ address }) => tokenAddress.includes(address))
      .map(({ swap }) => swap)[0];
    const old = Object.values(TypedCurveTokens)
      .filter(({ address }) => tokenAddress.includes(address))
      .map(({ old }) => old)[0];
    const curveRegistryInstance = new hre.ethers.Contract(exchange.curveRegistry.address, "ICurveRegistry", wallet);
    const tokenAddressInstance = await hre.ethers.getContractAt("ERC20", tokenAddress);
    if (swap === true) {
      if (old === true) {
        let swapInstance = new hre.ethers.Contract(pool, "ICurveSwap", wallet);
        const coin = await swapInstance.coins(0);
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
        if (N_COINS.toString() === "2") {
          await swapInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(wallet.getAddress()), "0"], "1");
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else if (N_COINS.toString() === "3") {
          swapInstance = new hre.ethers.Contract(pool, "ICurveSwap", wallet);
          await swapInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(wallet.getAddress()), 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        }
      } else {
        let swapInstance = new hre.ethers.Contract(pool, "ICurveSwap", wallet);
        const coin = await swapInstance.coins(0);
        const coinInstance = await hre.ethers.getContractAt("ERC20", coin);
        if (coin !== ADDRESS_ETH) {
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
        }
        if (coin === ADDRESS_ETH) {
          swapInstance = new hre.ethers.Contract(pool, "ICurveSwap", wallet);
        }
        const N_COINS = (await curveRegistryInstance.get_n_coins(pool))[1];
        if (N_COINS.toString() === "2") {
          if (coin === ADDRESS_ETH) {
            await swapInstance
              .connect(wallet)
              .add_liquidity(["9500", "0"], "1", getEthValueGasOverrideOptions(hre, "9500"));
            await tokenAddressInstance
              .connect(wallet)
              .transfer(address, await tokenAddressInstance.balanceOf(wallet.getAddress()));
          } else {
            await swapInstance
              .connect(wallet)
              .add_liquidity([await coinInstance.balanceOf(wallet.getAddress()), "0"], "1");
            await tokenAddressInstance.connect(wallet).transfer(address, amount);
          }
        } else if (N_COINS.toString() === "3") {
          swapInstance = new hre.ethers.Contract(pool, "ICurveSwap", wallet);
          await swapInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(wallet.getAddress()), 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        }
      }
    } else {
      let depositInstance;
      let swapPool;
      let coin;
      if (old === true) {
        depositInstance = new hre.ethers.Contract(pool, "ICurveDeposit", wallet);
        swapPool = await depositInstance.curve();
        coin = await depositInstance.underlying_coins(0);
        const coinInstance = await hre.ethers.getContractAt("ERC20", coin);
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            [TypedTokens["WETH"], coin],
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await coinInstance.connect(wallet).approve(pool, await coinInstance.balanceOf(await wallet.getAddress()));
        const N_COINS = (await curveRegistryInstance.get_n_coins(swapPool))[1];
        if (N_COINS.toString() === "2") {
          await depositInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(await wallet.getAddress()), 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else if (N_COINS.toString() === "3") {
          depositInstance = new hre.ethers.Contract(pool, "ICurveDeposit", wallet);
          await depositInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(await wallet.getAddress()), 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else {
          depositInstance = new hre.ethers.Contract(pool, "ICurveDeposit", wallet);
          await depositInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(await wallet.getAddress()), 0, 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        }
      } else {
        depositInstance = new hre.ethers.Contract(pool, "ICurveDeposit", wallet);
        swapPool = await depositInstance.pool();
        coin = await depositInstance.base_coins(0);
        const coinInstance = await hre.ethers.getContractAt("ERC20", coin);
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            [TypedTokens["WETH"], coin],
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await coinInstance.connect(wallet).approve(pool, await coinInstance.balanceOf(await wallet.getAddress()));
        const N_COINS = (await curveRegistryInstance.get_n_coins(swapPool))[1];
        if (N_COINS.toString() === "2") {
          await depositInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(await wallet.getAddress()), 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else if (N_COINS.toString() === "3") {
          depositInstance = new hre.ethers.Contract(pool, "ICurveDeposit", wallet);
          await depositInstance
            .connect(wallet)
            .add_liquidity([await coinInstance.balanceOf(await wallet.getAddress()), 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else {
          depositInstance = new hre.ethers.Contract(pool, "ICurveDeposit", wallet);
          await depositInstance
            .connect(wallet)
            .add_liquidity([0, await coinInstance.balanceOf(await wallet.getAddress()), 0, 0], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        }
      }
    }
  } else if (tokenAddress === TypedTokens["WETH"]) {
    fundAmount = fundAmount.div(BigNumber.from(10).pow(18));
    const wethInstance = new hre.ethers.Contract(TypedTokens["WETH"], "IWETH", wallet);
    await wethInstance.connect(wallet).deposit(getEthValueGasOverrideOptions(hre, fundAmount.toString()));
    await wethInstance.connect(wallet).transfer(toAddress, amountInHex(fundAmount.mul(BigNumber.from(10).pow(18))));
  } else {
    const tokenHolder = Object.keys(TOKEN_HOLDERS).filter(
      holder => getAddress(TypedTokens[holder]) === getAddress(tokenAddress),
    );
    if (tokenHolder.length > 0) {
      await fundWalletFromImpersonatedAccount(hre, tokenAddress, TOKEN_HOLDERS[tokenHolder[0]], fundAmount, address);
    } else {
      const uniswapInstance = new hre.ethers.Contract(exchange.uniswap.address, "IUniswapV2Router02", wallet);
      await uniswapInstance.swapETHForExactTokens(
        amount,
        [TypedTokens["WETH"], tokenAddress],
        address,
        deadlineTimestamp,
        getEthValueGasOverrideOptions(hre, "9500"),
      );
    }
  }
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
