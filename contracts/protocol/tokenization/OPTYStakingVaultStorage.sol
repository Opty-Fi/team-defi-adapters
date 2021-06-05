// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Staking vault state that can change
 * @author opty.fi
 * @dev The storage contract for $OPTY token's staking vault
 */

contract OPTYStakingVaultStorage {
    /**
     * @notice
     * @dev
     */
    mapping(address => uint256) public userLastUpdate;

    /**
     * @notice
     * @dev
     */
    uint256 public lastPoolUpdate;

    /**
     * @notice
     * @dev
     */
    uint256 public optyRatePerSecond;

    /**
     * @notice
     * @dev
     */
    address public token; /* store the underlying token contract address (for example DAI) */

    /**
     * @notice
     * @dev
     */
    uint256 public poolValue;

    /**
     * @notice
     * @dev
     */
    uint256 public timelockPeriod;
}
