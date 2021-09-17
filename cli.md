# OptyFi CLI

Run `yarn hardhat` to check all available tasks.

Follow the below command to run a specific task :

```
yarn hardhat `taskName` --network `network` --optionName `optionValue`
```

## Deployment Tasks

To deploy OptyFi's contracts.

### deploy-adapter

```
Usage: deploy specific adapter contract

Options :
  --registry      required  <address> the address of registry
  --name          required  <string>  the name of adapter
  --deployedonce  optional  <bool>    allow checking whether contracts were deployed previously (default: true)
  --insertindb    optional  <bool>    insert the deployed contract addresses in DB  (default: false)
  --network       optional  <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-adapter \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --name AaveV1Adapter \
  --deployedonce false \
  --network localhost
```

### deploy-adapters

```
Usage: deploy all available adapter contracts

--registry     required  <address> the address of registry
--deployedonce optional  <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional  <bool>    insert the deployed contract addresses in DB (default: false)
--network      optional  <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-adapters \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network localhost
```

### deploy-harvest-code-provider

```
Usage : deploy HarvestCodeProvider contract

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database (default: false)
--network      optional  <string> name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-harvest-code-provider \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network localhost
```

### deploy-opty

```
Usage: deploy OPTY and OPTYDistributor contracts

Options :
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database (default: false)
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-opty \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network hardhat
```

### deploy-registry

```
Usage: deploy Registry contract

Options:
--deployedonce optional <bool>   allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>   allow inserting to database(default: false)
--network      optional <string> name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-registry \
  --deployedonce false \
  --network localhost
```

### deploy-vault-step-registry

```
Usage: deploy VaultStepInvestStrategyDefinitionRegistry contract

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-vault-step-registry \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network hardhat
```

### deploy-risk-manager

```
Usage: deploy RiskManager contract

Options:
--registry     required <string>  the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat) (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-risk-manager \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network localhost
```

### deploy-strategy-manager

```
Usage: deploy StrategyManager contract

Options:

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-strategy-manager \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
```

### deploy-strategy-provider

```
Usage: deploy StrategyProvider contract

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-strategy-provider \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
```

### deploy-apr-oracle

```
Usage: deploy AprOracle contract

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-apr-oracle \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
```

### deploy-odefi-vault-booster

```
Usage: deploy ODEFIVaultBooster contract

Options:
--registry     required <address> the address of registry
--odefi        required <address> the address of odefi
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-odefi-vault-booster \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --odefi 0x0000000000000000000000000000000000000000
```

### deploy-opty-distributor

```
Usage: deploy OptyDistributor contract

Options:
--registry     required <address> the address of registry
--opty         required <address> the address of opty
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-opty-distributor \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --opty 0x0000000000000000000000000000000000000000
```

### deploy-opty-staking-rate-balancer

```
Usage: deploy OptyStakingRateBalancer contract

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-opty-staking-rate-balancer \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
```

### deploy-opty-staking-vaults

```
Usage: deploy OptyStakingVault contracts

Options:
--registry                  required <address> the address of registry
--opty                      required <address> the address of opty
--optydistributor           required <address> the address of opty distributor
--optystakingratebalancer   required <address> the address of opty staking rate balancer
--deployedonce              optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb                optional <bool>    allow inserting to database
--network                   optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-staking-vautls \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --opty 0x0000000000000000000000000000000000000000 \
  --optydistributor 0x0000000000000000000000000000000000000000 \
  --optystakingratebalancer 0x0000000000000000000000000000000000000000
```

### deploy-price-oracle

```
Usage: deploy PriceOracle contracts

Options:
--registry                  required <address> the address of registry
--deployedonce              optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb                optional <bool>    allow inserting to database
--network                   optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-price-oracle \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
```

### deploy-vault

```
Usage: deploy Vault contract

Options:
--registry     required <address> the address of registry
--token        required <address> the address of underlying token
--riskprofile  required <string>  the name of Vault's risk profile
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-vault \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --riskprofile RP1
```

### deploy-vaults

```
Usage: deploy all designated Vault contract

Options:
--registry     required <address> the address of registry
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat deploy-vaults \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
```

### deploy-erc20

```
Usage: deploy erc20 contract

Options:
--name         required <string> the name of token
--symbol       required <string> the symbol of token
--total        optional <number> the totalSupply of token (default: 0)
--decimal      required <number> the decimal of token(defaukt: 18)
--deployedonce optional <bool>   allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>   allow inserting to database
--network      optional <string> name of the network provider (default: hardhat)

```

- Example:

```
  yarn hardhat deploy-erc20 \
  --network localhost \
  --name ERC20 \
  --symbol ERC20 \
  --total 0 \
  --decimal 18
```

## Action Tasks

To execute functions in a OptyFi's contract.

### set-strategies

```
Usage: set all current available strategies with file or default.

Options:
--strategyregistry required <address> the address of vaultStepInvestStrategyDefinitionRegistry
--fromfile         required <string>  path to strategies json file
--network          optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat set-strategies \
  --network localhost \
  --strategyregistry 0x0000000000000000000000000000000000000000 \
  --fromfile /path/to/file.json
```

### add-risk-profile

```
Usage: add risk profile in Registry contract

Options:
--registry      required <address> the address of registry
--name          required <string>  the name of risk profile
--canborrow     required <boolean> whether risk profile can borrow or not
--lowestrating  required <int>     the lowest rating
--highestrating required <int>     the highest rating
--network       optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat add-risk-profile \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --name RP1 \
  --canborrow true \
  --lowestrating 0 \
  --highestrating 10
```

### approve-erc20

```
Usage: approve spender to use specific amount of erc20 token

Options:
--spender   required <address> the address of spender
--token     required <address> the address of token
--amount    required <int>     the amount of token
--network   optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat approve-erc20 \
  --network localhost \
  --spender 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --amount 1000000000000000
```

### approve-tokens

```
Usage: approve all available tokens

Options:
--registry required <address> the address of registry
--network  optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat approve-tokens \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
```

### approve-token

```
Usage: approve a specific token

Options:
--registry required <address> the address of registry
--token    required <address> the address of token
--network  optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat approve-token \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000
```

### get-all-strategies

```
Usage: get all strategies for a specific token

Options:
--strategyregistry required <address> the address of vaultStepInvestStrategyDefinitionRegistry
--token            required <address> the address of token
--network          optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat get-all-strategies \
  --network localhost \
  --strategyregistry 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000
```

### get-best-strategy

```
Usage: get best strategy or default best strategy for the token with risk profile

Options:
--token            required <address> the address of token
--riskprofile      required <string>  risk profile
--strategyprovider required <address> the address of strategyProvider
--isdefault        required <bool>    get default strategy or not
--network          optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat get-best-strategy \
  --network localhost \
  --riskprofile RP1 \
  --strategyprovider 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --isdefault true
```

### set-best-strategy

```
Usage: set best strategy or default best strategy

Options:
--token            required <address> the address of token
--riskprofile      required <string>  risk profile
--strategyhash     required <string>  the keccak256 hash of strategy
--strategyprovider required <address> the address of strategyProvider
--isdefault        required <bool>    whether set best default strategy or not
--network          optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat set-best-strategy \
  --network localhost \
  --riskprofile RP1 \
  --strategyprovider 0x0000000000000000000000000000000000000000 \
  --strategyhash 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --isdefault true
```

### set-vault-step-registry

```
Usage: set vault step registry in registry contract

Options:
--registry         required <address> the address of registry
--strategyregistry required <address> the address of vaultStepInvestStrategyDefinitionRegistry
--network          optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat set-vault-step-registry \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --strategyregistry 0x0000000000000000000000000000000000000000
```

### unpause-vault

```
Usage: unpause the vault

Options:
--registry required <address> the address of registry
--vault    required <address> the address of vault
--network  optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat unpause-vault \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --vault 0x0000000000000000000000000000000000000000
```

### vault-actions

```
Usage: perform actions in the vault contract

Options:
--vault         required <address> the address of vault
--user          required <address> account address of the user
--action        required <string>  "DEPOSIT" || "WITHDRAW" || "REBALANCE"
--withrebalance optional <bool>    do action with rebalance (default: true)
--useall        optional <bool>    use whole balance (default: false)
--amount        optional <number>  amount of token (default: 0)
--network       optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat vault-actions \
  --network localhost \
  --vault 0x0000000000000000000000000000000000000000 \
  --user 0x0000000000000000000000000000000000000000 \
  --action deposit \
  --withrebalance true \
  --useall false \
  --amount 500000
```

### map-liquiditypool-adapter

```
Usage: approve and map liquidity pool to adapter

Options:
--registry      required <address> the address of registry
--liquiditypool required <address> the address of liquidity
--adapter       required <address> the address of defi adapter
--network       optional <string>  name of the network provider (default: hardhat)
```

- Example

```
yarn hardhat map-liquiditypool-adapter \
--network localhost \
--registry 0x09557807C515d758ECc5E1D1aCE7D09aA5842F51  \
--liquiditypool 0x71B9eC42bB3CB40F017D8AD8011BE8e384a95fa5 \
--adapter 0xbf78A1a02e34CF7aCDB8BD9D0f225cB6AA6B85C5
```
