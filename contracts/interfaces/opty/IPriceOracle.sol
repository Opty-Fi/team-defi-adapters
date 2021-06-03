// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;

/**
 * @dev Bridge to connect the chainlink's price oracle contract
 */

interface IPriceOracle {
    /**
     * @dev Sets the price feed oracle for the underlying token
     *
     * @param _underlyingToken address of underlying token
     * @param _oracle address of price feed oracle for underlying token provided
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` Can only be operator.
     */
    function setOracle(address _underlyingToken, address _oracle) external returns (bool);

    /**
     * @dev Get the latest price in USD for token
     *
     * @param _amount amount of underlying Token
     * @param _underlyingToken address of underlying token
     *
     * @return Returns the latest price
     */
    function getUnderlyingTokenAmountInUSD(uint256 _amount, address _underlyingToken) external view returns (uint256);

    /**
     * @dev Get the underlying token amount in USD
     *
     * @param _amount amount in USD for underlying token
     * @param _underlyingToken address of underlying token
     *
     * @return Returns the latest price
     */
    function getUSDAmountInUnderlyingToken(uint256 _amount, address _underlyingToken) external view returns (uint256);
}
