// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @dev Contract to store the OPTYMinter's state variables
 */

contract OPTYMinterStorage {
    mapping(address => bool) public stakingVaults;

    address public optyAddress;

    mapping(address => uint256) public optyVaultStartTimestamp;

    address[] public allOptyVaults;

    mapping(address => bool) public optyVaultEnabled;

    /// @notice The portion of optyRate that each market currently receives
    mapping(address => uint256) public optyVaultRatePerSecond;

    /// @notice The portion of optyRate that each market currently receives divided by the amount of LP tokens
    mapping(address => uint256) public optyVaultRatePerSecondAndVaultToken;

    /// @notice The OPTY accrued but not yet transferred to each user
    mapping(address => uint256) public optyAccrued;

    /// @notice The OPTY market supply state for each optyPool
    mapping(address => DataTypes.RewardsState) public optyVaultState;

    /// @notice The OPTY index for each market for each user as of the last time they accrued OPTY
    mapping(address => mapping(address => DataTypes.RewardsState)) public optyUserStateInVault;

    mapping(address => mapping(address => uint256)) public lastUserUpdate;

    uint256 public operatorUnlockClaimOPTYTimestamp;
}
