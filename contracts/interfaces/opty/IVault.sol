// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for opty.fi's interest bearing vault
 * @author opty.fi
 * @notice Contains mix of permissioned and permissionless vault methods
 */
interface IVault {
    /**
     * @notice sets maximum standard deviation of vault value in a single block
     * @dev the maximum vault value jump is in percentage basis points set by governance
     * @param _maxVaultValueJump the standard deviation from a vault value in basis points
     * @return returns true on successful setting of the max vault value jump
     */
    function setMaxVaultValueJump(uint256 _maxVaultValueJump) external returns (bool);

    /**
     * @notice Withdraws the underying asset of vault from previous strategy if any,
     *         claims and swaps the reward tokens for the underlying token
     *         performs batch minting of shares for users deposited previosuly without rebalance,
     *         deposits the assets into the new strategy if any or holds the same in the vault
     * @dev the vault will be charged to compensate gas fees if operator calls this function
     */
    function rebalance() external;

    /**
     * @notice claim the rewards if any strategy have it and swap for underlying token
     * @param _hash vault invest strategy hash
     */
    function harvest(bytes32 _hash) external;

    /**
     * @notice a cheap function to deposit whole underlying token's balance
     * @dev this function does not rebalance, hence vault shares will be minted on the next rebalance
     */
    function userDepositAll() external;

    /**
     * @notice a cheap function to deposit _amount of underlying token to the vault
     * @dev the user will recieve vault shares on next rebalance
     * @param _amount the amount of the undelying token to be deposited
     * @return returns true on successful deposting underlying token without rebalance
     */
    function userDeposit(uint256 _amount) external returns (bool);

    /**
     * @notice deposit full balance in underlying token of the caller and rebalance
     * @dev the vault shares are minted right away
     */
    function userDepositAllRebalance() external;

    /**
     * @notice deposit amount of underlying token of caller and rebalance
     * @dev the vault shares are minted right away
     * @param _amount the amount of the underlying token
     * @return returns true on successful deposit of the underlying token
     */
    function userDepositRebalance(uint256 _amount) external returns (bool);

    /**
     * @notice redeem full balance of vault shares for getting yield optimized underlying tokens
     * @dev this function rebalances the vault
     */
    function userWithdrawAllRebalance() external;

    /**
     * @notice redeem the amount of vault shares for getting yield optimized underlying tokens
     * @dev this function rebalances the vault
     * @return bool returns true on successful redemption of the vault shares
     */
    function userWithdrawRebalance(uint256 _redeemAmount) external returns (bool);

    /**
     * @notice a cheap function to deposit whole underlying token's balance of caller
     * @dev the gas fees are paid in $CHI tokens and vault shares are minted on next rebalance
     */
    function userDepositAllWithCHI() external;

    /**
     * @notice a cheap function to deposit amount of  underlying token's balance of caller
     * @dev the gas fees are paid in $CHI tokens and vault shares are minted on next rebalance
     * @param _amount the amount of underlying tokens to be deposited
     */
    function userDepositWithCHI(uint256 _amount) external;

    /**
     * @notice deposit full balance in underlying token of the caller and rebalance
     * @dev the vault shares are minted right away and gas fees are paid in $CHI tokens
     */
    function userDepositAllRebalanceWithCHI() external;

    /**
     * @notice deposit amount of underlying token of caller and rebalance
     * @dev the vault shares are minted right away and gas fess are paid in $CHI tokens
     * @param _amount the amount of the underlying token
     */
    function userDepositRebalanceWithCHI(uint256 _amount) external;

    /**
     * @notice redeem full balance of vault shares for getting yield optimized underlying tokens
     * @dev this function rebalances the vault and gas fees are paid in $CHI tokens
     */
    function userWithdrawAllRebalanceWithCHI() external;

    /**
     * @notice redeem the amount of vault shares for getting yield optimized underlying tokens
     * @dev this function rebalances the vault and gas fees are paid in $CHI tokens
     * @param _redeemAmount the amount of vault shares
     */
    function userWithdrawRebalanceWithCHI(uint256 _redeemAmount) external;

    /**
     * @notice Recall vault investments from current strategy, restricts deposits
     *         and allows redemption of the shares
     * @dev this function can be invoked by governance via registry
     */
    function discontinue() external;

    /**
     * @notice This function can temporarily restrict user from depositing
     *         or withdrawing assets to and from the vault
     * @dev this function can be invoked by governance via registry
     * @param _unpaused for invoking/revoking pause over the vault
     */
    function setUnpaused(bool _unpaused) external;

    /**
     * @notice Retrieves underlying token balance in the vault
     * @return uint256 the balance of underlying token in the vault
     */
    function balance() external view returns (uint256);

    /**
     * @notice Calculates the value of a vault share in underlying token
     * @return uint256 the underling token worth a vault share is
     */
    function getPricePerFullShare() external view returns (uint256);

    /**
     * @notice assigns a risk profile name
     * @dev name of the risk profile should be approved by governance
     * @param _profile name of the risk profile
     * @return returns true on successfully setting risk profile name.
     */
    function setProfile(string memory _profile) external returns (bool);

    /**
     * @notice assigns the address of the underlying asset of the vault
     * @dev the underlying asset should be approved by the governance
     * @param _underlyingToken the address of the underlying asset
     * @return return true on successful persisting underlying asset address
     */
    function setToken(address _underlyingToken) external returns (bool);

    /**
     * @dev A helper function to validate the vault value will not be deviated from max vault value
     *      within the same block
     * @param _diff absolute difference between minimum and maximum vault value within a block
     * @param _currentVaultValue the underlying token balance of the vault
     * @return bool returns true if vault value jump is within permissible limits
     */
    function isMaxVaultValueJumpAllowed(uint256 _diff, uint256 _currentVaultValue) external view returns (bool);
}
