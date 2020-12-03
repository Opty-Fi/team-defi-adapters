import chai, { assert, expect } from "chai";
import { Contract, ethers, utils } from "ethers";
import { solidity, deployContract } from "ethereum-waffle";

import { expandToTokenDecimals, fundWallet } from "./shared/utilities";
import OptyTokenBasicPool from "../build/BasicPool.json";
import OptyRegistry from "../build/Registry.json";
import RiskManager from "../build/RiskManager.json";
import OptyStrategyManager from "../build/StrategyManager.json";
import CompoundDepositPoolProxy from "../build/CompoundDepositPoolProxy.json";
import AaveDepositPoolProxy from "../build/AaveDepositPoolProxy.json";
import AaveBorrowPoolProxy from "../build/AaveBorrowPoolProxy.json";
import CurveDepositPoolProxy from "../build/CurveDepositPoolProxy.json";
import CreamDepositPoolProxy from "../build/CreamDepositPoolProxy.json";
import DForceDepositPoolProxy from "../build/DForceDepositPoolProxy.json";
import FulcrumDepositPoolProxy from "../build/FulcrumDepositPoolProxy.json";
import HarvestDepositPoolProxy from "../build/HarvestDepositPoolProxy.json";
import YearnDepositPoolProxy from "../build/YearnDepositPoolProxy.json";
// import { CompoundDepositPoolProxy, AaveDepositPoolProxy } from "../build/";
import poolProxies from "./shared/poolProxies.json";
import defiPools from "./shared/defiPools.json";
import allStrategies from "./shared/strategies.json";

import tokenAddresses from "./shared/TokenAddresses.json";
import addressAbis from "./shared/AddressAbis.json";
import { ContractJSON } from "ethereum-waffle/dist/esm/ContractJSON";
// import { ContractJSON } from "ethereum-waffle/dist/esm/ContractJSON";
const envConfig = require("dotenv").config(); //  library to import the local ENV variables defined
//  Note: Don't remove line-6, because this line helps to get rid of error: NOT ABLE TO READ LOCAL ENV VARIABLES defined in .env file

chai.use(solidity);

const Ganache = require("ganache-core");
const abi = require("ethereumjs-abi");
const MAINNET_NODE_URL = process.env.MAINNET_NODE_URL;
const TEST_AMOUNT_NUM: number = 2;
let TEST_AMOUNT: ethers.utils.BigNumber;

interface PoolProxyContract {
    [id: string]: ContractJSON;
}
interface DefiPools {
    [id: string]: {
        pool: string;
        lpToken: string;
        tokens: string[];
    };
}
let poolProxyContract: PoolProxyContract = {
    CompoundDepositPoolProxy,
    AaveDepositPoolProxy,
    FulcrumDepositPoolProxy,
    DForceDepositPoolProxy,
    HarvestDepositPoolProxy,
    YearnDepositPoolProxy,
    CurveDepositPoolProxy,
    CreamDepositPoolProxy,
};

interface OptyPoolProxyContractVariables {
    [id: string]: Contract;
}
let optyPoolProxyContractVariables: OptyPoolProxyContractVariables = {};
let poolProxiesKey: keyof typeof poolProxies;
let defiPoolsKey: keyof typeof defiPools;

async function startChain() {
    const ganache = await Ganache.provider({
        fork: MAINNET_NODE_URL,
        network_id: 1,
        mnemonic: `${process.env.MY_METAMASK_MNEMONIC}`,
    });
    const provider = new ethers.providers.Web3Provider(ganache);
    const wallet = ethers.Wallet.fromMnemonic(
        `${process.env.MY_METAMASK_MNEMONIC}`
    ).connect(provider);

    return wallet;
}

describe("OptyTokenBasicPool", async () => {
    let strategyScore: number = 1;
    let wallet: ethers.Wallet;
    let optyTokenBasicPool: Contract;
    let optyRegistry: Contract;
    let riskManager: Contract;
    let optyStrategyManager: Contract;
    let optyAaveBorrowPoolProxy: Contract;
    let optyCurveDepositPoolProxy: Contract;
    let optyCreamDepositPoolProxy: Contract;
    let optyDForceDepositPoolProxy: Contract;
    let optyFulcrumDepositPoolProxy: Contract;
    let optyHarvestDepositPoolProxy: Contract;
    let optyYearnDepositPoolProxy: Contract;
    let profile = "basic";
    let underlyingToken = tokenAddresses.usdc;
    const tokens = [underlyingToken];
    let tokenContractInstance: Contract;
    let userTokenBalanceWei;
    let userInitialTokenBalance: number;
    let userTotalTokenBalance: number;
    let contractTokenBalanceWei;
    let contractTokenBalance: number;
    let contractTotalTokenBalance: number;
    let userOptyTokenBalanceWei;
    let userOptyTokenBalance: number;
    let userTokenOptyTokenBalance: number;
    let optyPoolProxyContract: Contract;
    let optyAaveDepositPoolProxy: Contract;
    let underlyingTokenDecimals: number;
    let underlyingTokenName;
    let strategies: {
        compound: { pool: string; outputToken: string; isBorrow: boolean };
        aave: { pool: string; outputToken: string; isBorrow: boolean };
    };
    let tokensHash: string = "";

    // util function for converting expanded values to Deimals number for readability and Testing
    const fromWei = (x: string) => ethers.utils.formatUnits(x, underlyingTokenDecimals);

    before(async () => {
        // strategyScore = 1
        wallet = await startChain();

        // Instantiate token contract
        tokenContractInstance = new ethers.Contract(
            underlyingToken,
            addressAbis.erc20.abi,
            wallet
        );
        underlyingTokenDecimals = await tokenContractInstance.decimals();
        TEST_AMOUNT = expandToTokenDecimals(TEST_AMOUNT_NUM, underlyingTokenDecimals);
        tokensHash = "0x" + abi.soliditySHA3(["address[]"], [tokens]).toString("hex");

        underlyingTokenName = await tokenContractInstance.symbol();

        console.log(
            "\n------ Deploying Registry, RiskManager and StrategyManager Contracts ---------\n"
        );
        //  Deploying Registry, RiskManager and StrategyManager Contract
        optyRegistry = await deployContract(wallet, OptyRegistry);
        assert.isDefined(optyRegistry, "OptyRegistry contract not deployed");
        console.log("Registry: ", optyRegistry.address);

        riskManager = await deployContract(wallet, RiskManager, [optyRegistry.address]);
        assert.isDefined(riskManager, "RiskManager contract not deployed");
        console.log("Risk Manager: ", riskManager.address);

        optyStrategyManager = await deployContract(wallet, OptyStrategyManager, [
            optyRegistry.address,
        ]);
        assert.isDefined(
            optyStrategyManager,
            "OptyStrategyManager contract not deployed"
        );
        console.log("Strategy Manager: ", optyStrategyManager.address);

        optyTokenBasicPool = await deployContract(wallet, OptyTokenBasicPool, [
            profile,
            riskManager.address,
            underlyingToken,
            optyStrategyManager.address,
        ]);
        assert.isDefined(
            optyTokenBasicPool,
            "OptyTokenBasicPool contract not deployed"
        );

        for (poolProxiesKey in poolProxies) {
            if (poolProxiesKey == "opDAIBsc") {
                console.log("Pool Proxy contracts: ", poolProxies[poolProxiesKey]);
                let optyPoolProxyContracts = poolProxies[poolProxiesKey];

                // let poolProxyConttractKey: keyof typeof poolProxyConttract;
                let count = 1;
                for (let optyPoolProxyContractsKey of optyPoolProxyContracts) {
                    if (count <= 2) {
                        if (
                            poolProxyContract.hasOwnProperty(
                                optyPoolProxyContractsKey.toString()
                            )
                        ) {
                            console.log("coming....");
                            // console.log("key value: ", optyPoolProxyContractsKey.toString())
                            if (
                                optyPoolProxyContractsKey.toString().includes("Borrow")
                            ) {
                                optyPoolProxyContract = await deployContract(
                                    wallet,
                                    poolProxyContract[optyPoolProxyContractsKey],
                                    [optyRegistry.address]
                                );
                            } else {
                                optyPoolProxyContract = await deployContract(
                                    wallet,
                                    poolProxyContract[optyPoolProxyContractsKey]
                                );
                            }
                            optyPoolProxyContractVariables[
                                optyPoolProxyContractsKey
                            ] = optyPoolProxyContract;

                            console.log("Deployed.... ", optyPoolProxyContractsKey);
                            console.log(
                                "Deployed ",
                                optyPoolProxyContractsKey,
                                " address: ",
                                optyPoolProxyContractVariables[
                                    optyPoolProxyContractsKey
                                ].address
                            );
                            assert.isDefined(
                                optyPoolProxyContractVariables[
                                    optyPoolProxyContractsKey
                                ],
                                "optyPoolProxyContract contract not deployed"
                            );
                            for (defiPoolsKey in defiPools) {
                                // console.log("FOR LOOP, POOL NAME: ", defiPoolsKey)
                                // console.log("OPTYPOOLSpROXYcONTRACTSkEY: ", optyPoolProxyContractsKey)
                                if (
                                    defiPoolsKey.toString() ==
                                    optyPoolProxyContractsKey.toString()
                                ) {
                                    // console.log("-- defiPools key: ", defiPoolsKey)
                                    // console.log("-- defiPools key's value: ", defiPools[defiPoolsKey])

                                    // let defiPoolsUnderlyingTokens = defiPools[defiPoolsKey]
                                    // let defiPoolsUnderlyingTokensKey: keyof typeof defiPoolsUnderlyingTokens
                                    let defiPoolsUnderlyingTokens: DefiPools =
                                        defiPools[defiPoolsKey];
                                    // let defiPoolsUnderlyingTokensKey: DP
                                    for (let defiPoolsUnderlyingTokensKey in defiPoolsUnderlyingTokens) {
                                        // console.log("BEFORE POOL NAME: ", defiPoolsKey)
                                        // console.log("-- Underlying Token-- : ", defiPoolsUnderlyingTokens[defiPoolsUnderlyingTokensKey]);
                                        await approveTokenLpToken(defiPoolsUnderlyingTokens[defiPoolsUnderlyingTokensKey].lpToken, defiPoolsUnderlyingTokens[defiPoolsUnderlyingTokensKey].tokens)
                                        await setTokensHashToTokens(defiPoolsUnderlyingTokens[defiPoolsUnderlyingTokensKey].tokens);
                                        if (
                                            defiPoolsKey.toString().includes("Borrow")
                                        ) {
                                            await approveLpCpAndMapLpToPoolProxy(
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].pool,
                                                optyPoolProxyContractVariables[
                                                    optyPoolProxyContractsKey
                                                ].address,
                                                true
                                            );
                                        } else {
                                            console.log(
                                                "-- DEFI POOLS UNDERLYING TOKEN KEY : ",
                                                defiPoolsUnderlyingTokensKey,
                                                " --"
                                            );
                                            console.log(
                                                "-- DEFI POOLS UNDERLYING TOKEN's POOL ADDRESS : ",
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].pool,
                                                " --"
                                            );
                                            await approveLpCpAndMapLpToPoolProxy(
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].pool,
                                                optyPoolProxyContractVariables[
                                                    optyPoolProxyContractsKey
                                                ].address,
                                                false
                                            );
                                        }
                                        await optyRegistry.setLiquidityPoolToLPToken(
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].pool,
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].tokens,
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].lpToken
                                        );
                                    }
                                }
                            }
                        }
                    }
                    count++;
                }
            }
        }
    });

    beforeEach(async () => {
        await checkAndFundWallet();
    });

    async function checkAndFundWallet() {
        // console.log("==== FUNDING WALLET ====")
        userTokenBalanceWei = await tokenContractInstance.balanceOf(wallet.address);
        userInitialTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
        // console.log("User's balance: ", userInitialTokenBalance);
        userOptyTokenBalanceWei = await optyTokenBasicPool.balanceOf(wallet.address);
        userOptyTokenBalance = parseFloat(fromWei(userOptyTokenBalanceWei));
        if (
            userInitialTokenBalance < TEST_AMOUNT_NUM ||
            userInitialTokenBalance == undefined
        ) {
            let FUND_AMOUNT = expandToTokenDecimals(
                TEST_AMOUNT_NUM - userInitialTokenBalance,
                underlyingTokenDecimals
            );
            let TEST_AMOUNT_HEX = "0x" + Number(FUND_AMOUNT).toString(16);

            //  Fund the user's wallet with some amount of tokens
            await fundWallet(underlyingToken, wallet, TEST_AMOUNT_HEX);

            // Check Token and opToken balance of User's wallet and OptyTokenBaiscPool Contract
            userTokenBalanceWei = await tokenContractInstance.balanceOf(wallet.address);
            userInitialTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
            expect(userInitialTokenBalance).to.equal(TEST_AMOUNT_NUM);
        }
    }

    it.skip("should check if the conttacts are deployed", async () => {
        assert.isOk(optyTokenBasicPool.address, "BasicPool Contract is not deployed");
        console.log(
            "\nDeployed OptyTokenBasicPool Contract address: ",
            optyTokenBasicPool.address
        );
        console.log("\nUser's Wallet address: ", wallet.address);
        console.log("\nTokens Hash: ", tokensHash);

        assert.isOk(
            optyPoolProxyContractVariables.CompoundDepositPoolProxy.address,
            "CompoundDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.AaveDepositPoolProxy.address,
            "AaveDepositPoolProxy Contract is not deployed"
        );
        // assert.isOk(optyPoolProxyContractVariables.AaveBorrowPoolProxy.address, "AaveBorrowPoolProxy Contract is not deployed");
        assert.isOk(
            optyPoolProxyContractVariables.FulcrumDepositPoolProxy.address,
            "AaveDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.DForceDepositPoolProxy.address,
            "AaveDepositPoolProxy Contract is not deployed"
        );
    });

    it("should deposit using userDeposit()", async () => {
        await tokenContractInstance.approve(optyTokenBasicPool.address, TEST_AMOUNT);
        expect(
            await tokenContractInstance.allowance(
                wallet.address,
                optyTokenBasicPool.address
            )
        ).to.equal(TEST_AMOUNT);
        const userDepositOutput = await optyTokenBasicPool.userDeposit(TEST_AMOUNT);
        assert.isOk(userDepositOutput, "UserDeposit() call failed");

        // Check Token and opToken balance after userDeposit() call
        userTokenBalanceWei = await tokenContractInstance.balanceOf(wallet.address);
        const userNewTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
        expect(userNewTokenBalance).to.equal(userInitialTokenBalance - TEST_AMOUNT_NUM);

        contractTokenBalanceWei = await tokenContractInstance.balanceOf(
            optyTokenBasicPool.address
        );
        contractTokenBalance = parseFloat(fromWei(contractTokenBalanceWei));
        expect(contractTokenBalance).to.equal(TEST_AMOUNT_NUM);

        userOptyTokenBalanceWei = await optyTokenBasicPool.balanceOf(wallet.address);
        userOptyTokenBalance = parseFloat(fromWei(userOptyTokenBalanceWei));
        expect(userOptyTokenBalance).to.equal(TEST_AMOUNT_NUM);
    });

    // it("should deposit using userDepositRebalance() using each Strategy", async () => {
    //     await  setAndScoreStrategy();
    // });

    // async function setAndScoreStrategy() {
    // for (let strategies of allStrategies.dai.basic) {
    allStrategies.usdc.basic.forEach(async (strategies, index) => {
        if (index <= 1) {
            it(
                "should deposit using userDepositRebalance() using Strategy - " +
                    (index + 1),
                async () => {
                    // console.log("Strategy length: ", strategies.length);
                    let strategySteps: (string | boolean)[][] = [];
                    let previousStepOutputToken = "";
                    for (let index = 0; index < strategies.length; index++) {
                        // console.log("2nd loop");
                        let tempArr: (string | boolean)[] = [];
                        if (previousStepOutputToken.length > 0) {
                            console.log("previous token detected");
                            // let outputTokenHash = "0x" + abi.soliditySHA3(["address[]"], [[previousStepOutputToken]]).toString("hex");
                            await optyRegistry.setTokensHashToTokens([
                                previousStepOutputToken,
                            ]);
                            // await optyRegistry.approveToken(previousStepOutputToken);
                            await optyRegistry.setLiquidityPoolToLPToken(
                                strategies[index].contract,
                                [previousStepOutputToken],
                                strategies[index].outputToken
                            );
                        }
                        // console.log("2nd loop continuess.....")
                        tempArr.push(
                            strategies[index].contract,
                            strategies[index].outputToken,
                            strategies[index].isBorrow
                        );
                        previousStepOutputToken = strategies[index].outputToken;
                        // strategySteps = [tempArr];
                        strategySteps.push(tempArr);
                    }

                    console.log("Strategy Steps: ", strategySteps);
                    const setStrategyTx = await optyRegistry.setStrategy(
                        tokensHash,
                        strategySteps
                    );
                    assert.isDefined(
                        setStrategyTx,
                        "Setting StrategySteps has failed!"
                    );

                    const receipt = await setStrategyTx.wait();
                    let strategyHash = receipt.events[0].args[2];
                    expect(strategyHash.toString().length).to.equal(66);

                    let strategy = await optyRegistry.getStrategy(
                        strategyHash.toString()
                    );
                    if (!strategy["_isStrategy"]) {
                        await optyRegistry.approveStrategy(strategyHash.toString());
                        strategy = await optyRegistry.getStrategy(
                            strategyHash.toString()
                        );
                        assert.isTrue(
                            strategy["_isStrategy"],
                            "Strategy is not approved"
                        );
                        // let strategyScore = count + 1;
                        await optyRegistry.scoreStrategy(
                            strategyHash.toString(),
                            index + 1
                        );
                    }
                    // await checkAndFundWallet();
                    let bestStrategyHash = await riskManager.getBestStrategy(profile, [
                        underlyingToken,
                    ]);
                    console.log("Best Strategy Hash: ", bestStrategyHash);
                    let bestStrategy = await optyRegistry.getStrategy(
                        bestStrategyHash.toString()
                    );
                    console.log("Best Strategy: ", bestStrategy);

                    await testUserDepositRebalance();
                    // console.log("\n---------- UserDepositRebalance() passed for Strategy -", strategyScore, " ------------\n");
                    strategyScore = strategyScore + 1;
                }
            );
        }
    });
    // let bestStrategyHash = await riskManager.getBestStrategy(profile, [underlyingToken]);
    // console.log("Best Strategy Hash: ",bestStrategyHash);
    // let bestStrategy = await optyRegistry.getStrategy(bestStrategyHash.toString());
    // console.log("Best Strategy: ", bestStrategy)
    // awaut testUserDepositRebalance()

    // }

    // it("should deposit via userDepositRebalance() using the best strategy", async () => {
    //     testUserDepositRebalance();
    // })

    async function testUserDepositRebalance() {
        // console.log("---- TESTING USER_DEPOSIT_REBALANCE ----");
        // console.log("-- OPTY token basic pool address: ", optyTokenBasicPool.address);
        // let optyTokenName = await optyTokenBasicPool.name();
        // console.log("OPTY USDC BASIC POOL CONTRACT NAME: ", optyTokenName);
        // let optyTokenDecimals = await optyTokenBasicPool.decimals();
        // console.log("Opty Token decimals: ", optyTokenDecimals);
        // console.log("TEST AMOUNT: ", TEST_AMOUNT);
        // let tokenName = await tokenContractInstance.name();
        // console.log("TOKEN NAME: ", tokenName);
        // let tokenDecimals = await tokenContractInstance.decimals();
        // console.log("TOKEN DECIMALS: ", tokenDecimals);
        // userTokenBalanceWei = await tokenContractInstance.balanceOf(wallet.address);
        // userInitialTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
        // console.log("User's balance in test case: ", userInitialTokenBalance);
        await tokenContractInstance.approve(optyTokenBasicPool.address, TEST_AMOUNT, {
            gasLimit: 1000000,
        });
        expect(
            await tokenContractInstance.allowance(
                wallet.address,
                optyTokenBasicPool.address
            )
        ).to.equal(TEST_AMOUNT);

        const userDepositRebalanceTx = await optyTokenBasicPool.userDepositRebalance(
            TEST_AMOUNT
        );
        assert.isOk(userDepositRebalanceTx, "UserDepositRebalance() call failed");

        // Check Token and opToken balance after userDeposit() call
        userTokenBalanceWei = await tokenContractInstance.balanceOf(wallet.address);
        const userNewTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
        expect(userNewTokenBalance).to.equal(userInitialTokenBalance - TEST_AMOUNT_NUM);
        userInitialTokenBalance = userNewTokenBalance;

        contractTokenBalanceWei = await tokenContractInstance.balanceOf(
            optyTokenBasicPool.address
        );
        contractTokenBalance = parseFloat(fromWei(contractTokenBalanceWei));
        expect(contractTokenBalance).to.equal(0);

        userOptyTokenBalanceWei = await optyTokenBasicPool.balanceOf(wallet.address);
        const userNewOptyTokenBalance = parseFloat(fromWei(userOptyTokenBalanceWei));
        //  TODO: Need to fix this assertion error for the decimals values - Deepanshu
        // expect(userNewOptyTokenBalance).to.equal(userOptyTokenBalance + TEST_AMOUNT_NUM);
        userOptyTokenBalance = userNewOptyTokenBalance;
    }

    async function approveTokenLpToken(lpToken: string, tokens: string[]) {
        let lpTokenApproveStatus = await optyRegistry.tokens(lpToken)
        if (!lpTokenApproveStatus) {
            await optyRegistry.approveToken(lpToken)
        }
        // console.log("lpTokenStatus: ", lpTokenApproveStatus)
        tokens.forEach(async (token) => {
            let tokenApproveStatus = await optyRegistry.tokens(token)
            if (!tokenApproveStatus) {
                await optyRegistry.approveToken(token)
            }
            // console.log("tokenApprove Status: ", tokenApproveStatus)
        })
    }

    async function setTokensHashToTokens(tokens: string[]) {
        // 0x50440c05332207ba7b1bb0dcaf90d1864e3aa44dd98a51f88d0796a7623f0c80
        let tokensHash = "0x" + abi.soliditySHA3(["address[]"], [tokens]).toString("hex");
        let tokensHashIndex: ethers.utils.BigNumber = await optyRegistry.tokensHashToTokens(tokensHash)
        // console.log("tokensHashIndex: ", tokensHashIndex)
        if (tokensHashIndex.eq(0) && (tokensHash !== "0x50440c05332207ba7b1bb0dcaf90d1864e3aa44dd98a51f88d0796a7623f0c80")) {
            // console.log("tokensHashIndex in  IF CONDITION: ", tokensHashIndex)
            await optyRegistry.setTokensHashToTokens(tokens);
        }
    }

    async function approveLpCpAndMapLpToPoolProxy(
        pool: string,
        poolProxy: string,
        isBorrow: boolean
    ) {
        let liquidityPools = await optyRegistry.liquidityPools(pool);
        let creditPools = await optyRegistry.creditPools(pool);
        if (!liquidityPools.isLiquidityPool) {
            // console.log("Approving Liquidity Pool")
            await optyRegistry.approveLiquidityPool(pool);
        }
        if (!creditPools.isLiquidityPool) {
            // console.log("Approving  Credit Pool")
            await optyRegistry.approveCreditPool(pool);
        }
        if (isBorrow) {
            console.log("Mapping Borrow Pool Proxy");
            await optyRegistry.setLiquidityPoolToBorrowPoolProxy(pool, poolProxy);
        } else {
            console.log("Mapping Deposit Pool Proxy");
            await optyRegistry.setLiquidityPoolToDepositPoolProxy(pool, poolProxy);
        }
    }
});
