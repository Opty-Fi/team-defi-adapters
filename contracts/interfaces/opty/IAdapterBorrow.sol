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
interface IAdapterBorrow {
    /**
     * @dev Get codes for token amount that can be borrowed safely against the underlying token when kept as collateral
     * @param _optyVault Address of vault contract
     * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
     * @param _liquidityPool liquidity Pool address from where to borrow
     * @param _outputToken token address to borrow
     * @return _codes Returns a bytes value to be executed
     */
    function getBorrowAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        address _outputToken
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Return codes require to reapy the debt, unlock collateral and redeem shares from the given liquidity pool
     * @param _optyVault Address of vault contract
     * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
     * @param _liquidityPoolAddressProvider address of liquidity Pool address provider where to repay collateral
     * @param _outputToken token address to borrow
     * @return _codes Returns a bytes value to be executed
     */
    function getRepayAndWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPoolAddressProvider,
        address _outputToken
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get the amount in underlying token that you'll receive if borrowed token is repaid
     * @dev Returns the amount in underlying token for _liquidityPoolTokenAmount collateral if
     * _borrowAmount in _borrowToken is repaid.
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPoolAddressProvider liquidityPool address from where to borrow the tokens
     * @param _borrowToken address of token to borrow
     * @param _borrowAmount amount of token to be borrowed
     * @return Returns the amount in underlying token that can be received if borrowed token is repaid
     */
    function getSomeAmountInTokenBorrow(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPoolAddressProvider,
        uint256 _liquidityPoolTokenAmount,
        address _borrowToken,
        uint256 _borrowAmount
    ) external view returns (uint256);

    /**
     * @notice Get the amount in underlying token that you'll receive if whole balance of vault borrowed token is repaid
     * @dev Returns the amount in underlying token for whole collateral of _optyVault balance if
     * _borrowAmount in _borrowToken is repaid.
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPoolAddressProvider liquidityPool address from where to borrow the tokens
     * @param _borrowToken address of token to borrow
     * @param _borrowAmount amount of token to be borrowed
     * @return Returns the amount in underlying token that you'll receive if whole bal of vault borrowed token is repaid
     */
    function getAllAmountInTokenBorrow(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPoolAddressProvider,
        address _borrowToken,
        uint256 _borrowAmount
    ) external view returns (uint256);
}
