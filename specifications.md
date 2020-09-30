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
| enableTokens           | `address _token`                                                                  | `external`   | N/A               | Owner/Governance/Strategist | enable token in `tokens` mapping.                       |
| disableTokens          | `address _token`                                                                  | external   | N/A               | Owner/Governance/Strategist | disable token from `tokens` mapping.                    |
| enableStrategyProfile  | `uint _strategyProfileId`                                                         | `external`   | N/A               | Owner/Governance/Strategist | enable a new strategy profile using `strategyProfiles`   |
| disableStrategyProfile | `uint _strategyProfileId`                                                         | external   | N/A               | Owner/Governance/Strategist | disable a new strategy profile using `strategyProfiles`  |
| enableStrategy         | `address _token, uint _strategyProfileId, StrategyComponent[] _strategyComponent` | `external`   | N/A | Owner/Governance/Strategist | enable strategies using `tokensToStrategy` mapping.     |
| disableStrategy        | `address _token, uint _strategyProfileId, uint _strategyId`                       | `external`   | N/A               | Owner/Governance/Strategist | disable strategies using `tokensToStrategy` mapping.    |
| enableLiquidityPool    | `address _liquidityPool`                                                          | `external`   | N/A               | Owner/Governance/Strategy   | enable or add new liquidity pool using `liquidityPools` |
| disableLiquidityPool   | `address _liquidityPool`                                                          | `external`   | N/A               | Owner/Governance/Strategy   | disable a liquidity pool using `liquidityPools`         |
| rateLiquidityPool      | `address _liquidityPool, uint _rating`                                            | `external`   | N/A               | Owner/Governance/Strategy   | give rating to liquidty pool                            |
| scoreStrategy | `address _token, uint _strategyProfileId, uint _strategyId, uint _score` | `external` | N/A | Owner/Governance/Strategy | score the strategy  |

### Events

| Event name | Parameters | Description |
|------------|------------|-------------|
| LogToken | `address token, bool enabled` | Logs when token is enabled/disabled |
| LogStrategyProfile | `uint strategyProfileId, bool enabled` | Logs when a strategy is enabled/disabled |
| LogStrategy | `address token, uint strategyProfileId, StrategyComponent[] strategyComponents, uint steps, uint blockNumber, bool enabled` | Logs when a strategy is enabled/disabled |
| LogLiquidityPool | `address liquidityPool, bool enabled` | Logs when a liquidity pool is enabled/disabled |
| LogRateLiquidityPool | `address liquidityPool, uint rate` | Logs when a liquidity pool is rated |
| LogScoreStrategy | `address token, uint strategyProfileId, uint strategyId, uint blockNumber, uint score, StrategyComponent[] strategyComponents` | Log when the strategy is scored |

## `OptyLiquidityPoolInterface.sol`

### functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| deposit | `uint _amount` | `external` | `bool success` | N/A | deploy in to liquidity pool |
| withdraw | `uint _amount` | `external` | `bool success` | N/A | withdraw from liquidity pool |
| claimReward | `address _liquidityPool` | `external`| `bool success` | N/A | claim rewards from liquidity pool |
| balance | `address _holder` | `external` | `uint balance` | N/A | get the balance of LP tokens |

## `OptyFi<strategy-profile-id>XXXPool.sol` where xxx is DAI, USDC etc.

### Interfaces

- [IERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol)

### Contracts
- [ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)

### libraries

- [SafeERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/SafeERC20.sol)
- [SafeMath](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol)

### Variables

| Name                     | Type          | Structure                                                                                                                                     | visibility   | purpose                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| riskManager | `address` | N/A | `public` | the risk manager contract address |

### Functions

## `Strategy.sol`

### Variables

### Functions