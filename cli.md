# OptyFi CLI

Run `yarn hardhat` to check all available tasks.

Follow the below command to run a specific task :

```
yarn hardhat `name` --network `network` --flagName `flagValue`
```

## Deployment Tasks

To deploy OptyFi's contracts.

### deploy-adapter

- Description: deploy specific adapter contract
- Prerequisite Contracts : Registry, HarvestCodeProvider, Priceoracle.
- Required Flags : registry, harvestcodeprovider, priceoracle, name.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-adapter \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --harvestcodeprovider 0x0000000000000000000000000000000000000000 \
  --priceoracle 0x0000000000000000000000000000000000000000 \
  --name AaveV1Adapter

### deploy-adapters

- Description: deploy all available adapter contracts
- Prerequisite Contracts : Registry, HarvestCodeProvider, Priceoracle.
- Required Flags : registry, harvestcodeprovider, priceoracle.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-adapters \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --harvestcodeprovider 0x0000000000000000000000000000000000000000 \
  --priceoracle 0x0000000000000000000000000000000000000000

### deploy-harvest-code-provider

- Description: deploy HarvestCodeProvider contract
- Prerequisite Contracts : Registry
- Required Flags : registry
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-harvest-code-provider \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000

### deploy-opty

- Description: deploy OPTY and OPTYDistributor contracts
- Prerequisite Contracts : Registry.
- Required Flags : registry.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-opty \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000

### deploy-registry

- Description: deploy Registry contract
- Prerequisite Contracts : N/A.
- Required Flags : N/A.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-registry \
  --network localhost

### deploy-vault-step-registry

- Description: deploy VaultStepInvestStrategyDefinitionRegistry contract
- Prerequisite Contracts : Registry.
- Required Flags : registry.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-vault-step-registry \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000

### deploy-risk-manager

- Description: deploy RiskManager contract
- Prerequisite Contracts : Registry.
- Required Flags : registry.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-risk-manager \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000

### deploy-strategy-manager

- Description: deploy StrategyManager contract
- Prerequisite Contracts : Registry, HarvestCodeProvider.
- Required Flags : registry, harvestcodeprovider.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-strategy-manager \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --harvestcodeprovider 0x0000000000000000000000000000000000000000

### deploy-strategy-provider

- Description: deploy StrategyProvider contract
- Prerequisite Contracts : Registry.
- Required Flags : registry.
- Optional Flags : deployedonce, insertindb.
- Example:
  yarn hardhat deploy-strategy-provider \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000

### deploy-vault

- Description: deploy specific vault contract
- Prerequisite Contracts : Registry, RiskManager, StrategyManager, OPTYDistributor.
- Required Flags : token, riskprofile, registry, riskmanager, strategymanager, optydistributor.
- Optional Flags : insertindb.
- Example:
  yarn hardhat deploy-vault \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --riskmanager 0x0000000000000000000000000000000000000000 \
  --strategymanager 0x0000000000000000000000000000000000000000 \
  --optydistributor 0x0000000000000000000000000000000000000000 \
  --token 0x0000000000000000000000000000000000000000 \
  --riskprofile RP1

### deploy-vaults

- Description: deploy all designated vault contracts
- Prerequisite Contracts : Registry, RiskManager, StrategyManager, OPTYDistributor.
- Required Flags : registry, riskmanager, strategymanager, optydistributor.
- Optional Flags : insertindb.
- Example:
  yarn hardhat deploy-vaults \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --riskmanager 0x0000000000000000000000000000000000000000 \
  --strategymanager 0x0000000000000000000000000000000000000000 \
  --optydistributor 0x0000000000000000000000000000000000000000

### deploy-erc20

- Description: deploy erc20 contract
- Prerequisite Contracts : N/A
- Required Flags : name, symbol, total, decimal.
- Optional Flags : deployonce, insertindb.
- Example:
  yarn hardhat deploy-erc20 \
  --network localhost \
  --name ERC20 \
  --symbol ERC20 \
  --total 0 \
  --decimal 18

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
