// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { DataTypes } from "../../../libraries/types/DataTypes.sol";

/**
 * @title Interface for setting deposit invest limit for defi adapters except Curve
 * @author Opty.fi
 * @notice Interface of the Defi protocol adapter for setting invest limit for deposit
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc except Curve.
 * It is used as an interface layer for setting max invest limit and its type in number or percentage for defi adapters
 * Conventions used:
 *  - lp: liquidityPool
 */
interface IAdapterInvestLimit {
    /**
     * @notice Sets the default max deposit value (in munber)
     * @param _maxDepositAmountDefault Pool's Max deposit value in number to be set as default value
     */
    function setMaxDepositAmountDefault(uint256 _maxDepositAmountDefault) external;

    /**
     * @notice Sets the max deposit value (in munber) for the given lp
     * @param _liquidityPool lp address for which to set max deposit value (in number)
     * @param _maxDepositAmount Pool's Max deposit value in number to be set for the given lp
     */
    function setMaxDepositAmount(address _liquidityPool, uint256 _maxDepositAmount) external;

    /**
     * @notice Sets the max deposit amount's data type
     * @dev Types (can be number or percentage) supported for the maxDeposit value
     * @param _type Type of maxDeposit to be set (can be Number or percentage)
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) external;
}
