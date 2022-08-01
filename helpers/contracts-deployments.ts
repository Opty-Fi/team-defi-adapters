import { ESSENTIAL_CONTRACTS as ESSENTIAL_CONTRACTS_DATA } from "./constants/essential-contracts-name";
import { ADAPTERS } from "./constants/adapters";
import { Contract, Signer } from "ethers";
import { CONTRACTS } from "./type";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployContract, executeFunc } from "./helpers";
import tokens from "./data/plain_tokens.json";

export async function deployRegistry(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
): Promise<Contract> {
  let registry = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.REGISTRY, isDeployedOnce, owner, []);
  const registryProxy = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.REGISTRY_PROXY, isDeployedOnce, owner, []);
  await executeFunc(registryProxy, owner, "setPendingImplementation(address)", [registry.address]);
  await executeFunc(registry, owner, "become(address)", [registryProxy.address]);
  registry = await hre.ethers.getContractAt(ESSENTIAL_CONTRACTS_DATA.REGISTRY, registryProxy.address, owner);
  return registry;
}

export async function deployEssentialContracts(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
): Promise<CONTRACTS> {
  const registry = await deployRegistry(hre, owner, isDeployedOnce);

  const optyfi_oracle = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.OPTYFI_ORACLE, isDeployedOnce, owner, [
    "86400",
    "86400",
  ]);

  await executeFunc(optyfi_oracle, owner, "setChainlinkPriceFeed((address,address,address)[])", [
    [
      { tokenA: tokens.CRV, tokenB: tokens.WETH, priceFeed: "0x8a12Be339B0cD1829b91Adc01977caa5E9ac121e" },
      { tokenA: tokens.COMP, tokenB: tokens.WETH, priceFeed: "0x1B39Ee86Ec5979ba5C322b826B3ECb8C79991699" },
      { tokenA: tokens.SUSHI, tokenB: tokens.WETH, priceFeed: "0xe572CeF69f43c2E488b33924AF04BDacE19079cf" },
      { tokenA: tokens.CREAM, tokenB: tokens.WETH, priceFeed: "0x82597CFE6af8baad7c0d441AA82cbC3b51759607" },
      { tokenA: tokens.CRV, tokenB: tokens.USDC, priceFeed: "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f" },
      { tokenA: tokens.COMP, tokenB: tokens.USDC, priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5" },
      { tokenA: tokens.SUSHI, tokenB: tokens.USDC, priceFeed: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7" },
      { tokenA: tokens.CRV, tokenB: tokens.DAI, priceFeed: "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f" },
      { tokenA: tokens.COMP, tokenB: tokens.DAI, priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5" },
      { tokenA: tokens.SUSHI, tokenB: tokens.DAI, priceFeed: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7" },
      { tokenA: tokens.CRV, tokenB: tokens.USDT, priceFeed: "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f" },
      { tokenA: tokens.COMP, tokenB: tokens.USDT, priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5" },
      { tokenA: tokens.SUSHI, tokenB: tokens.USDT, priceFeed: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7" },
    ],
  ]);

  const harvestCodeProvider = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.HARVEST_CODE_PROVIDER,
    isDeployedOnce,
    owner,
    [registry.address, optyfi_oracle.address],
  );
  await executeFunc(registry, owner, "setHarvestCodeProvider(address)", [harvestCodeProvider.address]);

  const essentialContracts: CONTRACTS = {
    registry,
    harvestCodeProvider,
  };

  return essentialContracts;
}

export async function deployAdapterPrerequisites(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
): Promise<CONTRACTS> {
  const registry = await deployRegistry(hre, owner, isDeployedOnce);

  const optyfi_oracle = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.OPTYFI_ORACLE, isDeployedOnce, owner, [
    "86400",
    "86400",
  ]);

  await executeFunc(optyfi_oracle, owner, "setChainlinkPriceFeed((address,address,address)[])", [
    [
      { tokenA: tokens.WETH, tokenB: tokens.USDC, priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" },
      { tokenA: tokens.CRV, tokenB: tokens.WETH, priceFeed: "0x8a12Be339B0cD1829b91Adc01977caa5E9ac121e" },
      { tokenA: tokens.COMP, tokenB: tokens.WETH, priceFeed: "0x1B39Ee86Ec5979ba5C322b826B3ECb8C79991699" },
      { tokenA: tokens.SUSHI, tokenB: tokens.WETH, priceFeed: "0xe572CeF69f43c2E488b33924AF04BDacE19079cf" },
      { tokenA: tokens.CREAM, tokenB: tokens.WETH, priceFeed: "0x82597CFE6af8baad7c0d441AA82cbC3b51759607" },
      { tokenA: tokens.CRV, tokenB: tokens.USDC, priceFeed: "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f" },
      { tokenA: tokens.COMP, tokenB: tokens.USDC, priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5" },
      { tokenA: tokens.SUSHI, tokenB: tokens.USDC, priceFeed: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7" },
      { tokenA: tokens.CRV, tokenB: tokens.DAI, priceFeed: "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f" },
      { tokenA: tokens.COMP, tokenB: tokens.DAI, priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5" },
      { tokenA: tokens.SUSHI, tokenB: tokens.DAI, priceFeed: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7" },
      { tokenA: tokens.CRV, tokenB: tokens.USDT, priceFeed: "0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f" },
      { tokenA: tokens.COMP, tokenB: tokens.USDT, priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5" },
      { tokenA: tokens.SUSHI, tokenB: tokens.USDT, priceFeed: "0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7" },
    ],
  ]);

  const harvestCodeProvider = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.HARVEST_CODE_PROVIDER,
    isDeployedOnce,
    owner,
    [registry.address, optyfi_oracle.address],
  );

  await executeFunc(registry, owner, "setHarvestCodeProvider(address)", [harvestCodeProvider.address]);

  const adapterPrerequisites: CONTRACTS = {
    registry,
    harvestCodeProvider,
  };

  return adapterPrerequisites;
}

export async function deployAdapter(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  adapterName: string,
  registryAddr: string,
  isDeployedOnce: boolean,
): Promise<Contract> {
  const contract: Contract = await deployContract(hre, adapterName, isDeployedOnce, owner, [registryAddr]);
  return contract;
}

export async function deployAdapters(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  registryAddr: string,
  isDeployedOnce: boolean,
): Promise<CONTRACTS> {
  const data: CONTRACTS = {};
  for (const adapter of ADAPTERS) {
    try {
      data[adapter] = await deployAdapter(hre, owner, adapter, registryAddr, isDeployedOnce);
    } catch (error) {
      console.log(adapter, error);
    }
  }
  return data;
}
