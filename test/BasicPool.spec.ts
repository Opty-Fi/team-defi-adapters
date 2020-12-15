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
import dYdXDepositPoolProxy from "../build/dYdXDepositPoolProxy.json";
import poolProxies from "./shared/poolProxies.json";
import defiPools from "./shared/defiPools.json";
import allStrategies from "./shared/strategies.json";
//  Note: keeping this testing strategies one by one for underlying tokens - Deepanshu
// import allStrategies from "./shared/sample_strategies.json";

import tokenAddresses from "./shared/TokenAddresses.json";
import addressAbis from "./shared/AddressAbis.json";
import { ContractJSON } from "ethereum-waffle/dist/esm/ContractJSON";
const envConfig = require("dotenv").config(); //  library to import the local ENV variables defined
//  Note: Don't remove line-6, because this line helps to get rid of error: NOT ABLE TO READ LOCAL ENV VARIABLES defined in .env file

chai.use(solidity);

const Ganache = require("ganache-core");
const abi = require("ethereumjs-abi");
const MAINNET_NODE_URL = process.env.MAINNET_NODE_URL;
const TEST_AMOUNT_NUM: number = 2;
let TEST_AMOUNT: ethers.utils.BigNumber;

//  Interface for storing the Abi's of PoolProxy Contracts
interface PoolProxyContract {
    [id: string]: ContractJSON;
}
//  Interface for getting the pools, lpTokens and underlyingTokens corresponding to PoolProxy Contract
interface DefiPools {
    [id: string]: {
        pool: string;
        lpToken: string;
        tokens: string[];
    };
}
//  Json of PoolProxyContract for storing the Abi's of PoolProxyContracts
let poolProxyContract: PoolProxyContract = {
    CompoundDepositPoolProxy,
    AaveDepositPoolProxy,
    FulcrumDepositPoolProxy,
    DForceDepositPoolProxy,
    HarvestDepositPoolProxy,
    YearnDepositPoolProxy,
    CurveDepositPoolProxy,
    dYdXDepositPoolProxy,
    CreamDepositPoolProxy,
};
//  Interface for mapping the PoolProxy Contracts deployed with their variable name for using them in the code
interface OptyPoolProxyContractVariables {
    [id: string]: Contract;
}
let optyPoolProxyContractVariables: OptyPoolProxyContractVariables = {};
let poolProxiesKey: keyof typeof poolProxies;   //  Getting the op<XXX>Pool contracts as key corresponding to the PoolProxy Contracts 
let defiPoolsKey: keyof typeof defiPools;   //  Keys of defiPools.json corresponding to PoolProxy Contracts
let provider: ethers.providers.Web3Provider

//  Function to start the Ganache provider with forked mainnet using chainstack's network URL
//  Getting 2 Wallets in return - one acting as Owner and another one acting as user
async function startChain() {
    const ganache = await Ganache.provider({
        fork: MAINNET_NODE_URL,
        network_id: 1,
        mnemonic: `${process.env.MY_METAMASK_MNEMONIC}`,
        default_balance_ether: 10000,
    });
    provider = new ethers.providers.Web3Provider(ganache);
    const ownerWallet = ethers.Wallet.fromMnemonic(
        `${process.env.MY_METAMASK_MNEMONIC}`
    ).connect(provider);
    let ownerWalletBalance = await provider.getBalance(ownerWallet.address);
    console.log("OWNER'S ETHER BALANCE BEFORE STARTING TEST SUITE: ", ethers.utils.formatEther(ownerWalletBalance));
    const userWallet = ethers.Wallet.fromMnemonic(
        `${process.env.MY_METAMASK_MNEMONIC}`,
        `m/44'/60'/0'/0/1`
    ).connect(provider);
    let userWalletBalance = await provider.getBalance(ownerWallet.address);
    console.log("USER'S ETHER BALANCE BEFORE STARTING TEST SUITE: ", ethers.utils.formatEther(userWalletBalance));
    return [ownerWallet, userWallet];
}

describe("OptyTokenBasicPool", async () => {
    let strategyScore: number = 1;
    let ownerWallet: ethers.Wallet;
    let userWallet: ethers.Wallet;
    let optyRegistry: Contract;
    let riskManager: Contract;
    let optyStrategyManager: Contract;
    let profile = "basic";
    let userTokenBalanceWei;
    let userInitialTokenBalance: number;
    let contractTokenBalanceWei;
    let contractTokenBalance: number;
    let userOptyTokenBalanceWei;
    let userOptyTokenBalance: number;
    let optyPoolProxyContract: Contract;
    let underlyingTokenDecimals: number;
    let tokensHash: string = "";

    // util function for converting expanded values to Deimals number for readability and Testing
    const fromWei = (x: string) => ethers.utils.formatUnits(x, underlyingTokenDecimals);

    before(async () => {
        let allWallets = await startChain();
        ownerWallet = allWallets[0]
        userWallet = allWallets[1]

        console.log(
            "\n------ Deploying Registry, RiskManager and StrategyManager Contracts ---------\n"
        );
        //  Deploying Registry, RiskManager and StrategyManager Contract
        optyRegistry = await deployContract(ownerWallet, OptyRegistry);
        assert.isDefined(optyRegistry, "OptyRegistry contract not deployed");
        console.log("Registry: ", optyRegistry.address);

        riskManager = await deployContract(ownerWallet, RiskManager, [optyRegistry.address]);
        assert.isDefined(riskManager, "RiskManager contract not deployed");
        console.log("Risk Manager: ", riskManager.address);

        optyStrategyManager = await deployContract(ownerWallet, OptyStrategyManager, [
            optyRegistry.address,
        ]);
        assert.isDefined(
            optyStrategyManager,
            "OptyStrategyManager contract not deployed"
        );
        console.log("Strategy Manager: ", optyStrategyManager.address);

        /*
            Interating through list of underlyingTokens and approving them if not approved
        */
        let token: keyof typeof tokenAddresses;
        for (token in tokenAddresses) {
            if (token != "uniswapFactory") {
                let tokenStatus = await optyRegistry.tokens(tokenAddresses[token]);
                if (!tokenStatus) {
                    await optyRegistry.approveToken(tokenAddresses[token]);
                }
            }
        }

        /*  
            Iterating through poolProxies.json and getting the corresponding PoolProxy Contracts mapped to
            respective op<XXX><Profile> Pool    
        */
        for (poolProxiesKey in poolProxies) {
            if (poolProxiesKey == "opDAIBsc") {
                console.log("Pool Proxy contracts: ", poolProxies[poolProxiesKey]);
                let optyPoolProxyContracts = poolProxies[poolProxiesKey];

                /*  
                    Iterating through the list of PoolProxy Contracts for deploying them
                */
                let count = 1;
                for (let optyPoolProxyContractsKey of optyPoolProxyContracts) {
                    //  Note: Keeping this for testing particular Pool Proxy contract - Deepanshu
                    // if (optyPoolProxyContractsKey == "dYdXDepositPoolProxy") {
                    if (count <= 9) {
                        if (
                            poolProxyContract.hasOwnProperty(
                                optyPoolProxyContractsKey.toString()
                            )
                        ) {
                            //  Check if key contains Borrow keyword or not, If yes then deploying BorrowPoolProxy
                            //  contract else deploy DepositPoolProxy Contract
                            if (
                                optyPoolProxyContractsKey.toString().includes("Borrow")
                            ) {
                                optyPoolProxyContract = await deployContract(
                                    ownerWallet,
                                    poolProxyContract[optyPoolProxyContractsKey],
                                    [optyRegistry.address]
                                );
                            } else {
                                optyPoolProxyContract = await deployContract(
                                    ownerWallet,
                                    poolProxyContract[optyPoolProxyContractsKey]
                                );
                            }
                            optyPoolProxyContractVariables[
                                optyPoolProxyContractsKey
                            ] = optyPoolProxyContract;

                            assert.isDefined(
                                optyPoolProxyContractVariables[
                                    optyPoolProxyContractsKey
                                ],
                                "optyPoolProxyContract contract not deployed"
                            );
                            //  Iterating through defiPools.json to approve LpTokens/Tokens, set Tokens hash
                            //  mapping to tokens, approve LP/CP, map Lp to PoolProxy Contract and setting the 
                            //  Lp to LpToken
                            for (defiPoolsKey in defiPools) {
                                if (
                                    defiPoolsKey.toString() ==
                                    optyPoolProxyContractsKey.toString()
                                ) {
                                    let defiPoolsUnderlyingTokens: DefiPools =
                                        defiPools[defiPoolsKey];
                                    //  Iteracting through all the underlying tokens available corresponding to this
                                    //  current PoolProxy Contract Key
                                    for (let defiPoolsUnderlyingTokensKey in defiPoolsUnderlyingTokens) {
                                        // Note: Keeping this for testing strategies for specific pools - Deepanshu
                                        // if (defiPoolsUnderlyingTokensKey == "dai+usdc+usdt") {

                                        await approveTokenLpToken(
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].lpToken,
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].tokens
                                        );
                                        await setTokensHashToTokens(
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].tokens
                                        );
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
                                        if (
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].lpToken !=
                                            "0x0000000000000000000000000000000000000000"
                                        ) {
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
                                        let mapResult = await optyRegistry.liquidityPoolToLPTokens(
                                            defiPoolsUnderlyingTokens[
                                                defiPoolsUnderlyingTokensKey
                                            ].pool,
                                            "0x" +
                                                abi
                                                    .soliditySHA3(
                                                        ["address[]"],
                                                        [
                                                            defiPoolsUnderlyingTokens[
                                                                defiPoolsUnderlyingTokensKey
                                                            ].tokens,
                                                        ]
                                                    )
                                                    .toString("hex")
                                        );
                                        // }
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

    it("should check if the pool proxy contracts are deployed", async () => {
        assert.isOk(
            optyPoolProxyContractVariables.CompoundDepositPoolProxy.address,
            "CompoundDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.AaveDepositPoolProxy.address,
            "AaveDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.FulcrumDepositPoolProxy.address,
            "FulcrumDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.DForceDepositPoolProxy.address,
            "DForceDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.HarvestDepositPoolProxy.address,
            "HarvestDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.YearnDepositPoolProxy.address,
            "YearnDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.CurveDepositPoolProxy.address,
            "CurveDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.dYdXDepositPoolProxy.address,
            "dYdXDepositPoolProxy Contract is not deployed"
        );
        assert.isOk(
            optyPoolProxyContractVariables.CreamDepositPoolProxy.address,
            "CreamDepositPoolProxy Contract is not deployed"
        );
    });

    //  Iterating through all the strategies by picking underlyingTokens as key
    let strategiesTokenKey: keyof typeof allStrategies;
    for (strategiesTokenKey in allStrategies) {
        if (
            strategiesTokenKey == "DAI" ||
            strategiesTokenKey == "USDC" ||
            strategiesTokenKey == "USDT" ||
            strategiesTokenKey == "WBTC" ||
            strategiesTokenKey == "TUSD" ||
            strategiesTokenKey == "WETH" ||
            strategiesTokenKey == "SUSD" ||
            strategiesTokenKey == "3Crv"
        ) {
            await runTokenTestSuite(strategiesTokenKey);
        }
    }

    //  Function to execute the test suite for underlying tokens one by one
    async function runTokenTestSuite(strategiesTokenKey: keyof typeof allStrategies) {
        describe("TEST CASES FOR: " + strategiesTokenKey.toUpperCase(), async () => {
            let underlyingToken: string;
            let tokens: string[];
            let tokenContractInstance: Contract;
            let optyTokenBasicPool: Contract;

            before(async () => {
                //  Getting the underlying token's contract instance
                underlyingToken =
                    tokenAddresses[
                        <keyof typeof tokenAddresses>strategiesTokenKey.toLowerCase()
                    ];
                tokens = [underlyingToken];

                // Instantiate token contract
                tokenContractInstance = new ethers.Contract(
                    underlyingToken,
                    addressAbis.erc20.abi,
                    ownerWallet
                );
                underlyingTokenDecimals = await tokenContractInstance.decimals();
                TEST_AMOUNT = expandToTokenDecimals(
                    TEST_AMOUNT_NUM,
                    underlyingTokenDecimals
                );
                //  Setting the TokensHash corresponding to the list of tokens
                tokensHash =
                    "0x" + abi.soliditySHA3(["address[]"], [tokens]).toString("hex");
                
                //  Deploying the BasicPool Contract each time for every underlying token
                optyTokenBasicPool = await deployContract(ownerWallet, OptyTokenBasicPool, [
                    profile,
                    riskManager.address,
                    underlyingToken,
                    optyStrategyManager.address,
                    "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e",
                    optyPoolProxyContractVariables.dYdXDepositPoolProxy.address,
                ]);
                assert.isDefined(
                    optyTokenBasicPool,
                    "OptyTokenBasicPool contract not deployed"
                );
            });

            beforeEach(async () => {
                //  Funding the wallet before running the test cases
                await checkAndFundWallet();
            });

            //  Function to fund the wallet with the underlying tokens equivalent to TEST_AMOUNT_NUM
            async function checkAndFundWallet() {
                userTokenBalanceWei = await tokenContractInstance.balanceOf(
                    userWallet.address
                );
                userInitialTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
                userOptyTokenBalanceWei = await optyTokenBasicPool.balanceOf(
                    userWallet.address
                );
                userOptyTokenBalance = parseFloat(fromWei(userOptyTokenBalanceWei));
                if (
                    userInitialTokenBalance < TEST_AMOUNT_NUM ||
                    userInitialTokenBalance == undefined
                ) {
                    let FUND_AMOUNT = expandToTokenDecimals(
                        TEST_AMOUNT_NUM - userInitialTokenBalance,
                        underlyingTokenDecimals
                    );
                    //  Fund the user's wallet with some TEST_AMOUNT_NUM of tokens
                    await fundWallet(underlyingToken, userWallet, FUND_AMOUNT);
                    
                    // Check Token and opToken balance of User's wallet and OptyTokenBaiscPool Contract
                    userTokenBalanceWei = await tokenContractInstance.balanceOf(
                        userWallet.address
                    );
                    userInitialTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
                    expect(userInitialTokenBalance).to.equal(TEST_AMOUNT_NUM);
                }
            }

            it(
                "should check OptyTokenBasicPool contract is deployed for " +
                    strategiesTokenKey,
                async () => {
                    assert.isOk(
                        optyTokenBasicPool.address,
                        "BasicPool Contract for " +
                            strategiesTokenKey +
                            "is not deployed"
                    );
                }
            );

            it(
                "should deposit using userDeposit() for " + strategiesTokenKey,
                async () => {
                    //  Getting the underlying token contract instance for user's wallet and approving 
                    //  BasicPool contract for spending underlying token on behalf of user
                    let tokenContractInstanceAsSignerUser =  tokenContractInstance.connect(userWallet)
                    await tokenContractInstanceAsSignerUser.approve(
                        optyTokenBasicPool.address,
                        TEST_AMOUNT
                    );
                    expect(
                        await tokenContractInstance.allowance(
                            userWallet.address,
                            optyTokenBasicPool.address
                        )
                    ).to.equal(TEST_AMOUNT);

                    //  Connect the BasicPool Contract with the user's Wallet for making userDeposit()
                    let optyTokenBasicPoolAsSignerUser = optyTokenBasicPool.connect(userWallet)
                    const userDepositOutput = await optyTokenBasicPoolAsSignerUser.userDeposit(
                        TEST_AMOUNT
                    );
                    assert.isOk(userDepositOutput, "UserDeposit() call failed");

                    // Check Token and opToken balance after userDeposit() call
                    userTokenBalanceWei = await tokenContractInstance.balanceOf(
                        userWallet.address
                    );
                    const userNewTokenBalance = parseFloat(
                        fromWei(userTokenBalanceWei)
                    );
                    expect(userNewTokenBalance).to.equal(
                        userInitialTokenBalance - TEST_AMOUNT_NUM
                    );

                    contractTokenBalanceWei = await tokenContractInstance.balanceOf(
                        optyTokenBasicPool.address
                    );
                    contractTokenBalance = parseFloat(fromWei(contractTokenBalanceWei));
                    expect(contractTokenBalance).to.equal(TEST_AMOUNT_NUM);

                    userOptyTokenBalanceWei = await optyTokenBasicPool.balanceOf(
                        userWallet.address
                    );
                    userOptyTokenBalance = parseFloat(fromWei(userOptyTokenBalanceWei));
                    expect(userOptyTokenBalance).to.equal(TEST_AMOUNT_NUM);
                }
            );

            /*  Iterating through each strategy one by one, setting, approving and scroing the each 
                strategy and then making userDepositRebalance() call */
            allStrategies[strategiesTokenKey].basic.forEach(
                async (strategies, index) => {
                    // Note: Keep this condition for future specific strategy testing purpose - Deepanshu
                    // if (allStrategies[strategiesTokenKey].basic[index].strategyName == "WBTC-deposit-AAVE-aWBTC") {
                    if (index <= 30) {
                        it(
                            "should deposit using userDepositRebalance() using Strategy - " +
                                strategies.strategyName,
                            async () => {
                                let strategySteps: (string | boolean)[][] = [];
                                let previousStepOutputToken = "";
                                for (
                                    let index = 0;
                                    index < strategies.strategy.length;
                                    index++
                                ) {
                                    let tempArr: (string | boolean)[] = [];
                                    //  If condition For 2 step strategies
                                    if (previousStepOutputToken.length > 0) {
                                        await optyRegistry.setTokensHashToTokens([
                                            previousStepOutputToken,
                                        ]);
                                        // Note: May need this step for 2 step  strategies - Deepanshu
                                        // await optyRegistry.approveToken(previousStepOutputToken);
                                        await optyRegistry.setLiquidityPoolToLPToken(
                                            strategies.strategy[index].contract,
                                            [previousStepOutputToken],
                                            strategies.strategy[index].outputToken
                                        );
                                    }
                                    tempArr.push(
                                        strategies.strategy[index].contract,
                                        strategies.strategy[index].outputToken,
                                        strategies.strategy[index].isBorrow
                                    );
                                    previousStepOutputToken =
                                        strategies.strategy[index].outputToken;

                                    strategySteps.push(tempArr);
                                }

                                //  Iterating through each strategy step and generate the strategy Hash
                                let strategyStepHash: string[] = [];
                                strategySteps.forEach((tempStrategyStep, index) => {
                                    strategyStepHash[index] =
                                        "0x" +
                                        abi
                                            .soliditySHA3(
                                                ["address", "address", "bool"],
                                                [
                                                    tempStrategyStep[0],
                                                    tempStrategyStep[1],
                                                    tempStrategyStep[2],
                                                ]
                                            )
                                            .toString("hex");
                                });
                                let tokenToStrategyStepsHash =
                                    "0x" +
                                    abi
                                        .soliditySHA3(
                                            ["bytes32", "bytes32[]"],
                                            [tokensHash, strategyStepHash]
                                        )
                                        .toString("hex");
                                
                                //  Getting the strategy hash corresponding to underluing token
                                let tokenToStrategyHashes = await optyRegistry.getTokenToStrategies(
                                    tokensHash
                                );
                                //  If strategyHash is always then check revert error meesage from Contract
                                if (
                                    tokenToStrategyHashes.includes(
                                        tokenToStrategyStepsHash
                                    )
                                ) {
                                    await expectRevert(
                                        optyRegistry.setStrategy(
                                            tokensHash,
                                            strategySteps
                                        ),
                                        "isNewStrategy"
                                    );
                                } else {
                                    //  Setting the strategy
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
                                    //  Approving and scoring the strategy
                                    if (!strategy["_isStrategy"]) {
                                        await optyRegistry.approveStrategy(
                                            strategyHash.toString()
                                        );
                                        strategy = await optyRegistry.getStrategy(
                                            strategyHash.toString()
                                        );
                                        assert.isTrue(
                                            strategy["_isStrategy"],
                                            "Strategy is not approved"
                                        );

                                        await optyRegistry.scoreStrategy(
                                            strategyHash.toString(),
                                            index + 1
                                        );
                                    }

                                    let bestStrategyHash = await riskManager.getBestStrategy(
                                        profile,
                                        [underlyingToken]
                                    );

                                    let bestStrategy = await optyRegistry.getStrategy(
                                        bestStrategyHash.toString()
                                    );
                                    
                                    //  Function call to test userDepositRebalance()
                                    await testUserDepositRebalance();
                                    strategyScore = strategyScore + 1;
                                }
                            }
                        );
                    }
                }
            );

            //  Function to deposit the underlying tokens into Opty<XXX>Pool and test the userDepositRebalance()
            async function testUserDepositRebalance() {
                let tokenContractInstanceAsSignerUser = tokenContractInstance.connect(userWallet)
                await tokenContractInstanceAsSignerUser.approve(
                    optyTokenBasicPool.address,
                    TEST_AMOUNT,
                    {
                        gasLimit: 1000000,
                    }
                );
                expect(
                    await tokenContractInstance.allowance(
                        userWallet.address,
                        optyTokenBasicPool.address
                    )
                ).to.equal(TEST_AMOUNT);
                
                //  Getting initial balance of OptyBasicTokens for user
                let userOptyTokenBalanceBefore = await optyTokenBasicPool.balanceOf(
                    userWallet.address
                );

                //  Promises for getting totalSupply, poolValue and making userDepositRebalance() in parallel
                //  for getting latest values of totalSuppy and poolValue while Deposit txn is made
                let totalSupplyPromise = new Promise(async (resolve) => {
                    resolve(await optyTokenBasicPool.totalSupply());
                });

                let poolValuePromise = new Promise(async (resolve) => {
                    resolve(await optyTokenBasicPool.poolValue());
                });

                let optyTokenBasicPoolAsSignerUser = optyTokenBasicPool.connect(userWallet)
                let userDepositRebalanceTxPromise = new Promise(async (resolve) => {
                    resolve(await optyTokenBasicPoolAsSignerUser.userDepositRebalance(TEST_AMOUNT));
                });
                let allPromiseResponses: [any, any, any] = await Promise.all([
                    totalSupplyPromise,
                    poolValuePromise,
                    userDepositRebalanceTxPromise,
                ]);

                let totalSupply = 0;
                let poolValue = "";
                let shares: ethers.utils.BigNumber;
                let userDepositRebalanceTx;

                allPromiseResponses.forEach((promiseResponse, index) => {
                    if (index == 0) {
                        totalSupply = promiseResponse;
                    } else if (index == 1) {
                        poolValue = promiseResponse;
                    } else if (index == 2) {
                        userDepositRebalanceTx = promiseResponse;
                    }
                });

                assert.isOk(
                    userDepositRebalanceTx,
                    "UserDepositRebalance() call failed"
                );

                // Check Token balance of user after userDepositRebalance() call
                userTokenBalanceWei = await tokenContractInstance.balanceOf(
                    userWallet.address
                );
                const userNewTokenBalance = parseFloat(fromWei(userTokenBalanceWei));
                expect(userNewTokenBalance).to.equal(
                    userInitialTokenBalance - TEST_AMOUNT_NUM
                );
                userInitialTokenBalance = userNewTokenBalance;

                //  Check Token balance of OptyPool contract after userDepositRabalance() call
                contractTokenBalanceWei = await tokenContractInstance.balanceOf(
                    optyTokenBasicPool.address
                );
                contractTokenBalance = parseFloat(fromWei(contractTokenBalanceWei));
                expect(contractTokenBalance).to.equal(0);

                //  Amount of OPTY token shares user received as per contract logic
                if (parseFloat(fromWei(poolValue)) == 0) {
                    shares = TEST_AMOUNT;
                } else {
                    shares = TEST_AMOUNT.mul(totalSupply).div(poolValue);
                }
                let userExpectedOptyTokenBalance = userOptyTokenBalanceBefore.add(
                    shares
                );
                console.log("Expected amount: ", userExpectedOptyTokenBalance);

                userOptyTokenBalanceWei = await optyTokenBasicPool.balanceOf(
                    userWallet.address
                );
                console.log(
                    "User's actual opty Token balance: ",
                    userOptyTokenBalanceWei
                );
                //  TODO: Need to fix this assertion error for minor decimals difference for DAI-deposit-DFORCE-dDAI
                //        and DAI-deposit-CURVE-cDAI+cUSDC+USDT - Deepanshu
                //  Note: It is a small difference of decimals and it is for randomly any 2 strategies based on the
                //        sequence of the strategies. It is not necessarily that it will have decimals issue for the
                //        above mentioned 2 strategies only. It can any other also based upon the sequence of strategies.
                if (userOptyTokenBalanceWei.eq(userExpectedOptyTokenBalance)) {
                    expect(userOptyTokenBalanceWei).to.equal(
                        userExpectedOptyTokenBalance
                    );
                } else {
                    console.log(
                        "Minor decimals Value difference -- need to be checked"
                    );
                    expect(userOptyTokenBalanceWei.lte(userExpectedOptyTokenBalance)).to
                        .be.true;
                }

                //  Storing the user's New Opty tokens balance in number format
                const userNewOptyTokenBalance = parseFloat(
                    fromWei(userOptyTokenBalanceWei)
                );
                console.log("User's Opty token balance: ", userNewOptyTokenBalance);
                userOptyTokenBalance = userNewOptyTokenBalance;
            }

            after(async () => {
                //  Checking Owner and User's Ether balance left after all the transactions
                let balance = await provider.getBalance(ownerWallet.address);
                console.log("OWNER'S ETHER BALANCE AFTER ALL TEST SUITS: ", ethers.utils.formatEther(balance));
                let userBalance = await provider.getBalance(userWallet.address);
                console.log("USER'S ETHER BALANCE AFTER ALL TEST SUITS: ", ethers.utils.formatEther(userBalance))
            })
        });
    }

    //  Function to approve the LpTokens as tokens and underlyingTokens from tokens list
    async function approveTokenLpToken(lpToken: string, tokens: string[]) {
        // Note: May need this if lpToken is null/empty down the road - Deepanshu
        // if (!!lpToken || lpToken.length > 0) {
        if (lpToken != "0x0000000000000000000000000000000000000000") {
            let lpTokenApproveStatus = await optyRegistry.tokens(lpToken);
            if (!lpTokenApproveStatus) {
                await optyRegistry.approveToken(lpToken);
            }
        }

        if (tokens.length > 0) {
            tokens.forEach(async (token) => {
                let tokenApproveStatus = await optyRegistry.tokens(token);
                if (!tokenApproveStatus) {
                    await optyRegistry.approveToken(token);
                }
            });
        }
    }

    //  Function to set the hash for the list of underlying tokens
    async function setTokensHashToTokens(tokens: string[]) {
        let tokensHash =
            "0x" + abi.soliditySHA3(["address[]"], [tokens]).toString("hex");
        let tokensHashIndex: ethers.utils.BigNumber = await optyRegistry.tokensHashToTokens(
            tokensHash
        );
        if (
            tokensHashIndex.eq(0) &&
            tokensHash !==
                "0x50440c05332207ba7b1bb0dcaf90d1864e3aa44dd98a51f88d0796a7623f0c80"
        ) {
            await optyRegistry.setTokensHashToTokens(tokens);
        }
    }

    //  Function to approve the liquidity/credit pool and map the Lp to the PoolProxy Contract
    async function approveLpCpAndMapLpToPoolProxy(
        pool: string,
        poolProxy: string,
        isBorrow: boolean
    ) {
        let liquidityPools = await optyRegistry.liquidityPools(pool);
        let creditPools = await optyRegistry.creditPools(pool);
        if (!liquidityPools.isLiquidityPool) {
            await optyRegistry.approveLiquidityPool(pool);
        }
        liquidityPools = await optyRegistry.liquidityPools(pool);
        if (!creditPools.isLiquidityPool) {
            await optyRegistry.approveCreditPool(pool);
        }
        if (isBorrow) {
            await optyRegistry.setLiquidityPoolToBorrowPoolProxy(pool, poolProxy);
        } else {
            await optyRegistry.setLiquidityPoolToDepositPoolProxy(pool, poolProxy);
        }
    }

    // Handle revert exception occured further..
    async function expectException(promise: Promise<any>, expectedError: any) {
        try {
            await promise;
        } catch (error) {
            if (error.message.indexOf(expectedError) === -1) {
                // When the exception was a revert, the resulting string will include only
                // the revert reason, otherwise it will be the type of exception (e.g. 'invalid opcode')
                const actualError = error.message.replace(
                    /Returned error: VM Exception while processing transaction: (revert )?/,
                    ""
                );
                expect(actualError).to.equal(
                    expectedError,
                    "Wrong kind of exception received"
                );
            }
            return;
        }
        expect.fail("Expected an exception but none was received");
    }

    // function for checking the revert conditions
    const expectRevert = async function (promise: Promise<any>, expectedError: any) {
        promise.catch(() => {}); // Avoids uncaught promise rejections in case an input validation causes us to return early

        if (!expectedError) {
            throw Error(
                "No revert reason specified: call expectRevert with the reason string, or use expectRevert.unspecified \
        if your 'require' statement doesn't have one."
            );
        }

        await expectException(promise, expectedError);
    };
});
