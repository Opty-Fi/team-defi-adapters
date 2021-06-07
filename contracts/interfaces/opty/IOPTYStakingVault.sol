// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for the $OPTY staking vault
 * @author opty.fi
 * @notice Containes mix of permissioned and permissionless staking vault methods
 */

interface IOPTYStakingVault {
    /**
     * @notice initialize the the period for the staking $OPTY tokens
     * @dev this function can be accessible to the operator
     * @param _timelock time period in seconds
     * @return _success returns true on successful initialization of the timelock
     */
    function setTimelockPeriod(uint256 _timelock) external returns (bool _success);

    /**
     * @notice function to set the address of the $OPTY token
     * @dev initializes the address of the $OPTY token
     * @param _underlyingToken the address of the $OPYY token
     * @return _success returns true if initialization of the staked token address is success
     */
    function setToken(address _underlyingToken) external returns (bool _success);

    /**
     * @notice Sets the rate at which $OPTYs are distributed to the stakers per second
     * @param _rate the rate of $OPTY accrual per second
     * @return _success returns true on successful initialization of the $OPTY distribution rate/second
     */
    function setOptyRatePerSecond(uint256 _rate) external returns (bool _success);

    /**
     * @notice stake whole balance of $OPTYs of the user
     * @return bool returns true on successful staking of $OPTY
     */
    function userStakeAll() external returns (bool);

    /**
     * @notice stakes amount of $OPTY sof the users
     * @param _amount the amount of $OPTY tokens
     * @return bool returns true on successful staking of the $OPTY
     */
    function userStake(uint256 _amount) external returns (bool);

    /**
     * @notice unstakes all of staked $OPTY from the vault
     * @return bool returns true on successful unstake of all staked $OPTY
     */
    function userUnstakeAll() external returns (bool);

    /**
     * @notice unstakes amount of the staked $OPTY
     * @param _redeemAmount the amount of staked $OPTY
     * @return bool returns true on successful unstakes of all staked $OPTY
     */
    function userUnstake(uint256 _redeemAmount) external returns (bool);

    /**
     * @dev modifies the state during stake/unstake of $OPTY
     * @return _success returns true on successful vault update
     */
    function updatePool() external returns (bool _success);

    /**
     * @dev Retrieve $OPTY tokens staked in the vault
     * @return uint256 the balance of $OPTY in the vault
     */
    function balance() external view returns (uint256);

    /**
     * @notice Computes the value of $veOPTY in $OPTY
     * @return uint256 calculated value of $OPTY per $veOPTY
     */
    function getPricePerFullShare() external view returns (uint256);

    /**
     * @notice Computes the amount of $OPTY accrued by staking
     * @param _user the address of the staker
     * @return uint256 accrued $OPTY tokens
     */
    function balanceInOpty(address _user) external view returns (uint256);

    /**
     * @dev Retrives the time elapsed since epoch
     * @return uint256 time in secons
     */
    function getBlockTimestamp() external view returns (uint256);
}
