// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @dev Interface for StrategyManager -
 *      Central processing unit of the earn protocol
 */

interface IStrategyManager {
    /**
     * @dev Get the withdrawal codes steps count corresponding
     *      to the stretagy hash provided
     *
     * @param _hash Hash of the strategy being used in vault contract
     *
     * @return Returns the withdrawal codes steps count corresponding
     *         to the stretagy hash provided
     */
    function getWithdrawAllStepsCount(bytes32 _hash) external view returns (uint8);

    /**
     * @dev Get the deposit codes steps count corresponding
     *      to the stretagy hash provided
     *
     * @param _hash Hash of the strategy being used in vault contract
     *
     * @return Returns the deposit codes steps count corresponding
     *         to the stretagy hash provided
     */
    function getDepositAllStepCount(bytes32 _hash) external view returns (uint8);

    /**
     * @dev Get the claim reward token codes steps count corresponding
     *      to the stretagy hash provided
     *
     * @param _hash Hash of the strategy being used in vault contract
     *
     * @return Returns the claim reward token codes steps count corresponding
     *         to the stretagy hash provided
     */
    function getClaimRewardStepsCount(bytes32 _hash) external view returns (uint8);

    /**
     * @dev Get the harvest reward token codes steps count corresponding
     *      to the stretagy hash provided
     *
     * @param _hash Hash of the strategy being used in vault contract
     *
     * @return Returns the harvest reward token codes steps count corresponding
     *         to the stretagy hash provided
     */
    function getHarvestRewardStepsCount(bytes32 _hash) external view returns (uint8);

    /**
     * @dev Get the balance of vault in underlyingToken provided
     *
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token (eg: DAI, USDC etc.) address
     * @param _hash Hash of the strategy being used in vault contract
     *
     * @return _balance Returns the balance of vault in underlyingToken provided
     */
    function getBalanceInUnderlyingToken(
        address payable _optyVault,
        address _underlyingToken,
        bytes32 _hash
    ) external view returns (uint256 _balance);

    /**
     * @dev Get all codes for depositing into pool available from the
     *      strategy hash provided
     *
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token (eg: DAI, USDC etc.) address
     * @param _hash Hash of the strategy being used in vault contract
     * @param _stepIndex The index corresponding to the strategy step
     * @param _stepCount Total steps count in the strategy
     *
     * @return _codes Returns all codes for depositing into pool available
     *         from the strategy hash provided
     */
    function getPoolDepositAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get all codes for withdrawing from pool available in the
     *      strategy hash provided
     *
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token (eg: DAI, USDC etc.) address
     * @param _hash Hash of the strategy being used in vault contract
     * @param _stepIndex The index corresponding to the strategy step
     * @param _stepCount Total steps count in the strategy
     *
     * @return _codes Returns all codes for withdrawing from pool available
     *         in the strategy hash provided
     */
    function getPoolWithdrawAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get all codes for claiming reward tokens from pool available in the
     *      strategy hash provided
     *
     * @param _optyVault Vault contract address
     * @param _hash Hash of the strategy being used in vault contract
     * @param _stepIndex The index corresponding to the strategy step
     * @param _stepCount Total steps count in the strategy
     *
     * @return _codes Returns all codes for claiming reward tokens from pool available
     *         in the strategy hash provided
     */
    function getPoolClaimAllRewardCodes(
        address payable _optyVault,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get all codes for harvesting reward tokens from pool available in the
     *      strategy hash provided
     *
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token (eg: DAI, USDC etc.) address
     * @param _investStrategyHash Hash of the strategy being used in vault contract
     * @param _stepIndex The index corresponding to the strategy step
     * @param _stepCount Total steps count in the strategy
     *
     * @return _codes Returns all codes for harvesting reward tokens from pool available
     *         in the strategy hash provided
     */
    function getPoolHarvestAllRewardCodes(
        address payable _optyVault,
        address _underlyingToken,
        bytes32 _investStrategyHash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get some codes (with the amount cal. based on _convertRewardTokensPercent) for
     *      harvesting reward tokens from pool available in the strategy hash provided
     *
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token (eg: DAI, USDC etc.) address
     * @param _investStrategyHash Hash of the strategy being used in vault contract
     * @param _convertRewardTokensPercent Percentage in basis point for converting reward tokens
     * @param _stepIndex The index corresponding to the strategy step
     * @param _stepCount Total steps count in the strategy
     *
     * @return _codes Returns some codes for harvesting reward tokens from pool available
     *         in the strategy hash provided
     */
    function getPoolHarvestSomeRewardCodes(
        address payable _optyVault,
        address _underlyingToken,
        bytes32 _investStrategyHash,
        uint256 _convertRewardTokensPercent,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get liquidityPool, adapter and reward token corresponding to the
     *      _investStrategyHash provided
     *
     * @param _investStrategyHash Hash of the strategy being used in vault contract
     *
     * @return _liquidityPool Liquidity pool (like cDai, etc.) address
     * @return _optyAdapter Adapter contract address mapped to liquidity pool
     * @return _rewardToken Reward token address
     */
    function getLpAdapterRewardToken(bytes32 _investStrategyHash)
        external
        view
        returns (
            address _liquidityPool,
            address _optyAdapter,
            address _rewardToken
        );

    /**
     * @dev Get the codes for the withdraw fee split shares between the
     *      treasury accounts and also the codes for the remaining amount
     *      to be transferred to the caller (user or msg.sender)
     *
     * @param _treasuryShares Shares (in basis percent) for corresponding
     *                        treasury account address
     * @param _account User's (msg.sender) address who is initiating withdraw
     * @param _underlyingToken Underlying toke address
     * @param _redeemAmountInToken Amount to be redeemed in token
     * @param _withdrawalFee Total withdrawal Fee (in basis percent) to be charged
     */
    function getFeeTransferAllCodes(
        DataTypes.TreasuryShare[] memory _treasuryShares,
        address _account,
        address _underlyingToken,
        uint256 _redeemAmountInToken,
        uint256 _withdrawalFee
    ) external pure returns (bytes[] memory _treasuryCodes, bytes memory _accountCode);
}
