// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for PriceOracle Contract
 * @author Opty.fi
 * @notice Bridge to connect the chainlink's price oracle contract
 */
interface IPriceOracle {
    /**
     * @dev Sets the price feed for the underlying token
     * @param _underlyingToken address of underlying token
     * @param _oracle address of price feed for underlying token provided
     * @return A boolean value indicating whether the operation succeeded
     */
    function setOracle(address _underlyingToken, address _oracle) external returns (bool);

    /**
     * @dev Get the latest price in USD for token
     * @param _amount amount in USD
     * @param _underlyingToken address of underlying token
     * @return Returns the no. of tokens for an amount given in USD
     */
    function getUnderlyingTokenAmountInUSD(uint256 _amount, address _underlyingToken) external view returns (uint256);

    /**
     * @dev Get the underlying token amount in USD
     * @param _amount amount in underlyingToken
     * @param _underlyingToken address of underlying token
     * @return Returns the value in USD for the underlying tokens provided
     */
    function getUSDAmountInUnderlyingToken(uint256 _amount, address _underlyingToken) external view returns (uint256);
}
