import Registry from "../../build/Registry.json";
import RegistryProxy from "../../build/RegistryProxy.json";
import RiskManager from "../../build/RiskManager.json";
import HarvestCodeProvider from "../../build/HarvestCodeProvider.json";
import StrategyCodeProvider from "../../build/StrategyCodeProvider.json";
import StrategyProvider from "../../build/StrategyProvider.json";
import Opty from "../../build/OPTY.json";
import OptyMinter from "../../build/OPTYMinter.json";
import { deployContract } from "ethereum-waffle";
import * as utilities from "./utilities";
import { assert } from "chai";

//  Deploying RegistryProxy, Registry, StrategyProvider, RiskManager, Gatherer and StrategyCodeProvider Contracts
export async function deployAllGovernanceContracts(
    ownerWallet: any,
    GAS_OVERRIDE_OPTIONS: any
) {
    //  Deploy RegistryProxy
    const optyRegistryProxy = await deployContract(
        ownerWallet,
        RegistryProxy,
        [],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(optyRegistryProxy, "OptyRegistry contract not deployed");

    //  Deploy Registry
    let optyRegistry = await deployContract(
        ownerWallet,
        Registry,
        [],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(optyRegistry, "OptyRegistry contract not deployed");

    //  Setting Pending Implementation in RegistryProxy with Registry's address
    await optyRegistryProxy.setPendingImplementation(optyRegistry.address);

    //  Setting RegistryProxy to act as Registry
    await optyRegistry.become(optyRegistryProxy.address);

    optyRegistry = await utilities.getContractInstance(
        optyRegistryProxy.address,
        Registry.abi,
        ownerWallet
    );

    assert.equal(
        optyRegistry.address,
        optyRegistryProxy.address,
        "Registry Contract's address should be equal to RegistryProxy Contract's address"
    );

    //  Deploy StrategyProvider
    const strategyProvider = await deployContract(
        ownerWallet,
        StrategyProvider,
        [optyRegistry.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(strategyProvider, "StrategyProvider contract not deployed");

    //  Deploy RiskManager
    const riskManager = await deployContract(
        ownerWallet,
        RiskManager,
        [optyRegistry.address, strategyProvider.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(riskManager, "RiskManager contract not deployed");

    //  Deploy Gatherer
    const harvestCodeProvider = await deployContract(
        ownerWallet,
        HarvestCodeProvider,
        [optyRegistry.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(harvestCodeProvider, "Gatherer contract not deployed");

    //  Deploy StrategyCodeProvider
    const optyStrategyCodeProvider = await deployContract(
        ownerWallet,
        StrategyCodeProvider,
        [optyRegistry.address, harvestCodeProvider.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(
        optyStrategyCodeProvider,
        "OptyStrategyCodeProvider contract not deployed"
    );
    const opty = await deployContract(
        ownerWallet,
        Opty,
        [optyRegistryProxy.address, 0],
        GAS_OVERRIDE_OPTIONS
    );
    const optyMinter = await deployContract(ownerWallet, OptyMinter, [
        optyRegistry.address,
        opty.address,
    ]);

    return [
        optyRegistry,
        strategyProvider,
        riskManager,
        harvestCodeProvider,
        optyStrategyCodeProvider,
        optyMinter,
    ];
}
