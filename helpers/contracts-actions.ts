import { RISK_PROFILES, TOKEN_HOLDERS, ADDRESS_ETH } from "./constants";
import { Contract, Signer, BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "ethers/lib/utils";
import Compound from "@compound-finance/compound-js";
import { Provider } from "@compound-finance/compound-js/dist/nodejs/types";
import { STRATEGY_DATA } from "./type";
import { TypedCurveTokens, TypedMultiAssetTokens, TypedTokens } from "./data";
import {
  executeFunc,
  generateStrategyHash,
  generateStrategyStep,
  generateTokenHash,
  getEthValueGasOverrideOptions,
  isAddress,
} from "./helpers";
import { amountInHex } from "./utils";
import exchange from "./data/exchange.json";
import { IUniswapV2Pair, IUniswapV2Router02, IWETH } from "../typechain";

export async function approveLiquidityPoolAndMapAdapter(
  owner: Signer,
  registryContract: Contract,
  adapter: string,
  lqPool: string,
): Promise<void> {
  const { isLiquidityPool } = await registryContract.getLiquidityPool(lqPool);
  if (!isLiquidityPool) {
    try {
      await executeFunc(registryContract as Contract, owner, "approveLiquidityPool(address)", [lqPool]);
      await executeFunc(registryContract, owner, "setLiquidityPoolToAdapter(address,address)", [lqPool, adapter]);
    } catch (error) {
      console.log(`Got error: ${error}`);
    }
  }
}

export async function approveLiquidityPoolAndMapAdapters(
  owner: Signer,
  registryContract: Contract,
  lqPools: string[],
  lqPoolsMapToAdapter: string[][],
): Promise<void> {
  try {
    const approveLpList: string[] = [];
    for (let i = 0; i < lqPools.length; i++) {
      const { isLiquidityPool } = await registryContract.getLiquidityPool(lqPools[i]);
      if (!isLiquidityPool) {
        approveLpList.push(lqPools[i]);
      }
    }
    if (approveLpList.length > 0) {
      await executeFunc(registryContract, owner, "approveLiquidityPool(address[])", [approveLpList]);
    }
    await executeFunc(registryContract, owner, "setLiquidityPoolToAdapter((address,address)[])", [lqPoolsMapToAdapter]);
  } catch (error) {
    console.log(`Got error: ${error}`);
  }
}

export async function approveAndSetTokenHashToToken(
  owner: Signer,
  registryContract: Contract,
  tokenAddress: string,
): Promise<void> {
  try {
    const isApprovedToken = await registryContract.isApprovedToken(tokenAddress);
    if (!isApprovedToken) {
      await executeFunc(registryContract, owner, "approveToken(address)", [tokenAddress]);
    }
    if (!(await isSetTokenHash(registryContract, [tokenAddress]))) {
      await executeFunc(registryContract, owner, "setTokensHashToTokens(address[])", [[tokenAddress]]);
    }
  } catch (error) {
    console.log(`Got error when executing approveAndSetTokenHashToToken : ${error}`);
  }
}

export async function approveAndSetTokenHashToTokens(
  owner: Signer,
  registryContract: Contract,
  tokenAddresses: string[],
  setTokenHashForEach: boolean,
): Promise<void> {
  try {
    const approveTokenLists: string[] = [];
    const setTokenHashLists: string[] = [];
    for (const tokenAddress of tokenAddresses) {
      const isApprovedToken = await registryContract.isApprovedToken(tokenAddress);
      if (!isApprovedToken) {
        approveTokenLists.push(tokenAddress);
      }
      if (setTokenHashForEach) {
        if (!(await isSetTokenHash(registryContract, [tokenAddress]))) {
          setTokenHashLists.push(tokenAddress);
        }
      }
    }
    if (approveTokenLists.length > 0) {
      await executeFunc(registryContract, owner, "approveToken(address[])", [approveTokenLists]);
    }
    if (setTokenHashLists.length > 0) {
      await executeFunc(registryContract, owner, "setTokensHashToTokens(address[][])", [
        setTokenHashLists.map(addr => [addr]),
      ]);
    } else {
      if (!(await isSetTokenHash(registryContract, tokenAddresses))) {
        await executeFunc(registryContract, owner, "setTokensHashToTokens(address[][])", [[tokenAddresses]]);
      }
    }
  } catch (error) {
    console.log(`Got error when executing approveAndSetTokenHashToTokens : ${error}`);
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

export async function setBestStrategy(
  strategy: STRATEGY_DATA[],
  tokenAddress: string,
  vaultStepInvestStrategyDefinitionRegistry: Contract,
  strategyProvider: Contract,
  riskProfile: string,
  isDefault: boolean,
): Promise<string> {
  const strategyHash = generateStrategyHash(strategy, tokenAddress);

  const tokenHash = generateTokenHash([tokenAddress]);

  const strategyDetail = await vaultStepInvestStrategyDefinitionRegistry.getStrategy(strategyHash);

  if (strategyDetail[1].length === 0) {
    await setStrategy(strategy, [tokenAddress], vaultStepInvestStrategyDefinitionRegistry);
  }

  if (isDefault) {
    await strategyProvider.setBestDefaultStrategy(riskProfile.toUpperCase(), tokenHash, strategyHash);
  } else {
    await strategyProvider.setBestStrategy(riskProfile.toUpperCase(), tokenHash, strategyHash);
  }
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
  const ValidatedPairTokens = Object.values(TypedMultiAssetTokens)
    .map(({ address }) => address)
    .map(t => getAddress(t));
  const ValidatedCurveTokens = Object.values(TypedCurveTokens)
    .map(({ address }) => address)
    .map(t => getAddress(t));
  const uniswapInstance = <IUniswapV2Router02>(
    await hre.ethers.getContractAt("IUniswapV2Router02", exchange.uniswap.address)
  );
  const sushiswapInstance = <IUniswapV2Router02>(
    await hre.ethers.getContractAt("IUniswapV2Router02", exchange.sushiswap.address)
  );
  if (ValidatedPairTokens.includes(getAddress(tokenAddress))) {
    const pairInstance = <IUniswapV2Pair>await hre.ethers.getContractAt("IUniswapV2Pair", tokenAddress);
    const TOKEN0 = await pairInstance.token0();
    const TOKEN1 = await pairInstance.token1();
    const token0Instance = await hre.ethers.getContractAt("ERC20", TOKEN0);
    const token1Instance = await hre.ethers.getContractAt("ERC20", TOKEN1);
    let token0Path = Object.values(TypedMultiAssetTokens)
      .filter(({ address }) => tokenAddress.includes(address))
      .map(({ path0 }) => path0)[0];
    let token1Path = Object.values(TypedMultiAssetTokens)
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
            token0Path as string[],
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
            token1Path as string[],
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
            token0Path as string[],
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await sushiswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token1Path as string[],
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
            token0Path as string[],
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
            token1Path as string[],
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
            token0Path as string[],
            await wallet.getAddress(),
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );
        await uniswapInstance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            token1Path as string[],
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
            await wallet.getAddress(),
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
              await wallet.getAddress(),
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
    const wethInstance = <IWETH>await hre.ethers.getContractAt("IWETH", TypedTokens["WETH"]);
    await wethInstance.connect(wallet).deposit(getEthValueGasOverrideOptions(hre, fundAmount.toString()));
    await wethInstance
      .connect(wallet)
      .transfer(address as string, amountInHex(fundAmount.mul(BigNumber.from(10).pow(18))));
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

export async function isSetTokenHash(registryContract: Contract, tokenAddresses: string[]): Promise<boolean> {
  const tokensHash = generateTokenHash(tokenAddresses);
  const tokenAddressesInContract = await registryContract.getTokensHashToTokenList(tokensHash);
  if (tokenAddressesInContract.length === 0) {
    return false;
  }
  for (let i = 0; i < tokenAddresses.length; i++) {
    if (
      isAddress(tokenAddressesInContract[i]) &&
      getAddress(tokenAddressesInContract[i]) !== getAddress(tokenAddresses[i])
    ) {
      return false;
    }
  }
  return true;
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
