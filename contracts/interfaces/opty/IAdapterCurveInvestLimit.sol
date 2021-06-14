// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code provider/adapter for borrow functionality
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for any new defi protocol if it includes borrow
 * functionality
 */
/* solhint-disable no-empty-blocks */
interface IAdapterCurveInvestLimit {
    // /**
    //  * @notice Sets the percentage of max deposit value for the given liquidity pool
    //  * @param _liquidityPool liquidity pool address for which to set max deposit percentage
    //  * @param _maxDepositPoolPct Pool's Max deposit percentage to be set for the given liquidity pool
    //  */
    // function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external;

    /**
     * @notice Sets the default max deposit value (in munber)
     * @param _maxDepositAmountDefault Pool's Max deposit value in number to be set as default value
     */
    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external;

    // /**
    //  * @notice Sets the default percentage of max deposit pool value
    //  * @param _maxDepositPoolPctDefault Pool's Max deposit percentage to be set as default value
    //  */
    // function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) external;

    /**
     * @notice Sets the max deposit value (in munber) for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in number)
     * @param _maxDepositAmount Array of 2 Pool's Max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDeposit2Amount(address _liquidityPool, uint256[2] memory _maxDepositAmount) external;

    /**
     * @notice Sets the max deposit value (in munber) for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in number)
     * @param _maxDepositAmount Array of 3 Pool's Max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDeposit3Amount(address _liquidityPool, uint256[3] memory _maxDepositAmount) external;

    /**
     * @notice Sets the max deposit value (in munber) for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in number)
     * @param _maxDepositAmount Array of 4 Pool's Max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDeposit4Amount(address _liquidityPool, uint256[4] memory _maxDepositAmount) external;
}
