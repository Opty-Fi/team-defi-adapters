import { default as DefiPools } from "./defiPools.json";
import { default as AdapterStrategies } from "./adapter-with-strategies.json";
import { default as Strategies } from "./strategies.json";
import { default as CurveDepositPoolGauges } from "./curve-deposit-pool-gauges.json";
import { default as CurveDepositPools } from "./curve-deposit-pools.json";
import { default as CurveSwapPools } from "./curve-swap-pools.json";
import { default as Tokens } from "./tokens.json";
import { default as BtcTokens } from "./btc_tokens.json";
import { DEFI_POOLS_DATA, ADAPTER_WITH_STRATEGIES_DATA, STRATEGY, DATA_OBJECT } from "../type";

export const TypedDefiPools = DefiPools as DEFI_POOLS_DATA;
export const TypedAdapterStrategies = AdapterStrategies as ADAPTER_WITH_STRATEGIES_DATA;
export const TypedStrategies = Strategies as STRATEGY[];
export const TypedCurveDepositPoolGauges = CurveDepositPoolGauges as DATA_OBJECT;
export const TypedCurveDepositPools = CurveDepositPools as DATA_OBJECT;
export const TypedCurveSwapPools = CurveSwapPools as DATA_OBJECT;
export const TypedTokens = Tokens as DATA_OBJECT;

export const TypedDefaultStrategies: { [key: string]: STRATEGY } = {
  DAI: {
    strategyName: "DAI-deposit-CURVE-ypaxCrv",
    token: "DAI",
    strategy: [
      {
        contract: "0xA50cCc70b6a011CffDdf45057E39679379187287",
        outputTokenSymbol: "ypaxCrv",
        outputToken: "0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8",
        isBorrow: false,
      },
    ],
  },
  USDC: {
    strategyName: "USDC-deposit-AAVE-aUSDC",
    token: "USDC",
    strategy: [
      {
        contract: "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8",
        outputTokenSymbol: "aUSDC",
        outputToken: "0x9bA00D6856a4eDF4665BcA2C2309936572473B7E",
        isBorrow: false,
      },
    ],
  },
  USDT: {
    strategyName: "USDT-deposit-AAVE-aUSDT",
    token: "USDT",
    strategy: [
      {
        contract: "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8",
        outputTokenSymbol: "aUSDT",
        outputToken: "0x71fc860F7D3A592A4a98740e39dB31d25db65ae8",
        isBorrow: false,
      },
    ],
  },
};

export const TypedBtcTokens = BtcTokens as DATA_OBJECT;
