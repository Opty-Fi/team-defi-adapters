// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @dev Interface used to keep all the modifiers at one place
 */
interface IModifiers {
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
    function setRegistry(address _registry) external;
}
