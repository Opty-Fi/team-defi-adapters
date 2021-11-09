import { default as DefiPools } from "./defiPools.json";
import { default as AdapterStrategies } from "./adapter-with-strategies.json";
import { default as Tokens } from "./plain_tokens.json";
import { default as PairTokens } from "./multi_asset_tokens.json";
import { default as CurveTokens } from "./curve_tokens.json";
import { default as Contracts } from "./contracts.json";
import { default as TokenHolders } from "./token_holders.json";
import { default as EOA } from "./eoa.json";

import {
  DEFI_POOLS_DATA,
  ADAPTER_WITH_STRATEGIES_DATA,
  DATA_OBJECT,
  MULTI_ASSET_TOKEN_DATA,
  CURVE_TOKEN_DATA,
} from "../type";

export const TypedDefiPools = DefiPools as DEFI_POOLS_DATA;
export const TypedAdapterStrategies = AdapterStrategies as ADAPTER_WITH_STRATEGIES_DATA;
export const TypedTokens = Tokens as DATA_OBJECT;
export const TypedMultiAssetTokens = PairTokens as MULTI_ASSET_TOKEN_DATA;
export const TypedCurveTokens = CurveTokens as CURVE_TOKEN_DATA;
export const TypedContracts = Contracts as DATA_OBJECT;
export const TypedTokenHolders = TokenHolders as DATA_OBJECT;
export const TypedEOA = EOA as DATA_OBJECT;
