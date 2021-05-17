// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Registry } from "./Registry.sol";

/**
 * @title Modifiers
 *
 * @author Opty.fi
 *
 * @dev Contract used to keep all the modifiers at one place
 */
abstract contract Modifiers {
    /**
     * @dev Registry contract address
     */
    Registry public registryContract;

    using Address for address;

    /**
     * @dev Sets the owner, governance and strategist while deploying the contract
     *
     * @param _registry Registry contract address
     */
    constructor(address _registry) internal {
        registryContract = Registry(_registry);
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
    function setRegistry(address _registry) external onlyOperator onlyValidAddress {
        require(_registry != address(0), "RegistryAddress==0");
        registryContract = Registry(_registry);
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
        require(msg.sender == registryContract.minter(), "caller is not the minter");
        _;
    }

    /**
     * @dev Modifier to check if vault contract is discontinued from usage or not
     */
    modifier ifNotDiscontinued(address _vault) {
        require(!registryContract.vaultToDiscontinued(_vault), "discontinued");
        _;
    }

    /**
     * @dev Modifier to check if vault contract is paused from usage or not
     */
    modifier ifNotPaused(address _vault) {
        require(!registryContract.vaultToPaused(_vault), "paused");
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
