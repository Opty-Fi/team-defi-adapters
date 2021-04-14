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
import { TOKENS, TESTING_CONTRACTS } from "./utils/constants";
import { TypedStrategies } from "./data";
import {
    getSoliditySHA3Hash,
    fundWalletToken,
    getBlockTimestamp,
} from "./utils/helpers";
import scenario from "./scenarios/discontinue-pause.json";
// import scenario from "./scenarios/emergency-brake-negative.json";
describe(scenario.title, () => {
    // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
    const token = "DAI";
    const MAX_AMOUNT = 100000000;
    let essentialContracts: ESSENTIAL_CONTRACTS;
    let contracts: CONTRACTS;
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

    // for (let i = 0; i < scenario.vaults.length; i++) {
    for (let i = 0; i < 1; i++) {
        describe(`${scenario.vaults[i].name}`, async () => {
            let vault: Contract;
            const vaults = scenario.vaults[i];
            const profile = vaults.name;
            const TOKEN_STRATEGY = TypedStrategies[token][profile][0];
            const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS[token]]]);
            let ERC20Instance: Contract;
            let emergencyBrake: Contract;
            before(async () => {
                try {
                    vault = await deployVault(
                        essentialContracts.registry.address,
                        essentialContracts.riskManager.address,
                        essentialContracts.strategyManager.address,
                        essentialContracts.optyMinter.address,
                        TOKENS[token],
                        owner,
                        admin,
                        profile
                    );
                    contracts = { ...essentialContracts, vault };
                    console.log("COntract keys: ", Object.keys(contracts));
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

                    // const EmergencyBrakeFactory = await ethers.getContractFactory(
                    //     TESTING_CONTRACTS.TESTING_EMERGENCY_BRAKE_RP1
                    // );
                    const EmergencyBrakeFactory = await ethers.getContractFactory(
                        TESTING_CONTRACTS.TESTING_EMERGENCY_BRAKE_RP1
                    );

                    emergencyBrake = await EmergencyBrakeFactory.deploy(
                        vault.address,
                        TOKENS[token]
                    );

                    ERC20Instance = await ethers.getContractAt("ERC20", TOKENS[token]);
                } catch (error) {
                    console.error(error);
                }
            });
            beforeEach(async () => {
                await ERC20Instance.connect(owner).transfer(
                    emergencyBrake.address,
                    MAX_AMOUNT * 2
                );

                await ERC20Instance.connect(owner).transfer(
                    emergencyBrake.address,
                    MAX_AMOUNT * 2
                );
                // await vault.connect(owner).setMaxVaultValueJump(vaults.maxJump);
            });

            for (let i = 0; i < vaults.stories.length; i++) {
                // for (let i = 0; i < 4; i++) {
                const story = vaults.stories[i];
                it(story.description, async () => {
                    for (let j = 0; j < story.actions.length; j++) {
                        // for (let j = 0; j < 1; j++) {
                        if (
                            story.actions[j].action ===
                                "userDepositRebalance(uint256)" ||
                            story.actions[j].action === "userWithdrawRebalanceAll()"
                        ) {
                            const args = story.actions[j].args;
                            if (story.actions[j].expect === "success") {
                                console.log("Coming in success scenario");
                                await ERC20Instance.connect(owner).approve(
                                    contracts[story.actions[j].contract.toLowerCase()]
                                        .address,
                                    BigNumber.from(MAX_AMOUNT * 2)
                                );
                                story.actions[j].action ===
                                "userDepositRebalance(uint256)"
                                    ? await contracts[
                                          story.actions[j].contract.toLowerCase()
                                      ][story.actions[j].action](args?.amount)
                                    : await contracts[
                                          story.actions[j].contract.toLowerCase()
                                      ][story.actions[j].action];
                                // await vault[story.actions[j].action](amount);
                            } else {
                                console.log("Testing pause");
                                // await essentialContracts.registry.setPause(vault.address, true);
                                // await essentialContracts.registry[story.actions[j].action](vault.address, true);
                                console.log("Set pause");
                                // await ERC20Instance.connect(owner).approve(vault.address, BigNumber.from(MAX_AMOUNT * 2))
                                await expect(
                                    contracts[story.actions[j].contract.toLowerCase()][
                                        story.actions[j].action
                                    ](args?.amount)
                                ).to.be.revertedWith(story.actions[j].message);
                            }
                        } else {
                            const args = story.actions[j].args;
                            console.log("pause: ", args.pause);
                            if (story.actions[j].expect === "success") {
                                console.log("Coming in else success scenario");
                                // await ERC20Instance.connect(owner).approve(vault.address, BigNumber.from(MAX_AMOUNT * 2))
                                //  "pauseDiscontinueAction": "setPause(address,bool)",
                                story.actions[j].action === "setPause(address,bool)"
                                    ? await contracts[
                                          story.actions[j].contract.toLowerCase()
                                      ][story.actions[j].action](
                                          vault.address,
                                          args?.pause
                                      )
                                    : await contracts[
                                          story.actions[j].contract.toLowerCase()
                                      ][story.actions[j].action](vault.address);
                            }
                            // } else {
                            //     console.log("Testing pause")
                            //     // await essentialContracts.registry.setPause(vault.address, true);
                            //     await essentialContracts.registry[story.actions[j].action](vault.address, true);
                            //     console.log("Set pause")
                            //     await ERC20Instance.connect(owner).approve(vault.address, BigNumber.from(MAX_AMOUNT * 2))
                            //     await expect(
                            //         vault[story.actions[j].action](amount)
                            //     ).to.be.revertedWith(story.actions[j].message);
                            // }
                        }
                        // } else {
                        //     const { max_amount, min_amount } = story.actions[j].args;
                        //     if (story.actions[j].expect === "success") {
                        //         await emergencyBrake[story.actions[j].action](
                        //             min_amount,
                        //             max_amount
                        //         );
                        //     } else {
                        //         await expect(
                        //             emergencyBrake[story.actions[j].action](
                        //                 min_amount,
                        //                 max_amount
                        //             )
                        //         ).to.be.revertedWith(story.actions[j].message);
                        //     }
                        // }
                    }
                }).timeout(100000);
            }
        });
    }
});
