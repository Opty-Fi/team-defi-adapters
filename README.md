# Team DeFi Adapters

DeFi Adapters build by core dev team of opty.fi

## Prerequisite

To run the project :

- <a href="https://nodejs.org/en/" target="_blank">Node.js</a> - >v8
- <a href="https://yarnpkg.com/lang/en/docs/install/" target="_blank">Yarn</a>
- Local env variables following [format](.env.example)
- API keys from Blockchain node Providers like <a href="https://chainstack.com" target="_blank">chainstack.com</a>

## Installation

Clone team-defi-adapters

```bash
git clone https://github.com/Opty-Fi/team-defi-adapters.git
```

Run `yarn install` to install necessary dependencies.

Run `yarn hardhat` to view all available tasks.

## Compile and Test

Compile all contracts

```bash
yarn compile
```

Test all contracts

```bash
yarn test
```

## Setup and Deployments

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

[View more tasks](cli.md)
