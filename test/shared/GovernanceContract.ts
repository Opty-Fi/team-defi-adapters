import OptyRegistry from "../../build/Registry.json";
import RegistryProxy from "../../build/RegistryProxy.json";
import RiskManager from "../../build/RiskManager.json";
import Gatherer from "../../build/Gatherer.json";
import OptyStrategyCodeProvider from "../../build/StrategyCodeProvider.json";
import StrategyProvider from "../../build/StrategyProvider.json";
import Opty from "../../build/OPTY.json";
import OptyMinter from "../../build/OPTYMinter.json";
import HarvestCodeProvider from "../../build/HarvestCodeProvider.json";
import { deployContract } from "ethereum-waffle";
import * as utilities from "./utilities";
import { assert } from "chai";

//  Deploying RegistryProxy, Registry, StrategyProvider, RiskManager, Gatherer and StrategyCodeProvider Contracts
export async function deployAllGovernanceContracts(
    ownerWallet: any,
    RegistryProxyContractJSON: any,
    RegistryContractJSON: any,
    StrategyProviderContractJSON: any,
    RiskManagerContractJSON: any,
    GathererContractJSON: any,
    StrategyCodeProviderContractJSON: any,
    OptyContractJSON: any,
    OptyMinterContractJSON: any,
    HarvestCodeProviderJSON: any,
    GAS_OVERRIDE_OPTIONS: any
) {
    //  Deploy RegistryProxy
    const optyRegistryProxy = await deployContract(
        ownerWallet,
        RegistryProxyContractJSON,
        [],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(optyRegistryProxy, "OptyRegistry contract not deployed");

    //  Deploy Registry
    let optyRegistry = await deployContract(
        ownerWallet,
        RegistryContractJSON,
        [],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(optyRegistry, "OptyRegistry contract not deployed");

    //  Setting Pending Implementation in RegistryProxy with Registry's address
    await optyRegistryProxy.setPendingImplementation(optyRegistry.address);

    //  Setting RegistryProxy to act as Registry
    await optyRegistry.become(optyRegistryProxy.address);

    //  Checking status if the registry implementation is set or not
    const registryImplementationAddress = await optyRegistryProxy.registryImplementation();

    optyRegistry = await utilities.getContractInstance(
        optyRegistryProxy.address,
        RegistryContractJSON.abi,
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
        StrategyProviderContractJSON,
        [optyRegistry.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(strategyProvider, "StrategyProvider contract not deployed");

    //  Deploy RiskManager
    const riskManager = await deployContract(
        ownerWallet,
        RiskManagerContractJSON,
        [optyRegistry.address, strategyProvider.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(riskManager, "RiskManager contract not deployed");

    //  Deploy Gatherer
    const gatherer = await deployContract(
        ownerWallet,
        GathererContractJSON,
        [optyRegistry.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(gatherer, "Gatherer contract not deployed");

    //  Deploy StrategyCodeProvider
    const optyStrategyCodeProvider = await deployContract(
        ownerWallet,
        StrategyCodeProviderContractJSON,
        [optyRegistry.address, gatherer.address],
        GAS_OVERRIDE_OPTIONS
    );
    assert.isDefined(
        optyStrategyCodeProvider,
        "OptyStrategyCodeProvider contract not deployed"
    );
    const opty = await deployContract(
        ownerWallet,
        OptyContractJSON,
        [optyRegistryProxy.address, 0],
        GAS_OVERRIDE_OPTIONS
    );
    const optyMinter = await deployContract(ownerWallet, OptyMinterContractJSON, [
        optyRegistry.address,
        opty.address,
    ]);
    const harvestCodeProvider = await deployContract(
        ownerWallet,
        HarvestCodeProviderJSON,
        [optyRegistry.address, gatherer.address]
    );
    return [
        optyRegistry,
        strategyProvider,
        riskManager,
        gatherer,
        optyStrategyCodeProvider,
        optyMinter,
        harvestCodeProvider,
    ];
}

export {
    OptyRegistry,
    RegistryProxy,
    RiskManager,
    Gatherer,
    OptyStrategyCodeProvider,
    StrategyProvider,
    Opty,
    OptyMinter,
    HarvestCodeProvider,
};
