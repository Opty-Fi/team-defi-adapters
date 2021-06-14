// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for Reward tokens and Swapping tokens for the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code adapter for reward tokens and swapping tokens functionality
 * @dev Abstraction layer to different defi protocols like Compound, Cream etc.
 * It is used as a layer for adding any new function related to reward token feature to be used in defi-adapters.
 * It is also used as a middleware for adding functionality of swapping/harvesting of tokens used in defi-adapters.
 * Conventions used:
 *  - lp: liquidityPool
 */
interface IAdapterHarvestReward {
    /**
     * @notice Returns the amount of accrued reward tokens
     * @param _optyVault Vault contract address
     * @param _liquidityPool lp address from where to unclaim reward tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getUnclaimedRewardTokenAmount(address payable _optyVault, address _liquidityPool)
        external
        view
        returns (uint256 _codes);

    /**
     * @notice Return codes for claiming the reward tokens (eg: COMP etc.)
     * @param _optyVault Vault contract address
     * @param _liquidityPool lp address from where to claim reward tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getClaimRewardTokenCode(address payable _optyVault, address _liquidityPool)
        external
        view
        returns (bytes[] memory _codes);

    /**
     * @dev Return codes for swapping specified amount of rewards in vault to underlying tokens via DEX like Uniswap
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp address where to harvest some lp tokens
     * @param _rewardTokenAmount amount of reward token to be harvested to underlyingTokens via DEX
     * @return _codes Returns a bytes value to be executed
     */
    function getHarvestSomeCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _rewardTokenAmount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Return codes for swapping full balance of rewards in vault to underlying tokens via DEX like Uniswap
     * @param _optyVault Vault contract address
     * @param _underlyingToken List of underlying token addresses for the given lp
     * @param _liquidityPool lp address where to harvest all lp tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Sets the reward token for defi protocols like Compound, DForce etc.
     * @param _rewardToken Address of reward token to be set
     */
    function setRewardToken(address _rewardToken) external;
}
