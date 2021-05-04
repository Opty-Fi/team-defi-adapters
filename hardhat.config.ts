import { HardhatUserConfig } from "hardhat/types";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-deploy-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-watcher";
import "solidity-coverage";
import "hardhat-deploy";
import { NETWORKS_RPC_URL, NETWORKS_DEFAULT_GAS, eEthereumNetwork } from "./helper-hardhat-config";

require("./tasks/deployment/deploy-infra");
require("./tasks/deployment/deploy-vault");
require("./tasks/deployment/deploy-vaults");
require("./tasks/accounts");
require("./tasks/clean");

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

const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const DEFAULT_GAS_MUL = 5;
const HARDFORK = "istanbul";
const MNEMONIC_PATH = "m/44'/60'/0'/0";

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

const getCommonNetworkConfig = (networkName: eEthereumNetwork, networkId: number) => ({
  url: NETWORKS_RPC_URL[networkName],
  hardfork: HARDFORK,
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  gasMultiplier: DEFAULT_GAS_MUL,
  gasPrice: NETWORKS_DEFAULT_GAS[networkName],
  chainId: networkId,
  accounts: {
    mnemonic,
    path: MNEMONIC_PATH,
    initialIndex: 0,
    count: 20,
  },
});

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
    kovan: getCommonNetworkConfig(eEthereumNetwork.kovan, 42),
    ropsten: getCommonNetworkConfig(eEthereumNetwork.ropsten, 3),
    main: getCommonNetworkConfig(eEthereumNetwork.main, 1),
    localhost: {
      url: NETWORKS_RPC_URL[eEthereumNetwork.hardhat],
      chainId: chainIds.ganache,
    },
    hardhat: {
      forking: {
        blockNumber: 12200321,
        url: chainstackMainnetUrl,
      },
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
      chainId: chainIds.hardhat,
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
    enabled: process.env.REPORT_GAS == "true" ? true : false,
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
