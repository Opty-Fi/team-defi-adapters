import { Contract } from "ethers";

export type ESSENTIAL_CONTRACTS = {
  registry: Contract;
  investStrategyRegistry: Contract;
  strategyProvider: Contract;
  harvestCodeProvider: Contract;
  riskManager: Contract;
  strategyManager: Contract;
  opty: Contract;
  optyDistributor: Contract;
  priceOracle: Contract;
};

export type CONTRACTS = {
  [name: string]: Contract;
};

export type DATA_OBJECT = {
  [name: string]: string;
};

export type REWARD_TOKEN_DATA_OBJECT = {
  [name: string]: {
    [name: string]: string | boolean;
  };
};

export type STRATEGY = {
  strategyName: string;
  token: string;
  strategy: STRATEGY_DATA[];
};

export type STRATEGY_DATA = {
  contract: string;
  outputTokenSymbol?: string;
  outputToken: string;
  isBorrow: boolean;
};

export type DEFI_POOLS_DATA = {
  [key: string]: {
    [name: string]: {
      pool: string;
      lpToken: string;
      tokens: string[];
      gauge?: string;
      stakingVault?: string;
      pid?: string;
      deprecated?: boolean;
      swap?: string
    };
  };
};

export type ADAPTER_WITH_STRATEGIES_DATA = {
  [key: string]: STRATEGY[];
};

export type MULTI_ASSET_TOKEN_DATA = {
  [token: string]: {
    address: string;
    path0?: string[];
    path1?: string[];
  };
};

export type CURVE_TOKEN_DATA = {
  [token: string]: {
    address: string;
    pool: string;
    swap?: boolean;
    old?: boolean;
  };
};

export type SUPPORTED_TOKENS_DATA = {
  [name: string]: {
    address: string;
    pair: boolean;
  };
};
