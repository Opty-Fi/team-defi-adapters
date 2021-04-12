require("dotenv").config();
import chai, { assert, expect } from "chai";
import { Contract, ethers } from "ethers";
import { solidity, deployContract } from "ethereum-waffle";
import { program } from "commander";
import { codeProviderContract } from "./shared/ProtocolCodeProviderContracts";
import * as utilities from "./shared/utilities";
import * as PoolContracts from "./shared/PoolContracts";
import * as GovernanceContracts from "./shared/GovernanceContract";
import * as OtherImports from "./shared/OtherImports";
import * as RegistryFunctions from "./shared/RegistryFunctions";
import * as Interfaces from "./shared/interfaces";
import * as Types from "./shared/types";
import * as Constants from "./shared/constants";
import * as CurveFunctions from "./shared/Curve/Curve";
import EmergencyBrakeJSON from "../build/TestingEmergencyBrakeRP2.json";
import { setBestAdvanceStrategy } from "./shared/StrategyProviderFunctions";
chai.use(solidity);

program
    .description("Takes symbol and recipient, send tokens to recipient")
    .option(
        "-s, --symbol <dai|usdc|usdt|wbtc|weth|susd|tusd|busd|3crv|link|renbtc|knc|zrx|uni|bat|mkr|comp|yfi|aave|hbtc|rep>",
        "stable coin symbol"
    )
    .option("-rf, --profile <string>", "profile", "basic")
    .option("-sn, --strategyName <string>", "name of the strategy to run")
    .option("-ta, --testAmount <number>", "amount with which you want to test", "6")
    .option(
        "-sc, --strategiesCount <number>",
        "number of strategies you want to run",
        "0"
    )
    .option(
        "-db, --insertGasRecordsInDB <boolean>",
        "Insert GasUsed Records into DB",
        false
    )
    .option(
        "-wf, --writeGasRecordsInFile <boolean>",
        "Generate JSON file having all the GasUsed Records",
        false
    )
    .option(
        "-v, --runTimeVersion <string>",
        "version of the gasUsed records stored",
        "0.0.3"
    )
    .option(
        "-cp, --codeProvider <string>",
        "code provider to deploy if you want to give"
    )
    .usage("-s <token-symbol> ")
    .version("0.0.1")
    .action(async (command: Types.cmdType) => {
        let underlyingTokenSymbol: string; //  keep track of underlying token
        let TEST_AMOUNT_NUM: number;
        let TEST_AMOUNT: ethers.BigNumber; //  convert the test amount passed in to big number for testing
        const optyCodeProviderContractVariables: Interfaces.OptyCodeProviderContractVariables = {};
        let defiPoolsKey: keyof typeof OtherImports.defiPoolsAdv; //  Keys of defiPoolsAdv.json corresponding to CodeProvider Contracts
        let provider: ethers.providers.Web3Provider;
        if (command.symbol) {
            underlyingTokenSymbol = command.symbol.toString().toUpperCase();
        }
        //  Fetch the test amount from command line and if not found, then  use the default one
        if (command.testAmount > 0) {
            TEST_AMOUNT_NUM = command.testAmount;
        } else {
            console.error("ERROR: Invalid  TEST_AMOUNT entered for testing");
            process.exit(1);
        }

        if (command.profile === "advanced") {
            describe("OPTokenAdvanceVault", async () => {
                let ownerWallet: ethers.Wallet;
                let userWallet: ethers.Wallet;
                let optyRegistry: Contract;
                let riskManager: Contract;
                let gatherer: Contract;
                let optyStrategyCodeProvider: Contract;
                let strategyProvider: Contract;
                let optyMinterContract: Contract;
                let optyCodeProviderContract: Contract;
                let userTokenBalanceWei;
                let userInitialTokenBalance: number;
                let userOptyTokenBalanceWei;
                let userOptyTokenBalance: number;
                before(async () => {
                    provider = utilities.getForkedMainnetProvider(
                        Constants.MAINNET_NODE_URL,
                        Constants.MNEMONIC,
                        Constants.INITIAL_ACCOUNT_BALANCE_ETHER,
                        Constants.ACCOUNTS,
                        !Constants.UNLOCK_ACCOUNTS
                    );
                    ownerWallet = ethers.Wallet.fromMnemonic(
                        Constants.MNEMONIC
                    ).connect(provider);
                    const ownerWalletBalance = await provider.getBalance(
                        ownerWallet.address
                    );
                    assert(
                        utilities
                            .expandToTokenDecimals(
                                Constants.INITIAL_ACCOUNT_BALANCE_ETHER,
                                18
                            )
                            .eq(ownerWalletBalance),
                        `Owner's ether balance is not ${ethers.utils.formatEther(
                            ownerWalletBalance
                        )} before starting test suite`
                    );
                    userWallet = ethers.Wallet.fromMnemonic(
                        Constants.MNEMONIC,
                        `m/44'/60'/0'/0/1`
                    ).connect(provider);
                    const userWalletBalance = await provider.getBalance(
                        ownerWallet.address
                    );
                    assert(
                        utilities
                            .expandToTokenDecimals(
                                Constants.INITIAL_ACCOUNT_BALANCE_ETHER,
                                18
                            )
                            .eq(userWalletBalance),
                        `User's ether balance is not ${ethers.utils.formatEther(
                            userWalletBalance
                        )} before starting test suite`
                    );

                    //  Deploying all governance contracts - RegistryProxy, Registry, StrategyProvider, RiskManager, Gatherer, StrategyCodeProvider
                    const allGovernanceContracts = await GovernanceContracts.deployAllGovernanceContracts(
                        ownerWallet,
                        Constants.GAS_OVERRIDE_OPTIONS
                    );
                    optyRegistry = allGovernanceContracts[0];
                    strategyProvider = allGovernanceContracts[1];
                    riskManager = allGovernanceContracts[2];
                    gatherer = allGovernanceContracts[3];
                    optyStrategyCodeProvider = allGovernanceContracts[4];
                    optyMinterContract = allGovernanceContracts[5];

                    let tokenType: keyof typeof OtherImports.tokenAddresses;
                    for (tokenType in OtherImports.tokenAddresses) {
                        const tokens: Interfaces.TokenAddress =
                            OtherImports.tokenAddresses[tokenType];
                        for (const token in tokens) {
                            await RegistryFunctions.approveToken(
                                tokens[token],
                                optyRegistry
                            );
                        }
                    }

                    /*
                        Iterating through the list of CodeProvider Contracts for deploying them
                    */
                    let count = 1;
                    const optyCodeProviderContracts = Object.keys(
                        OtherImports.ProtocolCodeProviderNames
                    );

                    for (const optyCodeProviderContractsKey of optyCodeProviderContracts) {
                        let flag: boolean;
                        if (
                            optyCodeProviderContractsKey == command.codeProvider ||
                            !command.codeProvider
                        ) {
                            flag = true;
                        } else {
                            flag = false;
                        }

                        if (flag && count <= optyCodeProviderContracts.length) {
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    codeProviderContract,
                                    optyCodeProviderContractsKey.toString()
                                )
                            ) {
                                //  Deploying  the  code provider contracts
                                optyCodeProviderContract = await utilities.deployCodeProviderContracts(
                                    optyCodeProviderContractsKey,
                                    ownerWallet,
                                    codeProviderContract[optyCodeProviderContractsKey],
                                    optyRegistry.address,
                                    gatherer.address,
                                    Constants.GAS_OVERRIDE_OPTIONS
                                );
                                if (
                                    optyCodeProviderContractsKey
                                        .toString()
                                        .toLowerCase() ==
                                    Constants.CURVESWAPCODEPROVIDER
                                ) {
                                    await CurveFunctions.swapLpMappingAndSetGauge(
                                        optyCodeProviderContractsKey,
                                        optyCodeProviderContract,
                                        ownerWallet,
                                        Constants.GAS_OVERRIDE_OPTIONS
                                    );
                                }

                                //  Mapping CodeProvider contracts deployed to their variable names
                                optyCodeProviderContractVariables[
                                    optyCodeProviderContractsKey
                                ] = optyCodeProviderContract;

                                assert.isDefined(
                                    optyCodeProviderContractVariables[
                                        optyCodeProviderContractsKey
                                    ],
                                    "optyCodeProviderContract contract not deployed"
                                );
                                //  Iterating through defiPoolsAdv.json to approve LpTokens/Tokens, set Tokens hash
                                //  mapping to tokens, approve LP/CP, map Lp to CodeProvider Contract and setting the
                                //  Lp to LpToken
                                for (defiPoolsKey in OtherImports.defiPoolsAdv) {
                                    if (
                                        defiPoolsKey.toString() ==
                                        optyCodeProviderContractsKey.toString()
                                    ) {
                                        const defiPoolsUnderlyingTokens: Interfaces.DefiPools =
                                            OtherImports.defiPoolsAdv[defiPoolsKey];
                                        //  Iteracting through all the underlying tokens available corresponding to this
                                        //  current CodeProvider Contract Key
                                        for (const defiPoolsUnderlyingTokensKey in defiPoolsUnderlyingTokens) {
                                            //  Approving tokens, lpTokens
                                            await RegistryFunctions.approveTokenLpToken(
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].lpToken,
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].tokens,
                                                optyRegistry
                                            );
                                            // Mapping tokensHash to token
                                            await RegistryFunctions.setTokensHashToTokens(
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].tokens,
                                                optyRegistry
                                            );

                                            // Approving pool as Liquidity pool and mapping it to the CodeProvider
                                            await RegistryFunctions.approveLpCpAndMapLpToCodeProvider(
                                                defiPoolsUnderlyingTokens[
                                                    defiPoolsUnderlyingTokensKey
                                                ].pool,
                                                optyCodeProviderContractVariables[
                                                    optyCodeProviderContractsKey
                                                ].address,
                                                false,
                                                optyRegistry
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        count++;
                    }
                });

                after(async () => {
                    //  Checking Owner's Ether balance left after all the transactions
                    const ownerWalletBalance = await provider.getBalance(
                        ownerWallet.address
                    );
                    assert(
                        ownerWalletBalance.lt(
                            utilities.expandToTokenDecimals(
                                Constants.INITIAL_ACCOUNT_BALANCE_ETHER,
                                18
                            )
                        ),
                        `Owner's ether balance: ${ethers.utils.formatEther(
                            ownerWalletBalance
                        )} is not less than the balance before starting test suite`
                    );
                });
                //  Iterating through all the strategies by picking underlyingTokens as key
                let strategiesTokenKey: keyof typeof OtherImports.allStrategies;
                const allStrategiesTokenKeys = Object.keys(
                    OtherImports.allStrategies
                ).map((item) => item.toUpperCase());

                for (strategiesTokenKey in OtherImports.allStrategies) {
                    //  If: Executes test suite for all the underlying tokens, Else: Executes test suite for token symbol passed from command line
                    if (!command.symbol) {
                        if (strategiesTokenKey.toUpperCase() != "REP") {
                            await runTokenTestSuite(strategiesTokenKey);
                        }
                    } else {
                        //  IF: Run Test suite if token symbol is valid and exists, ELSE: Through an error and stop running test suite
                        if (
                            strategiesTokenKey.toUpperCase() ==
                            `${underlyingTokenSymbol}`
                        ) {
                            await runTokenTestSuite(strategiesTokenKey);
                        } else {
                            if (
                                !allStrategiesTokenKeys.includes(underlyingTokenSymbol)
                            ) {
                                console.error("ERROR: Invalid Token symbol!");
                                process.exit(2);
                            }
                        }
                    }
                }
                async function runTokenTestSuite(
                    strategiesTokenKey: keyof typeof OtherImports.allStrategies
                ) {
                    describe(
                        "TEST CASES FOR: " + strategiesTokenKey.toUpperCase(),
                        async () => {
                            //  local variables to be used for testing
                            let underlyingToken: string;
                            let underlyingTokenDecimals: number;
                            let tokens: string[];
                            let tokenContractInstance: Contract;
                            let optyTokenAdvancePool: Contract;
                            let emergencyBrake: Contract;
                            let tokensHash = "";

                            before(async () => {
                                //  Getting the underlying token's contract instance
                                underlyingToken =
                                    OtherImports.tokenAddresses.underlyingTokens[
                                        <
                                            keyof typeof OtherImports.tokenAddresses.underlyingTokens
                                        >strategiesTokenKey.toLowerCase()
                                    ];
                                tokens = [underlyingToken];

                                // Instantiate token contract
                                tokenContractInstance = utilities.getContractInstance(
                                    underlyingToken,
                                    OtherImports.addressAbis.erc20.abi,
                                    ownerWallet
                                );

                                underlyingTokenDecimals = await tokenContractInstance.decimals(); //  underlying token decimals

                                //  Special scenario for HBTC token because funding with larger can't be done due to Price impact in
                                //  uniswap during swap, therefore converting the test amount to less amount which can be funded.
                                if (strategiesTokenKey.toLowerCase() == "hbtc") {
                                    TEST_AMOUNT = utilities.expandToTokenDecimals(
                                        TEST_AMOUNT_NUM,
                                        16 - (TEST_AMOUNT_NUM.toString().length - 1)
                                    );
                                } else {
                                    TEST_AMOUNT = utilities.expandToTokenDecimals(
                                        TEST_AMOUNT_NUM,
                                        underlyingTokenDecimals
                                    );
                                }
                                //  Setting the TokensHash corresponding to the list of tokens
                                tokensHash = utilities.getSoliditySHA3Hash(
                                    ["address[]"],
                                    [tokens]
                                );
                                const vaultProxyAdminWallet = ethers.Wallet.fromMnemonic(
                                    Constants.MNEMONIC,
                                    `m/44'/60'/0'/0/2`
                                ).connect(provider);
                                //  Deploying the BasicPool Contract for MKR and other underlying token
                                optyTokenAdvancePool = await PoolContracts.deployPoolContracts(
                                    underlyingToken,
                                    ownerWallet,
                                    vaultProxyAdminWallet,
                                    PoolContracts.OptyTokenAdvancePoolMkr,
                                    PoolContracts.OptyTokenAdvancePool,
                                    optyRegistry.address,
                                    riskManager.address,
                                    optyStrategyCodeProvider.address,
                                    optyMinterContract.address
                                );
                                emergencyBrake = await deployContract(
                                    ownerWallet,
                                    EmergencyBrakeJSON,
                                    [
                                        optyTokenAdvancePool.address,
                                        tokenContractInstance.address,
                                    ]
                                );
                                assert.isDefined(
                                    optyTokenAdvancePool,
                                    "OptyTokenAdvancedPool contract not deployed"
                                );
                            });

                            it(
                                "should check OptyTokenBasicPool contract is deployed for " +
                                    strategiesTokenKey,
                                async () => {
                                    assert.isOk(
                                        optyTokenAdvancePool.address,
                                        "AdvancedPool Contract for " +
                                            strategiesTokenKey +
                                            "is not deployed"
                                    );
                                }
                            );

                            const allStrategyNames = OtherImports.allStrategies[
                                strategiesTokenKey
                            ].advanced.map((element) =>
                                element.strategyName.toLowerCase()
                            );

                            /*
                                    Iterating through each strategy one by one, setting, approving and scroing the each
                                    strategy and then making userDepositRebalance() call
                                */
                            for (
                                let index = 0;
                                index <
                                OtherImports.allStrategies[strategiesTokenKey].advanced
                                    .length;
                                index++
                            ) {
                                const currentStrategyObject =
                                    OtherImports.allStrategies[strategiesTokenKey]
                                        .advanced[index];
                                if (!command.strategyName) {
                                    if (
                                        !command.strategiesCount ||
                                        command.strategiesCount < 0
                                    ) {
                                        console.error(
                                            "ERROR: Invalid Strategy Count:" +
                                                command.strategiesCount
                                        );
                                        process.exit(3);
                                    } else {
                                        await runTestCases(currentStrategyObject);
                                    }
                                } else {
                                    if (
                                        !allStrategyNames.includes(
                                            command.strategyName.toLowerCase()
                                        )
                                    ) {
                                        console.error(
                                            "ERROR: Invalid Strategy Name: " +
                                                command.strategyName
                                        );
                                        process.exit(5);
                                    } else if (
                                        currentStrategyObject.strategyName ===
                                        command.strategyName
                                    ) {
                                        await runTestCases(currentStrategyObject);
                                    }
                                }
                            }

                            async function runTestCases(strategyObject: any) {
                                it(
                                    "should deposit using userDepositRebalance() using Strategy - " +
                                        strategyObject.strategyName,
                                    async () => {
                                        await setBestAdvanceStrategy(
                                            strategyObject,
                                            tokensHash,
                                            optyRegistry,
                                            strategyProvider
                                        );
                                        const allFundWalletReturnParams: any = await utilities.checkAndFundWallet(
                                            underlyingToken,
                                            underlyingTokenDecimals,
                                            tokenContractInstance,
                                            userWallet,
                                            optyTokenAdvancePool,
                                            userOptyTokenBalance,
                                            TEST_AMOUNT,
                                            userInitialTokenBalance,
                                            Constants.GAS_OVERRIDE_OPTIONS,
                                            Constants.ETH_VALUE_GAS_OVERIDE_OPTIONS
                                        );
                                        userTokenBalanceWei =
                                            allFundWalletReturnParams[0];
                                        userOptyTokenBalanceWei =
                                            allFundWalletReturnParams[1];
                                        userOptyTokenBalance =
                                            allFundWalletReturnParams[2];
                                        userInitialTokenBalance =
                                            allFundWalletReturnParams[4];
                                        try {
                                            await testUserDepositRebalance();
                                        } catch (error) {
                                            throw new Error(
                                                `Test UserDepositRebalance failed with error: ${error}`
                                            );
                                            process.exit(6);
                                        }

                                        async function testUserDepositRebalance() {
                                            const userInitialTokenBalanceWei = await tokenContractInstance.balanceOf(
                                                userWallet.address
                                            );
                                            const tokenContractInstanceAsSignerUser = tokenContractInstance.connect(
                                                userWallet
                                            );

                                            await tokenContractInstanceAsSignerUser.approve(
                                                optyTokenAdvancePool.address,
                                                TEST_AMOUNT,
                                                Constants.GAS_OVERRIDE_OPTIONS
                                            );

                                            expect(
                                                await tokenContractInstance.allowance(
                                                    userWallet.address,
                                                    optyTokenAdvancePool.address
                                                )
                                            ).to.equal(TEST_AMOUNT);
                                            //  Getting initial balance of OptyBasicTokens for user
                                            const userOptyTokenBalanceBefore = await optyTokenAdvancePool.balanceOf(
                                                userWallet.address
                                            );

                                            //  Getting the totalSupply and vaultValue from deposit txn.
                                            const totalSupply = await optyTokenAdvancePool.totalSupply();
                                            const vaultValue = await optyTokenAdvancePool.vaultValue();

                                            const optyTokenAdvancePoolAsSignerUser = optyTokenAdvancePool.connect(
                                                userWallet
                                            );

                                            let userDepositRebalanceTx;

                                            try {
                                                userDepositRebalanceTx = await optyTokenAdvancePoolAsSignerUser.userDepositRebalance(
                                                    TEST_AMOUNT,
                                                    Constants.GAS_OVERRIDE_OPTIONS
                                                );
                                                assert.isOk(
                                                    userDepositRebalanceTx,
                                                    "UserDepositRebalance() call failed"
                                                );
                                            } catch (e) {
                                                throw new Error(
                                                    `UserDepositRebalance failed with error: ${e}`
                                                );
                                                process.exit(6);
                                            }

                                            await userDepositRebalanceTx.wait();

                                            // Check Token balance of user after userDepositRebalance() call
                                            userTokenBalanceWei = await tokenContractInstance.balanceOf(
                                                userWallet.address
                                            );
                                            expect(
                                                userTokenBalanceWei.eq(
                                                    userInitialTokenBalanceWei.sub(
                                                        TEST_AMOUNT
                                                    )
                                                )
                                            ).to.be.true;
                                            let shares: ethers.BigNumber;
                                            if (
                                                parseFloat(
                                                    utilities.fromWeiToString(
                                                        vaultValue,
                                                        underlyingTokenDecimals
                                                    )
                                                ) == 0
                                            ) {
                                                shares = TEST_AMOUNT;
                                            } else {
                                                shares = TEST_AMOUNT.mul(
                                                    totalSupply
                                                ).div(vaultValue);
                                            }
                                            const userExpectedOptyTokenBalance = userOptyTokenBalanceBefore.add(
                                                shares
                                            );
                                            userOptyTokenBalanceWei = await optyTokenAdvancePool.balanceOf(
                                                userWallet.address
                                            );
                                            expect(userOptyTokenBalanceWei).to.equal(
                                                userExpectedOptyTokenBalance
                                            );
                                            return 0;
                                        }
                                    }
                                );
                                it(
                                    "should withdraw using userWithdrawRebalance() using Strategy - " +
                                        strategyObject.strategyName,
                                    async () => {
                                        //  Connect the BasicPool Contract with the user's Wallet for making userDeposit()
                                        const initialUserOptyTokenBalanceWei = await optyTokenAdvancePool.balanceOf(
                                            userWallet.address
                                        );

                                        //  If condition is checking if the withdrawal is 0 or not. This can happen when
                                        //  depositRebalance() is called after setting up the same strategy. This can happen
                                        //  user doesn't have any Op<Token>Bsc tokens.
                                        if (
                                            !(
                                                initialUserOptyTokenBalanceWei
                                                    .sub(1)
                                                    .eq(0) ||
                                                initialUserOptyTokenBalanceWei.eq(0) ||
                                                initialUserOptyTokenBalanceWei
                                                    .sub(
                                                        utilities.expandToTokenDecimals(
                                                            1,
                                                            11
                                                        )
                                                    )
                                                    .eq(0)
                                            )
                                        ) {
                                            //  This is the edge when running all the test cases together and it sometimes fails
                                            //  (because of timing issues) for the first but works it same strategy is used again.
                                            //  Also, it works if we are only testing this strategy alone.
                                            const EdgeCaseStrategiesKeys: keyof typeof OtherImports.EdgeCaseStrategies = <
                                                keyof typeof OtherImports.EdgeCaseStrategies
                                            >strategyObject.strategyName.toString();

                                            const sleepTimeInSec = OtherImports
                                                .EdgeCaseStrategies[
                                                EdgeCaseStrategiesKeys
                                            ]
                                                ? OtherImports.EdgeCaseStrategies[
                                                      EdgeCaseStrategiesKeys
                                                  ].sleepTimeInSec
                                                : 0;
                                            try {
                                                //  Note: 1. roundingDelta = 0,1,2 - It works for all these 3 values for all other strategies - Deepanshu
                                                //  2. roundingDelta = 0,2,3... - It work for "USDT-deposit-CURVE-ypaxCrv". "USDT-deposit-CURVE-yDAI+yUSDC+yUSDT+yTUSD", "USDT-deposit-CURVE-yDAI+yUSDC+yUSDT+yBUSD" but not for roundingDelta = 1
                                                // let roundingDelta = utilities.expandToTokenDecimals(2, underlyingTokenDecimals); // - also works
                                                const roundingDelta = 0;

                                                await utilities.sleep(
                                                    sleepTimeInSec * 1000
                                                ); //  Needs to wait  for min 60 sec or above else withdraw will through a revert error

                                                await testUserWithdrawRebalance(
                                                    initialUserOptyTokenBalanceWei,
                                                    roundingDelta
                                                );
                                            } catch (error) {
                                                console.log(
                                                    "Error occured: ",
                                                    error.message
                                                );
                                            }
                                        }
                                        async function testUserWithdrawRebalance(
                                            withdrawAmount: any,
                                            roundingDelta: any
                                        ) {
                                            const initialContractTokenBalanceWei = await tokenContractInstance.balanceOf(
                                                optyTokenAdvancePool.address
                                            );

                                            const totalSupply = await optyTokenAdvancePool.totalSupply();

                                            const vaultValue = await optyTokenAdvancePool.vaultValue();

                                            const optyTokenBasicPoolAsSignerUser = optyTokenAdvancePool.connect(
                                                userWallet
                                            );
                                            let userWithdrawTxOutput;
                                            try {
                                                userWithdrawTxOutput = await optyTokenBasicPoolAsSignerUser.functions.userWithdrawRebalance(
                                                    withdrawAmount.sub(roundingDelta),
                                                    Constants.GAS_OVERRIDE_OPTIONS
                                                );
                                            } catch (error) {
                                                throw new Error(
                                                    `UserWithdrawRebalance failed with error: ${error}`
                                                );
                                                process.exit(6);
                                            }

                                            await userWithdrawTxOutput.wait();

                                            assert.isOk(
                                                userWithdrawTxOutput,
                                                "UserWithdraw() call failed"
                                            );

                                            const afterUserOptyTokenBalanceWei = await optyTokenAdvancePool.balanceOf(
                                                userWallet.address
                                            );

                                            const afterUserTokenBalanceWei = await tokenContractInstance.balanceOf(
                                                userWallet.address
                                            );

                                            const noOfTokensReceivedFromFormula = vaultValue
                                                .mul(withdrawAmount.sub(1))
                                                .div(totalSupply);

                                            expect(
                                                afterUserOptyTokenBalanceWei.eq(
                                                    roundingDelta
                                                )
                                            ).to.be.true;

                                            //  User's TOKEN (like DAI etc.) balance should be equal to no. of tokens
                                            //  calculated from formula but sometimes, it is not equal like in case of AAVE
                                            //  where the token and lpToken ratio is 1:1 (Sometimes) - Deepanshu
                                            if (
                                                afterUserTokenBalanceWei.eq(
                                                    noOfTokensReceivedFromFormula
                                                )
                                            ) {
                                                expect(
                                                    afterUserTokenBalanceWei
                                                ).to.equal(
                                                    noOfTokensReceivedFromFormula
                                                );
                                            } else if (
                                                afterUserTokenBalanceWei.lte(
                                                    noOfTokensReceivedFromFormula
                                                )
                                            ) {
                                                expect(
                                                    afterUserTokenBalanceWei.lte(
                                                        noOfTokensReceivedFromFormula
                                                    )
                                                ).to.be.true;
                                            } else {
                                                expect(
                                                    afterUserTokenBalanceWei.gte(
                                                        noOfTokensReceivedFromFormula
                                                    )
                                                ).to.be.true;
                                            }

                                            const afterContractTokenBalanceWei = await tokenContractInstance.balanceOf(
                                                optyTokenAdvancePool.address
                                            );

                                            //  Sometimes, Contract has left with some small fraction of Token like DAI etc.
                                            if (
                                                afterContractTokenBalanceWei.eq(
                                                    initialContractTokenBalanceWei
                                                )
                                            ) {
                                                expect(
                                                    afterContractTokenBalanceWei.eq(0)
                                                ).to.be.true;
                                                expect(
                                                    initialContractTokenBalanceWei.eq(0)
                                                ).to.be.true;
                                            } else {
                                                expect(
                                                    afterContractTokenBalanceWei
                                                ).to.equal(0);
                                            }
                                        }
                                    }
                                );
                                it(
                                    "emergencyBrake should revert with double deposit in one block (following the math) - " +
                                        strategyObject.strategyName,
                                    async () => {
                                        const tokenContractInstanceAsSignerUser = tokenContractInstance.connect(
                                            userWallet
                                        );
                                        try {
                                            await tokenContractInstanceAsSignerUser.transfer(
                                                emergencyBrake.address,
                                                100000000
                                            );

                                            await optyTokenAdvancePool.setMaxVaultValueJump(
                                                100
                                            );

                                            await emergencyBrake.runDepositRebalance(1);
                                            await emergencyBrake.runTwoTxnDepositRebalance(
                                                1,
                                                10000000
                                            );
                                        } catch (err) {
                                            expect(err.error.message).to.equal(
                                                "VM Exception while processing transaction: revert !maxVaultValueJump"
                                            );
                                        }
                                    }
                                );
                                it(
                                    "emergencyBrake should revert with double withDraw in one block (following the math) - " +
                                        strategyObject.strategyName,
                                    async () => {
                                        const tokenContractInstanceAsSignerUser = tokenContractInstance.connect(
                                            userWallet
                                        );
                                        try {
                                            await tokenContractInstanceAsSignerUser.transfer(
                                                emergencyBrake.address,
                                                100000000
                                            );

                                            await optyTokenAdvancePool.setMaxVaultValueJump(
                                                100
                                            );

                                            await emergencyBrake.runDepositRebalance(
                                                10000001
                                            );

                                            await emergencyBrake.runTwoTxnWithdrawRebalance(
                                                1,
                                                10000000
                                            );
                                        } catch (err) {
                                            expect(err.error.message).to.equal(
                                                "VM Exception while processing transaction: revert !maxVaultValueJump"
                                            );
                                        }
                                    }
                                );
                                it(
                                    "emergencyBrake should revert with double rebalance in one block (following the math) - " +
                                        strategyObject.strategyName,
                                    async () => {
                                        const tokenContractInstanceAsSignerUser = tokenContractInstance.connect(
                                            userWallet
                                        );
                                        try {
                                            await tokenContractInstanceAsSignerUser.transfer(
                                                emergencyBrake.address,
                                                100000000
                                            );

                                            await optyTokenAdvancePool.setMaxVaultValueJump(
                                                100
                                            );

                                            await emergencyBrake.runDepositRebalance(
                                                10000001
                                            );

                                            await emergencyBrake.runTwoTxnRebalance(
                                                1,
                                                10000000
                                            );
                                        } catch (err) {
                                            expect(err.error.message).to.equal(
                                                "VM Exception while processing transaction: revert !maxVaultValueJump"
                                            );
                                        }
                                    }
                                );
                                it(
                                    "emergencyBrake should revert with deposit and withdraw in one block (following the math) - " +
                                        strategyObject.strategyName,
                                    async () => {
                                        const tokenContractInstanceAsSignerUser = tokenContractInstance.connect(
                                            userWallet
                                        );
                                        try {
                                            await tokenContractInstanceAsSignerUser.transfer(
                                                emergencyBrake.address,
                                                100000000
                                            );

                                            await optyTokenAdvancePool.setMaxVaultValueJump(
                                                100
                                            );

                                            await emergencyBrake.runDepositRebalance(
                                                10000001
                                            );

                                            await emergencyBrake.runTwoTxnWithdrawAndDepositRebalance(
                                                1,
                                                10000000
                                            );
                                        } catch (err) {
                                            expect(err.error.message).to.equal(
                                                "VM Exception while processing transaction: revert !maxVaultValueJump"
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            });
        }
    });

program.parse(process.argv);
