import { Contract, Signer, BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "ethers/lib/utils";
import Compound from "@compound-finance/compound-js";
import { Provider } from "@compound-finance/compound-js/dist/nodejs/types";
import { TypedCurveTokens, TypedMultiAssetTokens, TypedTokens } from "./data";
import { getEthValueGasOverrideOptions } from "./helpers";
import { amountInHex } from "./utils";
import { TOKEN_HOLDERS, CONTRACT_ADDRESSES, HARVEST_GOVERNANCE } from "./constants";

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
  const ValidatedPairTokens = Object.values(TypedMultiAssetTokens).map(({ address }) => getAddress(address));
  const ValidatedCurveTokens = Object.values(TypedCurveTokens).map(({ address }) => getAddress(address));
  const uniswapV2Router02Instance = await hre.ethers.getContractAt(
    "IUniswapV2Router02",
    CONTRACT_ADDRESSES.UNISWAPV2_ROUTER,
  );
  const sushiswapRouterInstance = await hre.ethers.getContractAt(
    "IUniswapV2Router02",
    CONTRACT_ADDRESSES.SUSHISWAP_ROUTER,
  );
  const tokenInstance = await hre.ethers.getContractAt("ERC20", tokenAddress);
  const walletAddress = await wallet.getAddress();
  try {
    if (ValidatedPairTokens.includes(getAddress(tokenAddress))) {
      const pairInstance = await hre.ethers.getContractAt("IUniswapV2Pair", tokenAddress);
      const pairSymbol = await pairInstance.symbol();
      if (["SLP", "UNI-V2"].includes(pairSymbol)) {
        const TOKEN0 = await pairInstance.token0();
        const TOKEN1 = await pairInstance.token1();
        let token0Path: string[] = [],
          token1Path: string[] = [];
        for (let i = 0; i < Object.values(TypedMultiAssetTokens).length; i++) {
          const value = Object.values(TypedMultiAssetTokens)[i];
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
          "IUniswapV2Router02",
          pairSymbol === "SLP" ? CONTRACT_ADDRESSES.SUSHISWAP_ROUTER : CONTRACT_ADDRESSES.UNISWAP_V2_ROUTER,
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
        const curveRegistryInstance = await hre.ethers.getContractAt(
          "ICurveRegistry",
          CONTRACT_ADDRESSES.CURVE_REGISTRY,
        );
        const tokenAddressInstance = await hre.ethers.getContractAt("ERC20", tokenAddress);
        const instance = await hre.ethers.getContractAt(swap ? "ICurveSwap" : "ICurveDeposit", pool);
        const coin = swap
          ? await instance.coins(0)
          : old
          ? await instance.underlying_coins(0)
          : await instance.base_coins(0);
        const coinInstance = await hre.ethers.getContractAt("ERC20", coin);
        await uniswapV2Router02Instance
          .connect(wallet)
          .swapExactETHForTokens(
            1,
            [TypedTokens["WETH"], coin],
            walletAddress,
            deadlineTimestamp,
            getEthValueGasOverrideOptions(hre, "9500"),
          );

        await coinInstance.connect(wallet).approve(pool, await coinInstance.balanceOf(walletAddress));
        const N_COINS = (
          await curveRegistryInstance.get_n_coins(swap ? pool : old ? await instance.curve() : await instance.pool())
        )[1];

        if (N_COINS.toString() === "2") {
          await instance
            .connect(wallet)
            ["add_liquidity(uint256[2],uint256)"]([await coinInstance.balanceOf(walletAddress), "0"], "1");
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else if (N_COINS.toString() === "3") {
          await instance
            .connect(wallet)
            ["add_liquidity(uint256[3],uint256)"]([await coinInstance.balanceOf(walletAddress), "0", "0"], 1);
          await tokenAddressInstance.connect(wallet).transfer(address, amount);
        } else if (N_COINS.toString() === "4") {
          if (old) {
            await instance
              .connect(wallet)
              ["add_liquidity(uint256[4],uint256)"]([await coinInstance.balanceOf(walletAddress), 0, 0, 0], 1);
            await tokenAddressInstance.connect(wallet).transfer(address, amount);
          } else {
            await instance
              .connect(wallet)
              ["add_liquidity(uint256[4],uint256)"]([0, await coinInstance.balanceOf(walletAddress), 0, 0], 1);
            await tokenAddressInstance.connect(wallet).transfer(address, amount);
          }
        } else if (getAddress(coin) === getAddress(TypedTokens.ETH)) {
          await instance
            .connect(wallet)
            ["add_liquidity(uint256[2],uint256)"](["9500", "0"], "1", getEthValueGasOverrideOptions(hre, "9500"));
          await tokenAddressInstance
            .connect(wallet)
            .transfer(address, await tokenAddressInstance.balanceOf(walletAddress));
        }
      }
    } else if (getAddress(tokenAddress) === getAddress(TypedTokens["WETH"])) {
      const wEthInstance = await hre.ethers.getContractAt("IWETH", TypedTokens["WETH"]);
      //  Funding user's wallet with WETH tokens
      await wEthInstance.deposit({ value: amount });
      await wEthInstance.transfer(address, amount);
    } else if (getAddress(tokenAddress) === getAddress(TypedTokens["YWETH"])) {
      const yEthInstance = await hre.ethers.getContractAt("IYWETH", TypedTokens["YWETH"]);
      //  Funding user's wallet with WETH tokens
      await yEthInstance.depositETH({ value: amount });
      const balance = await yEthInstance.balanceOf(await wallet.getAddress());
      await yEthInstance.transfer(address, balance);
    } else {
      try {
        await uniswapV2Router02Instance.swapETHForExactTokens(
          amount,
          [TypedTokens["WETH"], tokenAddress],
          address,
          deadlineTimestamp,
          getEthValueGasOverrideOptions(hre, "9500"),
        );
      } catch (error) {
        await sushiswapRouterInstance.swapETHForExactTokens(
          amount,
          [TypedTokens["WETH"], tokenAddress],
          address,
          deadlineTimestamp,
          getEthValueGasOverrideOptions(hre, "9500"),
        );
      }
    }
  } catch (error) {
    const tokenHolder = Object.keys(TOKEN_HOLDERS).filter(
      holder => getAddress(TypedTokens[holder]) === getAddress(tokenAddress),
    );
    if (tokenHolder.length > 0) {
      await fundWalletFromImpersonatedAccount(hre, tokenAddress, TOKEN_HOLDERS[tokenHolder[0]], fundAmount, address);
    } else {
      throw error;
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

export async function addWhiteListForHarvest(
  hre: HardhatRuntimeEnvironment,
  contractAddress: string,
  admin: Signer,
): Promise<void> {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [HARVEST_GOVERNANCE],
  });
  const harvestController = await hre.ethers.getContractAt(
    "IHarvestController",
    CONTRACT_ADDRESSES.HARVEST_CONTROLLER,
    await hre.ethers.getSigner(HARVEST_GOVERNANCE),
  );
  await admin.sendTransaction({
    to: HARVEST_GOVERNANCE,
    value: hre.ethers.utils.parseEther("1000"),
  });
  await harvestController.addToWhitelist(contractAddress);
  await harvestController.addCodeToWhitelist(contractAddress);
}
