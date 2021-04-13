import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import {
    setUp,
    deployVault,
    setBestBasicStrategy,
    approveLiquidityPoolAndMapAdapter,
} from "./setup";
import { ESSENTIAL_CONTRACTS, CONTRACTS } from "./utils/type";
import { TOKENS, VAULT, TESTING_CONTRACTS } from "./utils/constants";
import { TypedStrategies } from "./data";
import {
    getSoliditySHA3Hash,
    fundWalletToken,
    getBlockTimestamp,
} from "./utils/helpers";
describe("EmergencyBrake", () => {
    // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
    const token = "DAI";
    const profile = "RP1Vault";
    const TOKEN_STRATEGY = TypedStrategies[token][profile][0];
    const MAX_AMOUNT = 10000000;
    const MIN_AMOUNT = 1;
    const MAX_JUMP = 100;
    let essentialContracts: ESSENTIAL_CONTRACTS;
    let adapters: CONTRACTS;
    let owner: Signer;
    let admin: Signer;
    before(async () => {
        try {
            [owner, admin] = await ethers.getSigners();
            [essentialContracts, adapters] = await setUp(owner);
            assert.isDefined(essentialContracts, "Essential contracts not deployed");
            assert.isDefined(adapters, "Adapters not deployed");
        } catch (error) {
            console.log(error);
        }
    });

    for (let i = 0; i < VAULT.length; i++) {
        if (VAULT[i] === profile) {
            describe(`${VAULT[i]}`, async () => {
                let Vault: Contract;
                const tokensHash = getSoliditySHA3Hash(
                    ["address[]"],
                    [[TOKENS[token]]]
                );
                let ERC20Instance: Contract;
                let emergencyBrake: Contract;
                before(async () => {
                    try {
                        Vault = await deployVault(
                            essentialContracts.registry.address,
                            essentialContracts.riskManager.address,
                            essentialContracts.strategyManager.address,
                            essentialContracts.optyMinter.address,
                            TOKENS[token],
                            owner,
                            admin,
                            profile
                        );
                        await approveLiquidityPoolAndMapAdapter(
                            essentialContracts.registry,
                            adapters["CompoundAdapter"].address,
                            TOKEN_STRATEGY.strategy[0].contract
                        );

                        await setBestBasicStrategy(
                            TOKEN_STRATEGY.strategy,
                            tokensHash,
                            essentialContracts.registry,
                            essentialContracts.strategyProvider
                        );

                        const timestamp = (await getBlockTimestamp()) * 2;
                        await fundWalletToken(
                            TOKENS[token],
                            owner,
                            BigNumber.from(MAX_AMOUNT * 100),
                            timestamp
                        );

                        const EmergencyBrakeFactory = await ethers.getContractFactory(
                            TESTING_CONTRACTS.TESTING_EMERGENCY_BRAKE_RP1
                        );

                        emergencyBrake = await EmergencyBrakeFactory.deploy(
                            Vault.address,
                            TOKENS[token]
                        );

                        ERC20Instance = await ethers.getContractAt(
                            "ERC20",
                            TOKENS[token]
                        );
                    } catch (error) {
                        console.error(error);
                    }
                });
                it("[Double deposit in one block] Should throw an error in DAIRP1Vault with DAI-deposit-COMPOUND-cDAI when the pool value deviates from 1%, maxJumpAllowed=1%", async () => {
                    try {
                        await ERC20Instance.connect(owner).transfer(
                            emergencyBrake.address,
                            MAX_AMOUNT * 2
                        );
                        await Vault.connect(owner).setMaxVaultValueJump(MAX_JUMP);
                        await emergencyBrake.runDepositRebalance(MIN_AMOUNT);
                        await expect(
                            emergencyBrake.runTwoTxnDepositRebalance(
                                MIN_AMOUNT,
                                MAX_AMOUNT
                            )
                        ).to.be.revertedWith("!maxVaultValueJump");
                    } catch (err) {
                        console.log(err);
                        expect(err.error.message).to.equal(
                            "VM Exception while processing transaction: revert !maxVaultValueJump"
                        );
                    }
                }).timeout(100000);

                it("[Double withDraw in one block] Should throw an error in DAIRP1Vault with DAI-deposit-COMPOUND-cDAI when the pool value deviates from 1%, maxJumpAllowed=1%", async () => {
                    try {
                        await ERC20Instance.connect(owner).transfer(
                            emergencyBrake.address,
                            MAX_AMOUNT * 2
                        );
                        await Vault.connect(owner).setMaxVaultValueJump(MAX_JUMP);
                        await emergencyBrake.runDepositRebalance(
                            MIN_AMOUNT + MAX_AMOUNT
                        );
                        await expect(
                            emergencyBrake.runTwoTxnWithdrawRebalance(
                                MIN_AMOUNT,
                                MAX_AMOUNT
                            )
                        ).to.be.revertedWith("!maxVaultValueJump");
                    } catch (err) {
                        expect(err.error.message).to.equal(
                            "VM Exception while processing transaction: revert !maxVaultValueJump"
                        );
                    }
                }).timeout(100000);

                it("[Double rebalance in one block] Should throw an error in DAIRP1Vault with DAI-deposit-COMPOUND-cDAI when the pool value deviates from 1%, maxJumpAllowed=1%", async () => {
                    try {
                        await ERC20Instance.connect(owner).transfer(
                            emergencyBrake.address,
                            MAX_AMOUNT * 2
                        );
                        await Vault.connect(owner).setMaxVaultValueJump(MAX_JUMP);
                        await emergencyBrake.runDepositRebalance(
                            MIN_AMOUNT + MAX_AMOUNT
                        );
                        await expect(
                            emergencyBrake.runTwoTxnRebalance(MIN_AMOUNT, MAX_AMOUNT)
                        ).to.be.revertedWith("!maxVaultValueJump");
                    } catch (err) {
                        console.log(err);
                        expect(err.error.message).to.equal(
                            "VM Exception while processing transaction: revert !maxVaultValueJump"
                        );
                    }
                }).timeout(100000);

                it("[Deposit and withdraw in one block] Should throw an error in DAIRP1Vault with DAI-deposit-COMPOUND-cDAI when the pool value deviates from 1%, maxJumpAllowed=1%", async () => {
                    try {
                        await ERC20Instance.connect(owner).transfer(
                            emergencyBrake.address,
                            MAX_AMOUNT * 2
                        );
                        await Vault.connect(owner).setMaxVaultValueJump(MAX_JUMP);
                        await emergencyBrake.runDepositRebalance(
                            MIN_AMOUNT + MAX_AMOUNT
                        );
                        await expect(
                            emergencyBrake.runTwoTxnWithdrawAndDepositRebalance(
                                MIN_AMOUNT,
                                MAX_AMOUNT
                            )
                        ).to.be.revertedWith("!maxVaultValueJump");
                    } catch (err) {
                        console.log(err);
                        expect(err.error.message).to.equal(
                            "VM Exception while processing transaction: revert !maxVaultValueJump"
                        );
                    }
                }).timeout(100000);
            });
        }
    }
});
