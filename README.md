# Earn protocol

Core smart contract of OptyFi's Earn protocol

# Setup optyfi's earn protocol.

## Installation

- <a href="https://nodejs.org/en/" target="_blank">Node.js</a> - >v8
- Install <a href="https://www.google.ca/chrome/" target="_blank">Google Chrome</a> or <a href="https://www.google.ca/chrome/" target="_blank">FireFox</a> or <a href="https://www.mozilla.org/en-CA/firefox/" target="_blank">Brave</a>
- Install <a href="https://brave.com/" target="_blank">MetaMask</a> in the browser
- API keys from Ethereum node Providers like <a href="https://chainstack.com" target="_blank">chainstack.com</a>
- Install remixd

```bash
$ npm install -g @remix-project/remixd
```

## Getting Started

### Forked Mainnet

- Clone defi-faucet

```bash
$ git clone https://github.com/Opty-Fi/defi-faucet.git
$ cd ./defi-faucet
```

- start forked mainnet

```bash
$ node ./ganache-server.js
```

### Earn protocol

- Clone earn-protocol

```bash
$ git clone https://github.com/Opty-Fi/earn-protocol.git
```

#### Steps to deploy and setup all the contracts correctly

Note: harvest.finance fDAI vault (HarvestAdapter) will be used in this example.

1. Deploy RegistryProxy()
2. Deploy Registry()
3. Call RegistryProxy.setPendingImplementation(address \_registry)
4. Call Registry.become(address \_registryProxy)
5. Deploy Registry at RegistryProxy address
6. Deploy StrategyProvider(address \_registryProxy)
7. Deploy RiskManagerProxy Contract
8. Deploy RiskManager Contract
9. Call RiskManagerProxy.setPendingImplementation(address \_riskManager)
10. Call RiskManager.become(address \_riskManagerProxy)
11. Deploy RiskManager at RiskManagerProxy address
    - Note: Use this new RiskManager everywhere from here onwards
12. Call RiskManager.initialize(address \_\_strategyProvider)
13. Deploy HarvestCodeProvider(address \_registryProxy)
14. Deploy StrategyCodeProvider(address \_registryProxy, address \_gatherer)
15. Deploy OPTY(address \_registryProxy, uint256(0)). Copy OPTY address and paste it in OPTYMinterStorage, where there is a constant called OPTYAddress
16. Deploy OPTYMinter(address \_registryProxy)
17. Deploy HarvestAdapter(address \_registryProxy, address \_harvestCodeProvider)
18. Compile VaultProxy => Deploy InitializableImmutableAdminUpgradeabilityProxy(address \_admin). Note: \_admin should be a different account that the one from which you deployed the previous contract. This address will only be used for upgrading the implementations in VaultProxy
19. Deploy Vault(address \_registryProxy, address DAI)
20. Switch to \_admin account and call VaultProxy.upgradeTo(address \_vault)
21. Switch back to your normal account
22. Deploy Vault at VaultProxy address
23. Call Vault.initialize(address \_registryProxy, address \_riskManager, address DAI, address \_strategyCodeProvider, address \_optyMinter)

After all these steps, if you want to test it, you need to approve token, approve liquidityPool, etc. in RegistryProxy as usual.

- Run `yarn run` to view all available tasks.

### Setup and Deployments
For setting up all essential actions (deploying contracts, executing functions).

```
# hardhat
    yarn setup
# localhost
    yarn setup:local
# staging
    yarn setup:staging
```

For deploying infrastructure contracts in Optyfi protocol.

```
# hardhat
    yarn deploy-infra
# localhost
    yarn deploy-infra:local
# staging
    yarn deploy-infra:staging
```

For deploying all Optyfi core vaults.

```
Prerequisite : Deployed all infrastructure contracts.
# hardhat
    yarn hardhat deploy-vaults --registry <address> --riskmanager <address> --strategymanager <address> --optyminter <address>
# localhost
    yarn hardhat --network localhost deploy-vaults --registry <address> --riskmanager <address> --strategymanager <address> --optyminter <address>
```

Run `yarn hardhat` to check all available tasks. Following the below command :
```
yarn hardhat `name` --network `network` --flagName `flagValue`
```

For deploying a specific contract.

| Name | Prerequisite Contracts | Flags      | Optional Flags | Description|
|------|--------------| ----------|-----|----|
|deploy-adapter     | Registry, HarvestCodeProvider, Priceoracle             |          registry, harvestcodeprovider,  priceoracle, name | deployedonce, insertindb | deploy specific adapter contract|
|deploy-adapters | Registry, HarvestCodeProvider, Priceoracle |          registry, harvestcodeprovider,  priceoracle | deployedonce, insertindb | deploy all available adapter contracts|
|deploy-harvest-code-provider | Registry |          registry | deployedonce, insertindb | deploy HarvestCodeProvider contract|
|deploy-opty | Registry |          registry | deployedonce, insertindb | deploy OPTY and OPTYMinter contracts|
|deploy-registry | N/A |          N/A | deployedonce, insertindb | deploy Registry and VaultStepInvestStrategyDefinitionRegistry contracts|
|deploy-risk-manager | Registry |          registry | deployedonce, insertindb | deploy RiskManager contract|
|deploy-strategy-manager | Registry, HarvestCodeProvider |          registry, harvestcodeprovider | deployedonce, insertindb | deploy StrategyManager contract|
|deploy-strategy-provider | Registry |          registry | deployedonce, insertindb | deploy StrategyProvider contract|
|deploy-vault | Registry, RiskManager, StrategyManager, OPTYMinter |          token, riskprofile, registry, riskmanager, strategymanager, optyminter | insertindb | deploy specific vault contract|

For executing contract functions.

| Name | Prerequisite Contracts | Flags      | Optional Flags | Description|
|------|--------------| ----------|-----|----|
|set-strategies    | VaultStepInvestStrategyDefinitionRegistry             |          strategyregistry | N/A | set all current available strategies|
|approve-tokens | Registry |          registry | N/A | approve all available tokens|