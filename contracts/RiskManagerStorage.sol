// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./controller/StrategyProvider.sol";

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

    string public constant RP1 = "RP1";
    string public constant RP2 = "RP2";
    string public constant RP3 = "RP3";
    uint256 public T1_limit;
    uint256 public T2_limit;
    uint256 public T3_limit;
}
