// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";
import { IRegistry } from "../../interfaces/opty/IRegistry.sol";
import { IModifiers } from "../../interfaces/opty/IModifiers.sol";

/**
 * @title Modifiers
 *
 * @author Opty.fi
 *
 * @dev Contract used to keep all the modifiers at one place
 */
abstract contract Modifiers is IModifiers {
    /**
     * @dev Registry contract instance address
     */
    IRegistry public registryContract;

    using Address for address;

    /**
     * @dev Sets the owner, governance and strategist while deploying the contract
     *
     * @param _registry Registry contract address
     */
    constructor(address _registry) internal {
        registryContract = IRegistry(_registry);
    }

    /**
     * @dev Sets the regsitry contract address
     *
     * @param _registry address of registry contract
     *
     * Requirements:
     *
     * - `msg.sender` should be operator
     * - `registry` can not be zero address
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
     * @dev Modifier to check caller is strategist or not
     */
    modifier onlyStrategist() {
        require(msg.sender == registryContract.getStrategist(), "caller is not the strategist");
        _;
    }

    /**
     * @dev Modifier to check caller is minter or not
     */
    modifier onlyMinter() {
        require(msg.sender == registryContract.getOptyMinter(), "caller is not the minter");
        _;
    }

    /**
     * @dev Modifier to check if vault contract is discontinued from usage or not
     */
    modifier ifNotDiscontinued(address _vault) {
        DataTypes.VaultConfiguration memory _vaultConfiguration = registryContract.getVaultConfiguration(_vault);
        require(!_vaultConfiguration.discontinued, "discontinued");
        _;
    }

    /**
     * @dev Modifier to check if vault contract is unpaused or paused
     */
    modifier ifNotPaused(address _vault) {
        DataTypes.VaultConfiguration memory _vaultConfiguration = registryContract.getVaultConfiguration(_vault);
        require(_vaultConfiguration.unpaused, "paused");
        _;
    }

    /**
     * @dev Modifier to check caller is registry or not
     */
    modifier onlyRegistry() {
        require(msg.sender == address(registryContract), "caller is not Registry contract");
        _;
    }
}
