# OptyFi CLI

Run `yarn hardhat` to check all available tasks.

Follow the below command to run a specific task :

```
yarn hardhat `name` --network `network` --flagName `flagValue`
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
* Example:
```
  yarn hardhat deploy-adapter \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --name AaveV1Adapter
  --deployedonce false
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

* Example:
```
  yarn hardhat deploy-adapters \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false
  --network localhost
```

### deploy-harvest-code-provider
```
Usage : deploy HarvestCodeProvider contract

Options:
--registry     required <address> the address of registry
--deployedonce optional <bool> allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool> allow inserting to database (default: false)
--network      optional  <string>  name of the network provider (default: hardhat)
```

* Example:
```
  yarn hardhat deploy-harvest-code-provider \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
  --deployedonce false
  --network localhost
```
### deploy-opty

```
Usage: deploy OPTY and OPTYDistributor contracts

Options :
--registry     required <address> the address of registry
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database (default: false)
--network      optional  <string>  name of the network provider (default: hardhat)
```

* Example:
```
  yarn hardhat deploy-opty \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000
  --deployedonce false
  --network hardhat
```
### deploy-registry

```
Usage: deploy Registry contract

Options:
--deployedonce optional <bool> allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool> allow inserting to database(default: false)
--network      optional  <string>  name of the network provider (default: hardhat)
```
* Example:
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
--network      optional  <string>  name of the network provider (default: hardhat)
```

* Example:
```
  yarn hardhat deploy-vault-step-registry \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false
  --network hardhat
```

### deploy-risk-manager

```
Usage: deploy RiskManager contract

Options:
--registry     required <string>
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat) (default: hardhat)
```

* Example:
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
--network      optional  <string>  name of the network provider (default: hardhat)
```

* Example:
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
--network      optional  <string>  name of the network provider (default: hardhat)
```

* Example:
```
  yarn hardhat deploy-strategy-provider \
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
--network      optional  <string>  name of the network provider (default: hardhat)
```
* Example:
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
--network      optional  <string>  name of the network provider (default: hardhat)
```
* Example:
```
  yarn hardhat deploy-vault \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
```

### deploy-erc20
```
Usage: deploy erc20 contract

Options:
--name         name
--symbol       symbol
--total        required
--decimal      required
--deployedonce optional <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>    allow inserting to database
--network      optional <string>  name of the network provider (default: hardhat)

```

* Example:
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

- Description: set all current available strategies with file or default.
- Prerequisite Contracts : VaultStepInvestStrategyDefinitionRegistry
- Required Flags : strategyregistry, fromfile.
- Optional Flags : N/A.
- Example:
  yarn hardhat set-strategies \
  --network localhost \
  --strategyregistry 0x0000000000000000000000000000000000000000 \
  --fromfile /home/file.json

### approve-tokens

- Description: approve all available tokens
- Prerequisite Contracts : Registry
- Required Flags : registry.
- Optional Flags : N/A.
- Example:
  yarn hardhat set-strategies \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000

### approve-token

- Description: approve a specific tokens
- Prerequisite Contracts : Registry
- Required Flags : registry, token.
- Optional Flags : N/A.
- Example:
  yarn hardhat set-strategies \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000

### get-all-strategies

- Description: get all strategies for a specific tokens.
- Prerequisite Contracts : VaultStepInvestStrategyDefinitionRegistry
- Required Flags : strategyregistry, token.
- Optional Flags : N/A.
- Example:
  yarn hardhat set-strategies \
  --network localhost \
  --strategyregistry 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000

### get-best-strategy

- Description: get best strategy or default best strategy for the token with risk profile
- Prerequisite Contracts : StrategyProvider
- Required Flags : token, riskprofile, strategyprovider, isdefault.
- Optional Flags : N/A.
- Example:
  yarn hardhat get-best-strategy \
  --network localhost \
  --riskprofile RP1 \
  --strategyprovider 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --isdefault true

### set-best-strategy

- Description: set best strategy or default best strategy
- Prerequisite Contracts : StrategyProvider
- Required Flags : token, riskprofile, strategyhash, strategyprovider, isdefault.
- Optional Flags : N/A.
- Example:
  yarn hardhat set-best-strategy \
  --network localhost \
  --riskprofile RP1 \
  --strategyprovider 0x0000000000000000000000000000000000000000 \
  --strategyhash 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --isdefault true

### set-vault-step-registry

- Description: set vault step registry in registry contract
- Prerequisite Contracts : Registry VaultStepInvestStrategyDefinitionRegistry
- Required Flags : registry, strategyregistry.
- Optional Flags : N/A.
- Example:
  yarn hardhat set-vault-step-registry \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --strategyregistry 0x0000000000000000000000000000000000000000

### unpause-vault

- Description: unpause the vault
- Prerequisite Contracts : Registry, Vault
- Required Flags : registry, vault.
- Optional Flags : N/A.
- Example:
  yarn hardhat unpause-vault \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --vault 0x0000000000000000000000000000000000000000

### vault-actions

- Description: perform actions in the vault contract.
- Prerequisite Contracts : Vault
- Required Flags : vault, action(deposit/withdraw/rebalance), withrebalance (boolean), useall (boolean), amount.
- Optional Flags : N/A.
- Example:
  yarn hardhat vault-actions \
  --network localhost \
  --vault 0x0000000000000000000000000000000000000000 \
  --action deposit \
  --withrebalance true \
  --useall false \
  --amount 500000
