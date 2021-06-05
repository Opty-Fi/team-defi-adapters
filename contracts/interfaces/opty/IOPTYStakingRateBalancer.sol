// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for $OPTY staking rate balancer
 * @author opty.fi
 * @notice Contains permissioned staking rate balancer methods
 */
interface IOPTYStakingRateBalancer {
    /**
     * @dev Assign a rate balancing co-efficient to the staking vault
     * @param _stakingVault the $OPTY staking vault
     * @param _multiplier the co-efficient to balance the $OPTY rate
     * @return _success returns true if assigning co-efficient is successful
     */
    function setStakingVaultMultipliers(address _stakingVault, uint256 _multiplier) external returns (bool _success);

    /**
     * @dev assign $OPTY allocated to staking vaults only by governance
     * @param _stakingVaultOPTYAllocation amount of $OPTY alloted to all stakingVaults as a whole
     * @return _success returns true if $OPTY allocation to staking vault is assigned succesfuly
     */
    function setStakingVaultOPTYAllocation(uint256 _stakingVaultOPTYAllocation) external returns (bool _success);

    /**
     * @dev balance the $OPTY rate across all staking vaults
     * @return _success returns true on successful update to $OPTY rate
     */
    function updateOptyRates() external returns (bool _success);

    /**
     * @dev update $OPTY staked on per user and per vault basis only called by staking vault
     * @param _staker the account address that staked $OPTY
     * @param _amount the amount of $OPTY staked
     * @return _success returns true on successful update to state of staked $OPTY
     */
    function updateStakedOPTY(address _staker, uint256 _amount) external returns (bool _success);

    /**
     * @dev deduct the $OPTY that is staked by user and vault as a whole
     * @param _staker the account addres that unstaked $OPTY
     * @param _shares the amount of $stkOPTY to unstake
     * @return _success returns true on successful update to state of unstaked $OPTY
     */
    function updateUnstakedOPTY(address _staker, uint256 _shares) external returns (bool _success);
}
