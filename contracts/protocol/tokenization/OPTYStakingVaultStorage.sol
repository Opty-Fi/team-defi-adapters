// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

/**
 * @title Staking vault state that can change
 * @author opty.fi
 * @dev The storage contract for $OPTY token's staking vault
 */

contract OPTYStakingVaultStorage {
    mapping(address => uint256) public userLastUpdate;
    uint256 public lastPoolUpdate;
    uint256 public optyRatePerSecond;
    address public token; /* store the underlying token contract address (for example DAI) */
    uint256 public poolValue;
    uint256 public timelockPeriod;
}
