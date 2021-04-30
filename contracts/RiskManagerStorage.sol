// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import { StrategyProvider } from "./controller/StrategyProvider.sol";

contract RiskManagerStorage {
    /**
     * @notice Active brains of Risk Manager
     */
    address public riskManagerImplementation;
    /**
     * @notice Pending brains of Risk Manager
     */
    address public pendingRiskManagerImplementation;
    StrategyProvider public strategyProvider;

    bytes32 public constant ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
}
