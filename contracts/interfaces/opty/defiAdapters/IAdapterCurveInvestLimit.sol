// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for setting deposit invest limit for Curve adapter
 * @author Opty.fi
 * @notice Interface for Curve adapters for setting invest limit for deposit
 * @dev Abstraction layer to Curve Adapters.
 * It is used as an interface layer for setting max invest limit and its type in number or percentage for Curve adapters
 */
interface IAdapterCurveInvestLimit {
    /**
     * @notice Sets the default absolute max deposit value in underlying
     * @param _maxDepositAmountDefault array of 4 absolute max deposit values in underlying to be set as default value
     */
    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external;

    /**
     * @notice Sets the absolute max deposit value in underlying for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in absolute value)
     * @param _maxDepositAmount Array of Pool's max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDepositAmount(address _liquidityPool, uint256[] memory _maxDepositAmount) external;

    /**
     * @notice Sets the type of investment limit
     *                  1. Percentage of pool value
     *                  2. Amount in underlying token
     * @dev Types (can be number or percentage) supported for the maxDeposit value
     * @param _type Type of maxDeposit to be set (can be absolute value or percentage)
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) external;
}
