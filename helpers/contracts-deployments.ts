import { ESSENTIAL_CONTRACTS as ESSENTIAL_CONTRACTS_DATA, RISK_PROFILES, ADAPTERS } from "./constants";
import { Contract, Signer } from "ethers";
import { CONTRACTS } from "./type";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployContract, executeFunc } from "./helpers";
import { OPTY_STAKING_VAULTS } from "./constants";

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

export async function deployRiskManager(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
  registry: string,
): Promise<Contract> {
  let riskManager = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.RISK_MANAGER, isDeployedOnce, owner, [registry]);

  const riskManagerProxy = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.RISK_MANAGER_PROXY,
    isDeployedOnce,
    owner,
    [registry],
  );

  await executeFunc(riskManagerProxy, owner, "setPendingImplementation(address)", [riskManager.address]);
  await executeFunc(riskManager, owner, "become(address)", [riskManagerProxy.address]);

  riskManager = await hre.ethers.getContractAt(ESSENTIAL_CONTRACTS_DATA.RISK_MANAGER, riskManagerProxy.address, owner);

  return riskManager;
}

export async function deployOptyStakingRateBalancer(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
  registry: string,
): Promise<Contract> {
  let optyStakingRateBalancer = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.OPTY_STAKING_RATE_BALANCER,
    isDeployedOnce,
    owner,
    [registry],
  );

  const optyStakingRateBalancerProxy = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.OPTY_STAKING_RATE_BALANCER_PROXY,
    isDeployedOnce,
    owner,
    [registry],
  );

  await executeFunc(optyStakingRateBalancerProxy, owner, "setPendingImplementation(address)", [
    optyStakingRateBalancer.address,
  ]);
  await executeFunc(optyStakingRateBalancer, owner, "become(address)", [optyStakingRateBalancerProxy.address]);

  optyStakingRateBalancer = await hre.ethers.getContractAt(
    ESSENTIAL_CONTRACTS_DATA.OPTY_STAKING_RATE_BALANCER,
    optyStakingRateBalancerProxy.address,
    owner,
  );

  return optyStakingRateBalancer;
}

export async function deployAndSetupOptyStakingVaults(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
  registry: string,
  opty: string,
  optyStakingRateBalancer: Contract,
  optyDistributor: Contract,
): Promise<CONTRACTS> {
  const optyStakingVaults: CONTRACTS = {};
  for (let i = 0; i < OPTY_STAKING_VAULTS.length; i++) {
    const optyStakingVault = await deployContract(
      hre,
      ESSENTIAL_CONTRACTS_DATA.OPTY_STAKING_VAULT,
      isDeployedOnce,
      owner,
      [registry, opty, OPTY_STAKING_VAULTS[i].lockTime, OPTY_STAKING_VAULTS[i].numberOfDays],
    );

    await executeFunc(optyDistributor, owner, "setStakingVault(address,bool)", [optyStakingVault.address, true]);
    await executeFunc(optyStakingRateBalancer, owner, "setStakingVaultMultipliers(address,uint256)", [
      optyStakingVault.address,
      OPTY_STAKING_VAULTS[i].multiplier,
    ]);

    optyStakingVaults[OPTY_STAKING_VAULTS[i].name] = optyStakingVault;
  }

  await executeFunc(optyStakingRateBalancer, owner, "initialize(address,address,address,address)", [
    optyStakingVaults["optyStakingVault1D"].address,
    optyStakingVaults["optyStakingVault30D"].address,
    optyStakingVaults["optyStakingVault60D"].address,
    optyStakingVaults["optyStakingVault180D"].address,
  ]);

  return optyStakingVaults;
}

export async function deployEssentialContracts(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
): Promise<CONTRACTS> {
  const registry = await deployRegistry(hre, owner, isDeployedOnce);
  const profiles = Object.keys(RISK_PROFILES);
  for (let i = 0; i < profiles.length; i++) {
    try {
      const profile = await registry.getRiskProfile(RISK_PROFILES[profiles[i]].name);
      if (!profile.exists) {
        await executeFunc(registry, owner, "addRiskProfile(string,bool,(uint8,uint8))", [
          RISK_PROFILES[profiles[i]].name,
          RISK_PROFILES[profiles[i]].canBorrow,
          RISK_PROFILES[profiles[i]].poolRating,
        ]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const vaultStepInvestStrategyDefinitionRegistry = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY,
    isDeployedOnce,
    owner,
    [registry.address],
  );

  await executeFunc(registry, owner, "setVaultStepInvestStrategyDefinitionRegistry(address)", [
    vaultStepInvestStrategyDefinitionRegistry.address,
  ]);

  const strategyProvider = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.STRATEGY_PROVIDER,
    isDeployedOnce,
    owner,
    [registry.address],
  );

  await executeFunc(registry, owner, "setStrategyProvider(address)", [strategyProvider.address]);

  const aprOracle = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.APR_ORACLE, isDeployedOnce, owner, [
    registry.address,
  ]);

  await executeFunc(registry, owner, "setAPROracle(address)", [aprOracle.address]);

  const harvestCodeProvider = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.HARVEST_CODE_PROVIDER,
    isDeployedOnce,
    owner,
    [registry.address],
  );

  await executeFunc(registry, owner, "setHarvestCodeProvider(address)", [harvestCodeProvider.address]);

  const riskManager = await deployRiskManager(hre, owner, isDeployedOnce, registry.address);

  await executeFunc(registry, owner, "setRiskManager(address)", [riskManager.address]);

  const strategyManager = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.STRATEGY_MANAGER, isDeployedOnce, owner, [
    registry.address,
  ]);

  await executeFunc(registry, owner, "setStrategyManager(address)", [strategyManager.address]);

  const opty = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.OPTY, isDeployedOnce, owner, [
    registry.address,
    100000000000000,
  ]);

  const optyDistributor = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.OPTY_DISTRIBUTOR, isDeployedOnce, owner, [
    registry.address,
    opty.address,
    1700000000,
  ]);

  await executeFunc(registry, owner, "setOPTYDistributor(address)", [optyDistributor.address]);

  const optyStakingRateBalancer = await deployOptyStakingRateBalancer(hre, owner, isDeployedOnce, registry.address);

  await executeFunc(registry, owner, "setOPTYStakingRateBalancer(address)", [optyStakingRateBalancer.address]);

  await executeFunc(optyStakingRateBalancer, owner, "setStakingVaultOPTYAllocation(uint256)", [10000000000]);

  const optyStakingVaults = await deployAndSetupOptyStakingVaults(
    hre,
    owner,
    isDeployedOnce,
    registry.address,
    opty.address,
    optyStakingRateBalancer,
    optyDistributor,
  );

  const priceOracle = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.PRICE_ORACLE, isDeployedOnce, owner, [
    registry.address,
  ]);

  await executeFunc(registry, owner, "setPriceOracle(address)", [priceOracle.address]);

  const essentialContracts: CONTRACTS = {
    registry,
    vaultStepInvestStrategyDefinitionRegistry,
    strategyProvider,
    strategyManager,
    optyDistributor,
    opty,
    riskManager,
    harvestCodeProvider,
    optyStakingRateBalancer,
    optyStakingVault1D: optyStakingVaults["optyStakingVault1D"],
    optyStakingVault30D: optyStakingVaults["optyStakingVault30D"],
    optyStakingVault60D: optyStakingVaults["optyStakingVault60D"],
    optyStakingVault180D: optyStakingVaults["optyStakingVault180D"],
    priceOracle,
  };

  return essentialContracts;
}

export async function deployAdapterPrerequisites(
  hre: HardhatRuntimeEnvironment,
  owner: Signer,
  isDeployedOnce: boolean,
): Promise<CONTRACTS> {
  const registry = await deployRegistry(hre, owner, isDeployedOnce);

  const harvestCodeProvider = await deployContract(
    hre,
    ESSENTIAL_CONTRACTS_DATA.HARVEST_CODE_PROVIDER,
    isDeployedOnce,
    owner,
    [registry.address],
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

export async function deployVault(
  hre: HardhatRuntimeEnvironment,
  registry: string,
  underlyingToken: string,
  owner: Signer,
  admin: Signer,
  underlyingTokenName: string,
  underlyingTokenSymbol: string,
  riskProfile: string,
  isDeployedOnce: boolean,
): Promise<Contract> {
  let vault = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.VAULT, isDeployedOnce, owner, [
    registry,
    underlyingTokenName,
    underlyingTokenSymbol,
    riskProfile,
  ]);

  const adminAddress = await admin.getAddress();

  const vaultProxy = await deployContract(hre, ESSENTIAL_CONTRACTS_DATA.VAULT_PROXY, isDeployedOnce, owner, [
    adminAddress,
  ]);

  await executeFunc(vaultProxy, admin, "upgradeTo(address)", [vault.address]);

  vault = await hre.ethers.getContractAt(ESSENTIAL_CONTRACTS_DATA.VAULT, vaultProxy.address, owner);

  await executeFunc(vault, owner, "initialize(address,address,string,string,string)", [
    registry,
    underlyingToken,
    underlyingTokenName,
    underlyingTokenSymbol,
    riskProfile,
  ]);

  const registryContract = await hre.ethers.getContractAt(ESSENTIAL_CONTRACTS_DATA.REGISTRY, registry, owner);

  await executeFunc(registryContract, owner, "setUnderlyingAssetHashToRPToVaults(address[],string,address)", [
    [underlyingToken],
    riskProfile,
    vault.address,
  ]);

  return vault;
}
