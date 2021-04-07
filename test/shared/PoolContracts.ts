import OptyTokenBasicPool from "../../build/Vault.json";
import OptyTokenBasicPoolMkr from "../../build/Vault_MKR.json";
import RP1VaultProxy from "../../build/InitializableImmutableAdminUpgradeabilityProxy.json";
import * as utilities from "./utilities";
import { deployContract } from "ethereum-waffle";

// Function for deploying the Pool Contracts
export async function deployPoolContracts(
    underlyingToken: any,
    ownerWallet: any,
    vaultProxyAdminWallet: any,
    OptyTokenProfilePoolMkrContractJSON: any,
    OptyTokenProfilePoolContractJSON: any,
    RegistryAddress: any,
    RiskManagerAddress: any,
    StrategyCodeProviderAddress: any,
    OptyMinterAddress: any
) {
    const VaultProxyInstance = await deployContract(ownerWallet, RP1VaultProxy, [
        vaultProxyAdminWallet.address,
    ]);

    //  Deploying the Pools Contract for MKR underlying token
    if (underlyingToken == "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2") {
        let profileVault = await deployContract(
            ownerWallet,
            OptyTokenProfilePoolMkrContractJSON,
            [RegistryAddress, underlyingToken]
        );
        const VaultProxyInstanceAsSignerUpgradeProxy = VaultProxyInstance.connect(
            vaultProxyAdminWallet
        );
        VaultProxyInstanceAsSignerUpgradeProxy.upgradeTo(profileVault.address);

        profileVault = await utilities.getContractInstance(
            VaultProxyInstance.address,
            OptyTokenProfilePoolMkrContractJSON.abi,
            ownerWallet
        );
        await profileVault.initialize(
            RegistryAddress,
            RiskManagerAddress,
            underlyingToken,
            StrategyCodeProviderAddress,
            OptyMinterAddress
        );
        return profileVault;
    } else {
        //  Deploying the Pool Contract for every underlying token
        let profileVault = await deployContract(
            ownerWallet,
            OptyTokenProfilePoolContractJSON,
            [RegistryAddress, underlyingToken]
        );
        const VaultProxyInstanceAsSignerUpgradeProxy = VaultProxyInstance.connect(
            vaultProxyAdminWallet
        );
        VaultProxyInstanceAsSignerUpgradeProxy.upgradeTo(profileVault.address);
        const admin = await VaultProxyInstance.admin();
        const _implementaton = await VaultProxyInstance.implementation();

        profileVault = await utilities.getContractInstance(
            VaultProxyInstance.address,
            OptyTokenProfilePoolContractJSON.abi,
            ownerWallet
        );

        await profileVault.initialize(
            RegistryAddress,
            RiskManagerAddress,
            underlyingToken,
            StrategyCodeProviderAddress,
            OptyMinterAddress
        );

        const _optyMinterContract2ndTime = await profileVault.optyMinterContract();

        return profileVault;
    }
}

export { OptyTokenBasicPool, OptyTokenBasicPoolMkr };
