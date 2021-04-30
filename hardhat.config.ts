import { HardhatUserConfig } from "hardhat/types";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-watcher";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/clean";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.MY_METAMASK_MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
} else {
  mnemonic = process.env.MY_METAMASK_MNEMONIC as string;
}

let chainstackMainnetUrl: string;
if (!process.env.MAINNET_NODE_URL) {
  throw new Error("Please set your MAINNET_NODE_URL in a .env file");
} else {
  chainstackMainnetUrl = process.env.MAINNET_NODE_URL as string;
}

const buidlerConfig: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.6.10",
    settings: {
      optimizer: { enabled: true, runs: 1 },
      evmVersion: "istanbul",
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
      forking: {
        blockNumber: 12200321,
        url: chainstackMainnetUrl,
      },
      gas: 12000000,
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  mocha: {
    timeout: 0,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 21,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API,
    excludeContracts: [],
    src: "./contracts",
  },
  watcher: {
    compilation: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
    },
    ci: {
      tasks: [
        "clean",
        {
          command: "compile",
          params: {
            quiet: true,
          },
        },
        {
          command: "test",
          params: {
            noCompile: true,
            testFiles: ["test/test-opty/*.spec.ts"],
          },
        },
      ],
    },
    test: {
      tasks: ["test"],
      files: ["./contracts", "./test/test-opty/invest-limitation.spec.ts"],
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default buidlerConfig;
