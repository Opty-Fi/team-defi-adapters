// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for opty.fi's interest bearing vault
 * @author opty.fi
 * @notice Contains mix of permissioned and permissionless vault methods
 */
interface IVault {
    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setProfile(string memory _profile) external returns (bool _success);

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
    function setMaxVaultValueJump(uint256 _maxVaultValueJump) external returns (bool _success);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function rebalance() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function harvest(bytes32 _hash) external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function discontinue() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setUnpaused(bool _unpaused) external;

    /**
     * @notice underlying token balance of vault token
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
    function isMaxVaultValueJumpAllowed(uint256 _diff, uint256 _currentVaultValue) external view returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function getPricePerFullShare() external view returns (uint256);

    // no CHI functions

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositAll() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDeposit(uint256 _amount) external returns (bool _success);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositAllRebalance() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositRebalance(uint256 _amount) external returns (bool _success);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userWithdrawAllRebalance() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userWithdrawRebalance(uint256 _redeemAmount) external returns (bool);

    // CHI token functions

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositAllWithCHI() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositWithCHI(uint256 _amount) external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositAllRebalanceWithCHI() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userDepositRebalanceWithCHI(uint256 _amount) external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userWithdrawAllRebalanceWithCHI() external;

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function userWithdrawRebalanceWithCHI(uint256 _redeemAmount) external;
}
