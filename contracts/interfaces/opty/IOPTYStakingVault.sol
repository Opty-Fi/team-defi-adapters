// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

/**
 * @title Interface for the $OPTY staking vault
 * @author opty.fi
 * @notice Containes mix of permissioned and permissionless staking vault methods
 */

interface IOPTYStakingVault {
    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setTimelockPeriod(uint256 _timelock) external returns (bool _success);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setToken(address _underlyingToken) external returns (bool _success);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setOptyRatePerSecond(uint256 _rate) external returns (bool _success);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userStakeAll() external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userStake(uint256 _amount) external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userUnstakeAll() external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userUnstake(uint256 _redeemAmount) external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function updatePool() external returns (bool _success);

    /**
     * @dev Function to get the underlying token balance of OptyPool Contract
     */
    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function balance() external view returns (uint256);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function getPricePerFullShare() external view returns (uint256);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function balanceInOpty(address _user) external view returns (uint256);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function getBlockTimestamp() external view returns (uint256);
}
