// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @dev Contract to store the state variables of the
 *      RiskManager
 */

contract RiskManagerStorage {
    /**
     * @notice Active brains of Risk Manager
     */
    address public riskManagerImplementation;
    /**
     * @notice Pending brains of Risk Manager
     */
    address public pendingRiskManagerImplementation;
}
