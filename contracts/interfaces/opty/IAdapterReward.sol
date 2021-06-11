// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code provider/adapter for reward token functionality
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for any new defi protocol if it includes reward token
 * functionality
 */
interface IAdapterReward {
    /**
     * @notice Returns the amount of accrued reward tokens
     * @param _optyVault Vault contract address
     * @param _liquidityPool liquidityPool address from where to unclaim reward tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getUnclaimedRewardTokenAmount(address payable _optyVault, address _liquidityPool)
        external
        view
        returns (uint256 _codes);

    /**
     * @notice Returns code for claiming the reward tokens (eg: COMP etc.)
     * @param _optyVault Vault contract address
     * @param _liquidityPool liquidityPool address from where to claim reward tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getClaimRewardTokenCode(address payable _optyVault, address _liquidityPool)
        external
        view
        returns (bytes[] memory _codes);

    /**
     * @notice Returns the code for harvesting some rewards
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address where to harvest some liquidityPool tokens
     * @param _rewardTokenAmount amount of lpToken to be harvested
     * @return _codes Returns a bytes value to be executed
     */
    function getHarvestSomeCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _rewardTokenAmount
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Returns the code for harvesting all reward
     * @param _optyVault Vault contract address
     * @param _underlyingToken List of underlying token addresses for the given liquidity pool
     * @param _liquidityPool liquidityPool address where to harvest all liquidityPool tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);
}
