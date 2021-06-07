// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title OPTY Minter state that can change
 * @author opty.fi
 * @dev The storage contract for the $OPTY minter's state variables.
 */

contract OPTYMinterStorage {
    /**
     * @dev A data type to persist vault's state or user'state
     * @param index The market's last index
     * @param timestamp The block number the index was last updated at
     */
    struct OptyState {
        uint224 index;
        uint32 timestamp;
    }

    /**
     * @notice Whitelisted $OPTY staking vaults
     */
    mapping(address => bool) public stakingVaults;

    /**
     * @notice The $OPTY token's address
     */
    address public optyAddress;

    /**
     * @notice Store the timestamp when vault invokes
     *         updateOptyVaultIndex for first time
     */
    mapping(address => uint256) public optyVaultStartTimestamp;

    /**
     * @notice store the list of all interest bearing vault
     */
    address[] public allOptyVaults;

    /**
     * @notice Whitelisted interest bearing vaults
     */
    mapping(address => bool) public optyVaultEnabled;

    /**
     * @notice $OPTY's rate received by vaults per second
     */
    mapping(address => uint256) public optyVaultRatePerSecond;

    /**
     * @notice $OPTY's rate receive by each market per second per
     *         interest bearing token.
     */
    mapping(address => uint256) public optyVaultRatePerSecondAndVaultToken;

    /**
     * @notice $OPTY accrued by account but not claimed
     */
    mapping(address => uint256) public optyAccrued;

    /**
     * @notice persist the state of $OPTY per vault
     */
    mapping(address => OptyState) public optyVaultState;

    /**
     * @notice The $OPTY index for each market for each
     *         user as of the last time they accrued OPTY
     */
    mapping(address => mapping(address => OptyState)) public optyUserStateInVault;

    /**
     * @notice  The time at which the rewards of the user
     *          get updated via vault
     */
    mapping(address => mapping(address => uint256)) public lastUserUpdate;

    /**
     * @notice Period till $OPTY cannot be unlocked
     *         This period cannot exceed maxUnlockClaimOPTYTimestamp
     */
    uint256 public operatorUnlockClaimOPTYTimestamp;

    /**
     * @notice Master lock period after which $OPTY
     *         can be claimed
     */
    uint256 public maxUnlockClaimOPTYTimestamp;
}
