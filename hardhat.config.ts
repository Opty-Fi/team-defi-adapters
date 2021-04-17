import { HardhatUserConfig } from "hardhat/types";
require("dotenv").config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";

const SKIP_LOAD = process.env.SKIP_LOAD === 'true';
const mnemonic = process.env.MY_METAMASK_MNEMONIC;

if (!SKIP_LOAD) {
    require("./tasks/insert-data-curvedeposit");
    require("./tasks/insert-data-curveswappool");
}

const buidlerConfig: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.6.10",
                settings: {
                    optimizer: { enabled: true, runs: 200 },
                    evmVersion: "istanbul",
                }
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: { enabled: true, runs: 200 },
                    evmVersion: "istanbul",
                }
            }
        ]
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_NODE_URL ? process.env.MAINNET_NODE_URL : "",
            },
        },
        "staging-mainnet": {
            url: process.env.STAGING_MAINNET_URL,
            accounts: { mnemonic }
        }
    },
    mocha: {
        timeout: 100000,
    },
};
export default buidlerConfig;