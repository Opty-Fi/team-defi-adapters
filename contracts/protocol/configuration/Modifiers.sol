// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";
import { IRegistry } from "../../interfaces/opty/IRegistry.sol";

/**
 * @dev Contract used to keep all the modifiers at one place
 */
abstract contract Modifiers {
    IRegistry public registryContract;

    using Address for address;

    /**
     * @dev Sets the owner, governance and strategist while deploying the contract
     */
    constructor(address _registry) internal {
        registryContract = IRegistry(_registry);
    }

    /**
     * @dev Function to check if the address is zero address or not
     */
    function isZeroAddress(address _address) internal pure returns (bool) {
        require(_address != address(0), "Modifiers: caller is zero address");
        return true;
    }

    function setRegistry(address _registry) public onlyOperator {
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
        require(msg.sender == registryContract.governance(), "caller is not having governance");
        _;
    }

    /**
     * @dev Modifier to check caller is operator or not
     */
    modifier onlyOperator() {
        require(msg.sender == registryContract.operator(), "caller is not the operator");
        _;
    }

    /**
     * @dev Modifier to check caller is strategist or not
     */
    modifier onlyStrategist() {
        require(msg.sender == registryContract.strategist(), "caller is not the strategist");
        _;
    }

    /**
     * @dev Modifier to check caller is minter or not
     */
    modifier onlyMinter() {
        require(msg.sender == registryContract.optyMinter(), "caller is not the minter");
        _;
    }

    modifier ifNotDiscontinued(address _vaultContract) {
        DataTypes.VaultActivityState memory _vaultActivityState =
            registryContract.vaultToVaultActivityState(_vaultContract);
        require(!_vaultActivityState.discontinued, "discontinued");
        _;
    }

    modifier ifNotPaused(address _vaultContract) {
        DataTypes.VaultActivityState memory _vaultActivityState =
            registryContract.vaultToVaultActivityState(_vaultContract);
        require(_vaultActivityState.unpaused, "paused");
        _;
    }

    modifier onlyRegistry() {
        require(msg.sender == address(registryContract), "caller is not Registry contract");
        _;
    }
}
