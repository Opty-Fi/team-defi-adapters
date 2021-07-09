# OptyFi CLI

Run `yarn hardhat` to check all available tasks. 

Follow the below command to run a specific task :
```
yarn hardhat `name` --network `network` --flagName `flagValue`
```
## Deployment Tasks

To deploy OptyFi's contracts.

| Name                         | Prerequisite Contracts                             | Flags                                                                  | Optional Flags           | Description                                                             |
| ---------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------- |
| deploy-adapter               | Registry, HarvestCodeProvider, Priceoracle         | registry, harvestcodeprovider, priceoracle, name                       | deployedonce, insertindb | deploy specific adapter contract                                        |
| deploy-adapters              | Registry, HarvestCodeProvider, Priceoracle         | registry, harvestcodeprovider, priceoracle                             | deployedonce, insertindb | deploy all available adapter contracts                                  |
| deploy-harvest-code-provider | Registry                                           | registry                                                               | deployedonce, insertindb | deploy HarvestCodeProvider contract                                     |
| deploy-opty                  | Registry                                           | registry                                                               | deployedonce, insertindb | deploy OPTY and OPTYDistributor contracts                                    |
| deploy-registry              | N/A                                                | N/A                                                                    | deployedonce, insertindb | deploy Registry and VaultStepInvestStrategyDefinitionRegistry contracts |
| deploy-vault-step-registry              | Registry                                                | registry                                                                    | deployedonce, insertindb | deploy VaultStepInvestStrategyDefinitionRegistry contracts |
| deploy-risk-manager          | Registry                                           | registry                                                               | deployedonce, insertindb | deploy RiskManager contract                                             |
| deploy-strategy-manager      | Registry, HarvestCodeProvider                      | registry, harvestcodeprovider                                          | deployedonce, insertindb | deploy StrategyManager contract                                         |
| deploy-strategy-provider     | Registry                                           | registry                                                               | deployedonce, insertindb | deploy StrategyProvider contract                                        |
| deploy-vault                 | Registry, RiskManager, StrategyManager, OPTYDistributor | token, riskprofile, registry, riskmanager, strategymanager, optydistributor | insertindb               | deploy specific vault contract                                          |
| deploy-vaults                 | Registry, RiskManager, StrategyManager, OPTYDistributor | registry, riskmanager, strategymanager, optydistributor | insertindb               | deploy all designated vault contracts                                          |
| deploy-erc20                 | N/A | name, symbol, total, decimal | deployonce, insertindb               | deploy erc20 contract                                          |

## Action Tasks 

To execute functions in a OptyFi's contract.

| Name           | Prerequisite Contracts                    | Flags            | Optional Flags | Description                          |
| -------------- | ----------------------------------------- | ---------------- | -------------- | ------------------------------------ |
| set-strategies | VaultStepInvestStrategyDefinitionRegistry | strategyregistry, fromfile | N/A            | set all current available strategies with file or default |
| approve-tokens | Registry                                  | registry         | N/A            | approve all available tokens         |
| approve-token | Registry                                  | registry         | N/A            | approve a specific tokens         |
| get-all-strategies | VaultStepInvestStrategyDefinitionRegistry                                  | strategyregistry, token         | N/A            | get all strategies for a specific tokens         |
| get-best-strategy | StrategyProvider                                  | token, riskprofile, strategyprovider, isdefault         | N/A            | get best strategy or default best strategy for the token with risk profile         |
| set-best-strategy | StrategyProvider                                  | token, riskprofile, strategyhash, strategyprovider, isdefault         | N/A            | set best strategy or default best strategy         |
| set-vault-step-registry | Registry, VaultStepInvestStrategyDefinitionRegistry                                   | registry         | N/A            | set vault step registry in registry contract         |
| unpause-vault | Registry, Vault                                  | registry, vault         | N/A            | unpause the vault         |
| vault-actions | Vault |  vault, action(deposit/withdraw/rebalance), withrebalance (boolean), useAll (boolean), amount | N/A | perform actions in the vault contract |