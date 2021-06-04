// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

//  libraries
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";

//  interfaces
import { IRegistry } from "../../interfaces/opty/IRegistry.sol";
import { IModifiers } from "../../interfaces/opty/IModifiers.sol";

/**
 * @title Modifiers Contract
 * @author Opty.fi
 * @dev Contract used to keep all the modifiers at one place
 */
abstract contract Modifiers is IModifiers {
    /**
     * @notice Registry contract instance address
     */
    IRegistry public registryContract;

    using Address for address;

    constructor(address _registry) internal {
        registryContract = IRegistry(_registry);
    }

    /**
     * @inheritdoc IModifiers
     */
    function setRegistry(address _registry) external override onlyOperator {
        registryContract = IRegistry(_registry);
    }

    /**
     * @dev Modifier to check if the address is zero address or not
     */
    modifier onlyValidAddress() {
        require(msg.sender != address(0), "caller is zero address");
        _;
    }

    /**
     * @dev Modifier to check caller is governance or not
     */
    modifier onlyGovernance() {
        require(msg.sender == registryContract.getGovernance(), "caller is not having governance");
        _;
    }

    /**
     * @dev Modifier to check caller is operator or not
     */
    modifier onlyOperator() {
        require(msg.sender == registryContract.getOperator(), "caller is not the operator");
        _;
    }

    /**
     * @dev Modifier to check caller is minter or not
     */
    modifier onlyMinter() {
        require(msg.sender == registryContract.getOptyMinter(), "!minter");
        _;
    }

    modifier ifNotPausedAndDiscontinued(address _vault) {
        _ifNotPausedAndDiscontinued(_vault);
        _;
    }

    /**
     * @dev Modifier to check caller is registry or not
     */
    modifier onlyRegistry() {
        require(msg.sender == address(registryContract), "!Registry Contract");
        _;
    }

    /**
     * @notice Checks if vault contract is discontinued from usage or not
     * @param _vault Address of vault/stakingVault contract to disconitnue
     */
    function _ifNotPausedAndDiscontinued(address _vault) internal view {
        DataTypes.VaultConfiguration memory _vaultConfiguration = registryContract.getVaultConfiguration(_vault);
        require(_vaultConfiguration.unpaused && !_vaultConfiguration.discontinued, "paused or discontinued");
    }

    /**
     * @notice Checks if vault contract is paused or unpaused from usage
     * @param _vault Address of vault/stakingVault contract to pause/unpause
     */
    function _isUnpaused(address _vault) internal view {
        DataTypes.VaultConfiguration memory _vaultConfiguration = registryContract.getVaultConfiguration(_vault);
        require(_vaultConfiguration.unpaused, "paused");
    }
}
