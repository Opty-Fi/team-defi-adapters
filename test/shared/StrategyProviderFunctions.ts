import * as RegistryFunctions from "./RegistryFunctions";
import * as utilities from "./utilities";
import { Contract } from "ethers";
import { GAS_OVERRIDE_OPTIONS } from "./constants";

export async function setBestBasicStrategy(
    strategyObject: { strategy: string | any[] },
    tokensHash: string,
    optyRegistry: Contract,
    strategyProvider: Contract
) {
    let setStrategyTxGasUsed = 0;
    //  Setting the strategy and making it the best strategy so that each strategy can be tested
    //  before testing depositRebalance() and withdrawRebalance()
    const strategySteps: (string | boolean)[][] = [];
    let previousStepOutputToken = "";
    for (let index = 0; index < strategyObject.strategy.length; index++) {
        const tempArr: (string | boolean)[] = [];
        //  If condition For 2 step strategies
        if (previousStepOutputToken.length > 0) {
            await optyRegistry.setTokensHashToTokens([previousStepOutputToken]);
            await RegistryFunctions.approveToken(previousStepOutputToken, optyRegistry);
        }
        tempArr.push(
            strategyObject.strategy[index].contract,
            strategyObject.strategy[index].outputToken,
            strategyObject.strategy[index].isBorrow
        );
        previousStepOutputToken = strategyObject.strategy[index].outputToken;

        strategySteps.push(tempArr);
    }

    //  Iterating through each strategy step and generate the strategy Hash
    const strategyStepHash: string[] = [];
    strategySteps.forEach((tempStrategyStep, index) => {
        strategyStepHash[index] = utilities.getSoliditySHA3Hash(
            ["address", "address", "bool"],
            [tempStrategyStep[0], tempStrategyStep[1], tempStrategyStep[2]]
        );
    });
    const tokenToStrategyStepsHash = utilities.getSoliditySHA3Hash(
        ["bytes32", "bytes32[]"],
        [tokensHash, strategyStepHash]
    );

    //  Getting the strategy hash corresponding to underlying token
    const tokenToStrategyHashes = await optyRegistry.getTokenToStrategies(tokensHash);

    //  If strategyHash is already set then check revert error message from the Contract
    if (tokenToStrategyHashes.includes(tokenToStrategyStepsHash)) {
        await utilities.expectRevert(
            optyRegistry["setStrategy(bytes32,(address,address,bool)[])"](
                tokensHash,
                strategySteps
            ),
            "isNewStrategy"
        );
    } else {
        //  Setting the strategy
        const setStrategyTx = await optyRegistry[
            "setStrategy(bytes32,(address,address,bool)[])"
        ](tokensHash, strategySteps, GAS_OVERRIDE_OPTIONS);

        const setStrategyReceipt = await setStrategyTx.wait();
        setStrategyTxGasUsed = setStrategyReceipt.gasUsed.toNumber();

        const strategyHash = setStrategyReceipt.events[0].args[2];
        // //  Set Best Basic strategy
        await strategyProvider.setBestRP1Strategy(tokensHash, strategyHash);
    }
    return setStrategyTxGasUsed;
}

export async function setBestAdvanceStrategy(
    strategyObject: { strategy: string | any[] },
    tokensHash: string,
    optyRegistry: Contract,
    strategyProvider: Contract
) {
    let setStrategyTxGasUsed = 0;
    const strategySteps: (string | boolean)[][] = [];

    for (let index = 0; index < strategyObject.strategy.length; index++) {
        //  Creating an array of strategy steps
        strategySteps.push([
            strategyObject.strategy[index].contract,
            strategyObject.strategy[index].outputToken,
            strategyObject.strategy[index].isBorrow,
        ]);
    }

    let setStrategyTx;
    try {
        //  Setting the strategy
        setStrategyTx = await optyRegistry[
            "setStrategy(bytes32,(address,address,bool)[])"
        ](tokensHash, strategySteps, GAS_OVERRIDE_OPTIONS);
    } catch (error) {
        await utilities.expectRevert(
            optyRegistry["setStrategy(bytes32,(address,address,bool)[])"](
                tokensHash,
                strategySteps
            ),
            "isNewStrategy"
        );
    }

    const setStrategyReceipt = await setStrategyTx.wait();
    setStrategyTxGasUsed = setStrategyReceipt.gasUsed.toNumber();

    const strategyHash = setStrategyReceipt.events[0].args[2];

    //  Set Best Advance strategy
    await strategyProvider.setBestRP2Strategy(tokensHash, strategyHash);

    return setStrategyTxGasUsed;
}
