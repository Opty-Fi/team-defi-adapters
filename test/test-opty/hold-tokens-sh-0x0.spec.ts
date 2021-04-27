import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { setUp, deployVault } from "./setup";
import { ESSENTIAL_CONTRACTS, CONTRACTS } from "./utils/type";
import { TOKENS } from "./utils/constants";
import {
    getSoliditySHA3Hash,
    fundWalletToken,
    getBlockTimestamp,
} from "./utils/helpers";
import scenarios from "./scenarios/hold-tokens-sh-0x0.json";
type ARGUMENTS = {
    amount?: { [key: string]: string };
    riskProfile?: string;
    strategyHash?: string;
};

describe(scenarios.title, () => {
    // TODO: ADD TEST SCENARIOES, ADVANCED PROFILE, STRATEGIES.
    const MAX_AMOUNT: { [key: string]: BigNumber } = {
        DAI: BigNumber.from("1000000000000000000000"),
        USDT: BigNumber.from("1000000000"),
    };
    let essentialContracts: ESSENTIAL_CONTRACTS;
    let users: { [key: string]: Signer };

    before(async () => {
        try {
            const [owner, admin] = await ethers.getSigners();
            users = { owner, admin };
            [essentialContracts] = await setUp(users["owner"]);
            assert.isDefined(essentialContracts, "Essential contracts not deployed");
        } catch (error) {
            console.log(error);
        }
    });

    for (let i = 0; i < scenarios.vaults.length; i++) {
        describe(`${scenarios.vaults[i].name}`, async () => {
            const vault = scenarios.vaults[i];
            const stories = vault.stories;
            const tokensHash = getSoliditySHA3Hash(["address[]"], [[TOKENS["DAI"]]]);
            let bestStrategyHash: void;
            const contracts: CONTRACTS = {};
            before(async () => {
                try {
                    const Vault = await deployVault(
                        essentialContracts.registry.address,
                        essentialContracts.riskManager.address,
                        essentialContracts.riskManager.address,
                        essentialContracts.optyMinter.address,
                        TOKENS["DAI"],
                        users["owner"],
                        users["admin"],
                        scenarios.vaults[i].name
                    );

                    const timestamp = (await getBlockTimestamp()) * 2;
                    await fundWalletToken(
                        TOKENS["DAI"],
                        users["owner"],
                        MAX_AMOUNT["DAI"],
                        timestamp
                    );

                    const ERC20Instance = await ethers.getContractAt(
                        "ERC20",
                        TOKENS["DAI"]
                    );

                    contracts["strategyProvider"] = essentialContracts.strategyProvider;

                    contracts["vault"] = Vault;

                    contracts["erc20"] = ERC20Instance;
                } catch (error) {
                    console.error(error);
                }
            });

            for (let i = 0; i < stories.length; i++) {
                it(stories[i].description, async () => {
                    const story = stories[i];
                    for (let i = 0; i < story.actions.length; i++) {
                        const action = story.actions[i];
                        switch (action.action) {
                            case "setBestStrategy(string,bytes32,bytes32)": {
                                const {
                                    riskProfile,
                                    strategyHash,
                                }: ARGUMENTS = action.args;
                                if (action.expect === "success") {
                                    await contracts[action.contract]
                                        .connect(users[action.executer])
                                        [action.action](
                                            riskProfile,
                                            tokensHash,
                                            strategyHash
                                        );
                                } else {
                                    await expect(
                                        contracts[action.contract]
                                            .connect(users[action.executer])
                                            [action.action](
                                                riskProfile,
                                                tokensHash,
                                                strategyHash
                                                    ? strategyHash
                                                    : bestStrategyHash
                                            )
                                    ).to.be.revertedWith(action.message);
                                }
                                break;
                            }
                            case "approve(address,uint256)": {
                                const { amount }: ARGUMENTS = action.args;
                                if (action.expect === "success") {
                                    await contracts[action.contract]
                                        .connect(users[action.executer])
                                        [action.action](
                                            contracts["vault"].address,
                                            amount ? amount["DAI"] : "0"
                                        );
                                } else {
                                    await expect(
                                        contracts[action.contract]
                                            .connect(users[action.executer])
                                            [action.action](
                                                contracts["vault"].address,
                                                amount ? amount["DAI"] : "0"
                                            )
                                    ).to.be.revertedWith(action.message);
                                }
                                break;
                            }
                            case "userDepositRebalance(uint256)": {
                                const { amount }: ARGUMENTS = action.args;

                                if (action.expect === "success") {
                                    await contracts[action.contract]
                                        .connect(users[action.executer])
                                        [action.action](amount ? amount["DAI"] : "0");
                                } else {
                                    await expect(
                                        contracts[action.contract]
                                            .connect(users[action.executer])
                                            [action.action](
                                                amount ? amount["DAI"] : "0"
                                            )
                                    ).to.be.revertedWith(action.message);
                                }
                                break;
                            }
                            case "balance()": {
                                const balance = await contracts[action.contract][
                                    action.action
                                ]();
                                expect(balance).to.equal(
                                    action.expectedValue[
                                        <keyof typeof action.expectedValue>"DAI"
                                    ]
                                );
                                break;
                            }
                            case "userWithdrawRebalance(uint256)": {
                                const { amount }: ARGUMENTS = action.args;
                                if (action.expect === "success") {
                                    await contracts[action.contract]
                                        .connect(users[action.executer])
                                        [action.action](amount ? amount["DAI"] : "0");
                                } else {
                                    await expect(
                                        contracts[action.contract]
                                            .connect(users[action.executer])
                                            [action.action](
                                                amount ? amount["DAI"] : "0"
                                            )
                                    ).to.be.revertedWith(action.message);
                                }
                                break;
                            }
                            default:
                                break;
                        }
                    }
                }).timeout(150000);
            }
        });
    }
});
