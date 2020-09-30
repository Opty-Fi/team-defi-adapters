# Opty-Fi-Earn

## `OptyFiRegistry.sol`

### Variables

| Name                     | Type          | Structure                                                                                                                                     | visibility   | purpose                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| tokens                   | `mapping`     | `mapping(address tokenContract => bool enabled)`                                                                                              | `public`     | stores the tokens supported by Opty.Fi's Earn platform                 |
| StrategyComponent        | `struct`      | `{address token; address creditPool; address borrowToken; address liquidityPool; address strategyContract;}`                                  | `public`     | store the strategy component                                           |
| Strategy                 | `struct`      | `{mapping(uint strategyComponentIndex => StrategyComponent) strategyComponents; uint steps; uint8 score; uint256 blockNumber; bool enabled;}` | `public`     | store the sequence of strategy components with and its score           |
| tokensToStrategy         | `mapping`     | `mapping(address token => mapping(uint8 strategyProfileId => mapping(uint strategyId => Strategy)))`                                 | `public`     | store the lookup for supported token and its corresponding strategies. |
| poolToStrategyIdCounter  | `mapping`     | `mapping(address token => mapping(uint strategyProfileId => uint strategyId))`                                                                | `public`     | store the count of strategies per StrategyProfile                      |
| ~~t1~~                   | ~~`mapping`~~ | ~~`mapping(address t1Pool => bool enabled)`~~                                                                                                 | ~~`public`~~ | ~~list of T1 protocols~~                                               |
| ~~t2~~                   | ~~`mapping`~~ | ~~`mapping(address t1Pool => bool enabled)`~~                                                                                                 | ~~`public`~~ | ~~list of T2 protocols~~                                               |
| ~~t3~~                   | ~~`mapping`~~ | ~~`mapping(address t1Pool => bool enabled)`~~                                                                                                 | ~~`public`~~ | ~~list of T3 protocols~~                                               |
| liquidityPools           | `mapping`     | `mapping(address liquidityPool => bool enabled)`                                                                                              | `public`     | stores the liquidity pools                                             |
| liquidityPoolRating      | `mapping`     | `mapping(address liquidityPool => uint rating)`                                                                                               | `public`     | store the liquidity pool ratings                                       |
| ~~StrategyProfile~~      | ~~`enum`~~    | ~~`{BASIC,ADVANCED,ADVANCED_PLUS}`~~                                                                                                          | ~~`public`~~ | ~~possible strategy risk profiles~~                                    |
| strategyProfiles         | `mapping`     | `mapping(uint strategyProfileId => bool enable)`                                                                                              | `public`     | store all strategy profiles                                            |
| strategyProfileIdCounter | `mapping`     | `mapping(address token => uint strategyProfileId)`                                                                                              | `public`     | store all strategy profiles                                            |

### Functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| enableTokens           | `address _token`                                                                  | external   | N/A               | Owner/Governance/Strategist | enable token in `tokens` mapping.                       |
| disableTokens          | `address _token`                                                                  | external   | N/A               | Owner/Governance/Strategist | disable token from `tokens` mapping.                    |
| enableStrategyProfile  | `uint _strategyProfileId`                                                         | external   | N/A               | Owner/Governance/Strategist | enable a new strategy profile using `strategyProfile`   |
| disableStrategyProfile | `uint _strategyProfileId`                                                         | external   | N/A               | Owner/Governance/Strategist | disable a new strategy profile using `strategyProfile`  |
| enableStrategy         | `address _token, uint _strategyProfileId, StrategyComponent[] _strategyComponent` | external   | `uint strategyId` | Owner/Governance/Strategist | enable strategies using `tokensToStrategy` mapping.     |
| disableStrategy        | `address _token, uint _strategyProfileId, uint _strategyId`                       | external   | N/A               | Owner/Governance/Strategist | disable strategies using `tokensToStrategy` mapping.    |
| enableLiquidityPool    | `address _liquidityPool`                                                          | external   | N/A               | Owner/Governance/Strategy   | enable or add new liquidity pool using `liquidityPools` |
| disableLiquidityPool   | `address _liquidityPool`                                                          | external   | N/A               | Owner/Governance/Strategy   | disable a liquidity pool using `liquidityPools`         |
| rateLiquidityPool      | `address _liquidityPool, uint _rating`                                            | external   | N/A               | Owner/Governance/Strategy   | give rating to liquidty pool                            |

## `OptyLiquidityPoolInterface.sol`

### functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| deposit | `uint _amount` | `external` | `bool success` | N/A | deploy in to liquidity pool |
| withdraw | `uint _amount` | `external` | `bool success` | N/A | withdraw from liquidity pool |
| claimReward | `address _liquidityPool` | `external`| `bool success` | N/A | claim rewards from liquidity pool |
| balance | `address _holder` | `external` | `uint balance` | N/A | get the balance of LP tokens |

## `OptyFi<strategy-profile-id>XXXPool.sol` where xxx is DAI, USDC etc.

### Variables

| Name                     | Type          | Structure                                                                                                                                     | visibility   | purpose                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
|decimals| `uint` | N/A | `public` | e.g. 1e18|
|symbol| `string` | N/A | `public` | e.g. op0dai|
|name| `string` | N/A | `public` | e.g. opty-fi-basic-dai|
| totalSupply | `uint` | N/A | `public` |  |

### Functions

## `Strategy.sol`

### Variables

### Functions