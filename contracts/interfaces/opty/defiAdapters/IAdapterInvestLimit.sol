// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { DataTypes } from "../../../libraries/types/DataTypes.sol";

/**
 * @title Interface for setting deposit invest limit for DeFi adapters except Curve
 * @author Opty.fi
 * @notice Interface of the DeFi protocol adapter for setting invest limit for deposit
 * @dev Abstraction layer to different DeFi protocols like AaveV1, Compound etc except Curve.
 * It is used as an interface layer for setting max invest limit and its type in number or percentage for DeFi adapters
 * Conventions used:
 *  - lp: liquidityPool
 */
interface IAdapterInvestLimit {
    /**
     * @notice Sets the default max deposit value (in absolute value)
     * @param _maxDepositAmountDefault Pool's Max deposit value in absolute value to be set as default value
     */
    function setMaxDepositAmountDefault(uint256 _maxDepositAmountDefault) external;

    /**
     * @notice Sets the max deposit value (in absolute value) for the given lp
     * @param _liquidityPool lp address for which to set max deposit value (in absolute value)
     * @param _maxDepositAmount Pool's Max deposit value in absolute value to be set for the given lp
     */
    function setMaxDepositAmount(address _liquidityPool, uint256 _maxDepositAmount) external;

    /**
     * @notice Sets the max deposit amount's data type
     * @dev Types (can be absolute value or percentage) supported for the maxDeposit value
     * @param _type Type of maxDeposit to be set (can be absolute value or percentage)
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) external;
}
