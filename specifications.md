# Opty-Fi-Earn

## `OptyFiRegistry.sol`

### Variables

| Name | Type | Structure | visibility | purpose |
|-------|-----|-----------|------------|---------|
| supportedTokens | `address` | `address[]` | `public` | stores the tokens supported by Opty.Fi's Earn platform |
| StrategyComponent | `struct` | `{address underlyingPool; address creditProvider; address borrowToken; address liquidityPool; address liquidityPoolToken; address strategyContract;}` | `public` | store the strategy component|
| Strategy | `struct`| `{StrategyComponent[] strategyComponents; uint8 score, uint256 blockNumber;}` | `public` | store the sequence of strategy components with and its score|
| supportedTokensToStrategy | `mapping` | `mapping(address supportedToken => mapping(uint8 poolId => Strategy))` | `public` | store the lookup for supported token and its corresponding strategies. |
| t1Pools | `address` | `address[]` | `public` | list of T1 pools |
| t2Pools | `address` | `address[]` | `public` | list of T2 pools |
| t3Pools | `address` | `address[]` | `public` | list of T3 pools |

### Functions

| Name | Input Parameters | Return Parameters | Called By | Description |
-------|------------------|-------------------|-----------|-------------|
addSupportedTokens | `address` | N/A | Owner | add token that Opty.Fi's Earn protocol supports to `supportedTokens` list.|
deleteSupportedTokens | `address` | N/A | Owner | add token that Opty.Fi's Earn protocol supports to `supportedTokens` list.| 


```js
struct supportedToken {
    address tokenAddr;
    bool disabled;
}
// or
mapping(address => bool) supportedTokens
```



