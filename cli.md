# CLI commands

Run `yarn hardhat` to check all available tasks.

Follow the below command to run a specific task :

```
yarn hardhat `taskName` --network `network` --optionName `optionValue`
```

## Deployment Tasks

To deploy contracts.

### ethereum-deploy-adapter

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
  yarn hardhat ethereum-deploy-adapter \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --name AaveV1Adapter \
  --deployedonce false \
  --network localhost
```

### ethereum-deploy-adapters

```
Usage: deploy all available adapter contracts

--registry     required  <address> the address of registry
--deployedonce optional  <bool>    allow checking whether contracts were deployed previously (default: true)
--insertindb   optional  <bool>    insert the deployed contract addresses in DB (default: false)
--network      optional  <string>  name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat ethereum-deploy-adapters \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network localhost
```

### ethereum-deploy-harvest-code-provider

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
  yarn hardhat ethereum-deploy-harvest-code-provider \
  --network localhost \
  --registry 0x0000000000000000000000000000000000000000 \
  --deployedonce false \
  --network localhost
```

### ethereum-deploy-registry

```
Usage: deploy Registry contract

Options:
--deployedonce optional <bool>   allow checking whether contracts were deployed previously (default: true)
--insertindb   optional <bool>   allow inserting to database(default: false)
--network      optional <string> name of the network provider (default: hardhat)
```

- Example:

```
  yarn hardhat ethereum-deploy-registry \
  --deployedonce false \
  --network localhost
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

To execute functions

### approve-erc20

```
Usage: approve spender to use specific amount of erc20 token

Options:
--spender   required <address> the address of spender
--token     required <address> the address of token
--amount    required <number>     the amount of token
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

### ethereum-set-max-deposit

```
Usage: set max deposit for a specific adapter

Options:
--adapter         required <address> the address of adapter
--amount          required <number>  the max deposit amount
--mode            required <address> the max deposit mode (*)
--liquiditypool   required <address> the address of liquiditypool (*)
--underlyingtoken required <address> the address of underlying token (*)
--setprotocol     optional <boolean> set amount for Protocol or not (default: false)
--network         optional <string>  name of the network provider (default: hardhat)
```

- Notes:
  (\*) might be required depend on the Adapter's contract.

- Example:

```
yarn hardhat ethereum-set-max-deposit
--adapter 0xA38FdF6d6D3E6dff80F416Fa6C1649b317A70595 \
--amount 1000000000000000000000000 \
--mode pct \
--liquiditypool 0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c \
--underlyingtoken 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490 \
--setprotocol false \
--network localhost
```

### ethereum-set-max-deposit-mode

```
Usage: set max deposit mode for a specific adapter

Options:
--adapter      required <address> the address of adapter
--mode         required <address> the max deposit mode
--network      optional <string>  name of the network provider (default: hardhat)
```

- Example:

```
yarn hardhat etheruem-set-max-deposit-mode
--adapter 0xA38FdF6d6D3E6dff80F416Fa6C1649b317A70595 \
--mode pct \
--network localhost
```

### balance-of

```
Usage: check token balance of specific address

Options:
--token   required <address> the address of token
--user    required <address> the address of user
--network optional <string>  name of the network provider (default: hardhat)
```

- Example

```
yarn hardhat balance-of \
--network localhost \
--token 0x6B175474E89094C44Da98b954EedeAC495271d0F  \
--user 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

### get-action

```
Usage: execute a get action in smart contract

Options:
--name        required <address> the name of contract
--address     required <address> the address of smart contract
--functionabi required <string> a get function abi
--params      optional <array> the required params of the function (default: "")
--network     optional <string>  name of the network provider (default: hardhat)
```

- Notes:
  functionabi: needs to have quotation marks('') around the function abi.
  params: need to have comma(,) in order to differentiate each param (Ex : param1,param2).

- Example

```
yarn hardhat get-action \
--network localhost \
--name ERC20 \
--address 0x6B175474E89094C44Da98b954EedeAC495271d0F \
--functionabi 'balanceOf(address)' \
--params 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```
