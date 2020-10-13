# Opty-Fi-Earn

## `OptyRegistry.sol`

### Libraries

- [Addresses.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol)

### Variables

| Name                     | Type          | Structure                                                                                                                                     | visibility   | purpose                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| governance | `address` | N/A | `public` | Stores the address of the governance |
| strategist | `address` | N/A | `public` | Stores the address of the strategist |
| tokens                   | `mapping`     | `mapping(address tokenContract => bool enabled)`                                                                                              | `public`     | stores the tokens supported by Opty.Fi's Earn platform                 |
| StrategyStep      | `struct`      | `{address token; address creditPool; address borrowToken; address liquidityPool; address strategyContract;}`                                  | `public`     | store the strategy step                                           |
| Strategy                 | `struct`      | `{StrategyStep[] strategySteps; uint8 score; uint256 blockNumber; bool enabled;}` | `public`     | store the strategy steps in sequence with and its score           |
| tokenToStrategies        | `mapping`     | `mapping(address token => bytes32[])`                                 | `public`     | store the lookup for supported token and its corresponding strategy hashes. |
| strategyIndexes         | `bytes32`     | `bytes32[] strategyIndexes`                                 | `public`     | store list of unique strategy hashes. |
| LiquidityPool         | `struct`     | `{uint8 rating, bool isLiquidityPool}`                                 | `public`     | attributes of liquidity pools. |
| liquidityPools         | `mapping`     | `mapping(address liquidityPool => bytes32[] strategies)`                                 | `public`     | store list of liquidity pools. |

### Functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| approveToken           | `address _token`                                                                  | `public`   |    `bool`            | Governance | enable token in `tokens` mapping.                       |
| revokeToken          | `address _token`                                                                  | `public`   | `bool`               | Governance | disable token from `tokens` mapping.                    |
| |  |    |   |  |   |
|  |  |  |  |  |  |
| enableStrategy         | `address _token, uint _strategyProfileId, StrategyStep[] _strategyStep` | `external`   | N/A | Owner/Governance/Strategist | enable strategies using `tokensToStrategy` mapping.     |
| disableStrategy        | `address _token, uint _strategyProfileId, uint _strategyId`                       | `external`   | N/A               | Owner/Governance/Strategist | disable strategies using `tokensToStrategy` mapping.    |
| enableLiquidityPool    | `address _liquidityPool`                                                          | `external`   | N/A               | Owner/Governance/Strategy   | enable or add new liquidity pool using `liquidityPools` |
| disableLiquidityPool   | `address _liquidityPool`                                                          | `external`   | N/A               | Owner/Governance/Strategy   | disable a liquidity pool using `liquidityPools`         |
| rateLiquidityPool      | `address _pool, uint _rate`                                            | `public`   | N/A               | Governance   | give rating to liquidty pool                            |
| scoreStrategy | `bytes32 _hash, uint8 _score` | `public` | N/A | Governance | score the strategy  |

### Events

| Event name | Parameters | Description |
|------------|------------|-------------|
| LogToken | `address token, bool enabled` | Logs when token is enabled/disabled |
| LogStrategyProfile | `uint strategyProfileId, bool enabled` | Logs when a strategy is enabled/disabled |
| LogStrategy | `address token, uint strategyProfileId, StrategyStep[] strategySteps, uint steps, uint blockNumber, bool enabled` | Logs when a strategy is enabled/disabled |
| LogLiquidityPool | `address liquidityPool, bool enabled` | Logs when a liquidity pool is enabled/disabled |
| LogRateLiquidityPool | `address liquidityPool, uint rate` | Logs when a liquidity pool is rated |
| LogScoreStrategy | `address token, uint strategyProfileId, uint strategyId, uint blockNumber, uint score, StrategyStep[] strategySteps` | Log when the strategy is scored |

## `IOptyLiquidityPool`

### Functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| deploy | `uint _amount` | `external` | `bool success` | N/A | deploy in to liquidity pool |
| withdraw | `uint _amount` | `external` | `bool success` | N/A | withdraw from liquidity pool |
| claimReward | `address _liquidityPool` | `external`| `bool success` | N/A | claim rewards from liquidity pool |
| balance | `address _holder` | `external` | `uint balance` | N/A | get the balance of LP tokens |
| borrow | `uint _borrowAmount` | `extenral` | `uint _success` | N/A | borrow from the pool against collateral |
| repayBorrow | `uint _borrowAmount` | `external` | `uint _success` | N/A | give the borrowed token back to pool |

## `OptyXXX<strategy-profile-id>Pool.sol` where xxx is DAI, USDC etc.

### Interfaces

- [IERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol)
- [IOptyFiStrategy]()
- [IOptyRegistry]()

### Contracts
- [ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)

### libraries

- [SafeERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/SafeERC20.sol)
- [SafeMath](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol)

### Variables

| Name                     | Type          | Structure                                                                                                                                     | visibility   | purpose                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| riskManager | `address` | N/A | `public` | the risk manager contract address |
| strategy | `address` | N/A | `public` | the strategy contract address |
| StrategyStep      | `struct`      | `{address token; address creditPool; address borrowToken; address liquidityPool; address strategyContract;}`                                  | `public`     | store the strategy step                                           |
| Strategy                 | `struct`      | `{mapping(uint strategyStepIndex => StrategyStep) strategySteps; uint steps; uint8 score; uint256 blockNumber; bool enabled;}` | `public`     | store the strategy steps with and its score           |


### Functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| setRiskManager | `address _riskManager` | `external` | N/A | Governance/Owner/Strategist | assigns risk manager's contract address to `riskManager` |
| setStrategy | `address _strategy` | `external` | N/A | Governance/Owner/Strategist | assigns strategy's contract address to `strategy` |
| invest | `uint _amount` | `external` | `bool _success` | User | allows user to invest tokens |
| withdraw | `uint _shares` | `external` | `bool _success` | User | allows user to withdraw tokens |
| rebalance | N/A | `external` | `bool _success` | User | allows user to deposit in most recent best strategy |
| calcPoolValueInToken | N/A | `public` | `uint amount` | User | reads the total tokens invested in `Strategy` | 


## `IOptyStrategy`

### Functions

| Name                   | Input Parameters                                                                  | visibility | Return Parameters | Called By                   | Description                                             |
| ---------------------- | --------------------------------------------------------------------------------- | ---------- | ----------------- | --------------------------- | ------------------------------------------------------- |
| poolInvest | `uint _shares` | `extenal` | `bool success` | N/A | deploy the token to liquidity pool |
| withdraw | `uint _shares` | `external` | `bool success` | N/A | withdraw the token from liquidity pool |
