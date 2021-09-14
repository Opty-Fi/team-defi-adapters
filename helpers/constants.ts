import { DATA_OBJECT, REWARD_TOKEN_DATA_OBJECT, RISK_PROFILE_DATA, OPTY_STAKING_VAULT } from "./type";
import { TypedTokens } from "./data";
export const ESSENTIAL_CONTRACTS: DATA_OBJECT = {
  REGISTRY: "Registry",
  REGISTRY_PROXY: "RegistryProxy",
  VAULT_STEP_INVEST_STRATEGY_DEFINITION_REGISTRY: "VaultStepInvestStrategyDefinitionRegistry",
  STRATEGY_MANAGER: "StrategyManager",
  OPTY: "OPTY",
  OPTY_DISTRIBUTOR: "OPTYDistributor",
  RISK_MANAGER: "RiskManager",
  STRATEGY_PROVIDER: "StrategyProvider",
  HARVEST_CODE_PROVIDER: "HarvestCodeProvider",
  VAULT_PROXY: "InitializableImmutableAdminUpgradeabilityProxy",
  VAULT: "Vault",
  RISK_MANAGER_PROXY: "RiskManagerProxy",
  PRICE_ORACLE: "PriceOracle",
  OPTY_STAKING_VAULT: "OPTYStakingVault",
  OPTY_STAKING_RATE_BALANCER: "OPTYStakingRateBalancer",
  OPTY_STAKING_RATE_BALANCER_PROXY: "OPTYStakingRateBalancerProxy",
  APR_ORACLE: "APROracle",
  ODEFI_VAULT_BOOSTER: "ODEFIVaultBooster",
  ERC20: "ERC20",
};

export const AAVE_V1_ADAPTER_NAME: string = "AaveV1Adapter";
export const AAVE_V2_ADAPTER_NAME: string = "AaveV2Adapter";
export const COMPOUND_ADAPTER_NAME: string = "CompoundAdapter";
export const CREAM_ADAPTER_NAME: string = "CreamAdapter";
export const CURVE_DEPOSIT_POOL_ADAPTER_NAME: string = "CurveDepositPoolAdapter";
export const CURVE_SWAP_POOL_ADAPTER_NAME: string = "CurveSwapPoolAdapter";
export const DYDX_ADAPTER_NAME = "DyDxAdapter";
export const DFORCE_ADAPTER_NAME = "DForceAdapter";
export const FULCRUM_ADAPTER_NAME = "FulcrumAdapter";
export const HARVEST_ADAPTER_NAME = "HarvestAdapter";
export const YVAULT_ADAPTER_NAME = "YVaultAdapter";
export const SUSHISWAP_ADAPTER_NAME = "SushiswapAdapter";

export const ADAPTER = [
  AAVE_V1_ADAPTER_NAME,
  AAVE_V2_ADAPTER_NAME,
  COMPOUND_ADAPTER_NAME,
  CREAM_ADAPTER_NAME,
  CURVE_DEPOSIT_POOL_ADAPTER_NAME,
  CURVE_SWAP_POOL_ADAPTER_NAME,
  DYDX_ADAPTER_NAME,
  DFORCE_ADAPTER_NAME,
  FULCRUM_ADAPTER_NAME,
  HARVEST_ADAPTER_NAME,
  YVAULT_ADAPTER_NAME,
  SUSHISWAP_ADAPTER_NAME,
];

export const TOKENS: DATA_OBJECT = {
  DAI: TypedTokens["DAI"],
  USDC: TypedTokens["USDC"],
  USDT: TypedTokens["USDT"],
  WBTC: TypedTokens["WBTC"],
  WETH: TypedTokens["WETH"],
  CHI: TypedTokens["CHI"],
  SLP_WETH_USDC: TypedTokens["SLP_WETH_USDC"],
};

export const REWARD_TOKENS: REWARD_TOKEN_DATA_OBJECT = {
  CompoundAdapter: {
    tokenName: "COMP",
    tokenAddress: TypedTokens["COMP"],
    distributionActive: true,
  },
  CurveAdapter: {
    tokenName: "CRV",
    tokenAddress: TypedTokens["CRV"],
    distributionActive: true,
  },
  DForceAdapter: {
    tokenName: "DF",
    tokenAddress: TypedTokens["DF"],
    distributionActive: false,
  },
  HarvestAdapter: {
    tokenName: "FARM",
    tokenAddress: TypedTokens["FARM"],
    distributionActive: true,
  },
  CreamAdapter: {
    tokenName: "CREAM",
    tokenAddress: TypedTokens["CREAM"],
    distributionActive: false,
  },
  SushiswapAdapter: {
    tokenName: "SUSHI",
    tokenAddress: TypedTokens["SUSHI"],
    distributionActive: true,
  },
};

export const TESTING_CONTRACTS: DATA_OBJECT = {
  TESTING_EMERGENCY_BRAKE: "TestEmergencyBrake",
  TEST_DUMMY_TOKEN: "TestDummyToken",
  TEST_DUMMY_TOKEN_TRANSFER_FEE: "TestDummyTokenTransferFee",
  TEST_DUMMY_EMPTY_CONTRACT: "TestDummyEmptyContract",
};

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const ADDRESS_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const RISK_PROFILES: RISK_PROFILE_DATA = {
  RP0: {
    name: "RP0",
    canBorrow: false,
    poolRating: [0, 0],
  },
  RP1: {
    name: "RP1",
    canBorrow: false,
    poolRating: [0, 10],
  },
  RP2: {
    name: "RP2",
    canBorrow: true,
    poolRating: [0, 20],
  },
  RP3: {
    name: "RP3",
    canBorrow: true,
    poolRating: [0, 30],
  },
};

export const TESTING_DEPLOYMENT_ONCE = false; // accept deploy contracts once for testing

export const OPTY_STAKING_VAULTS: OPTY_STAKING_VAULT[] = [
  {
    name: "optyStakingVault1D",
    numberOfDays: "1D",
    lockTime: 86400,
    multiplier: 10000,
  },
  {
    name: "optyStakingVault30D",
    numberOfDays: "30D",
    lockTime: 2592000,
    multiplier: 12000,
  },
  {
    name: "optyStakingVault60D",
    numberOfDays: "60D",
    lockTime: 5184000,
    multiplier: 15000,
  },
  {
    name: "optyStakingVault180D",
    numberOfDays: "180D",
    lockTime: 15552000,
    multiplier: 20000,
  },
];

export enum MAX_DEPOSIT_MODE {
  number,
  pct,
}

export const CONTRACT_ADDRESSES: DATA_OBJECT = {
  COMPOUND_COMPTROLLER: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
};
