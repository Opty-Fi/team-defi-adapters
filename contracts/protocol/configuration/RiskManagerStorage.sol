// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title RiskManagerStorage Contract
 * @author Opty.fi
 * @notice Contract to store the state variables of the RiskManager Contract
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

    /**
     * @notice Zero bytes32 type Constant
     */
    bytes32 public constant ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
}
