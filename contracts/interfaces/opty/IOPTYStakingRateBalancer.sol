// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

/**
 * @title Interface for $OPTY staking rate balancer
 * @author opty.fi
 * @notice Contains permissioned staking rate balancer methods
 */
interface IOPTYStakingRateBalancer {
    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setStakingVaultMultipliers(address _stakingVault, uint256 _multiplier) external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function setStakingVaultOPTYAllocation(uint256 _stakingVaultOPTYAllocation) external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function updateOptyRates() external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function updateStakedOPTY(address _staker, uint256 _amount) external returns (bool);

    /**
     * @notice
     * @dev
     * @param
     * @param
     * @param
     * @return
     */
    function updateUnstakedOPTY(address _staker, uint256 _shares) external returns (bool);
}
