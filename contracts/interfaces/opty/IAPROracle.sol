// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface IAPROracle {
    /**
     * @dev Get the APR for the token from Compound protocol
     *
     * @param token Token address for which you want to get APR
     *
     * @return APR corresponding to the token provided
     */
    function getCompoundAPR(address token) external view returns (uint256);

    /**
     * @dev Get the APR for the token from AaveV1 protocol
     *
     * @param token Token address for which you want to get APR
     *
     * @return APR corresponding to the token provided
     */
    function getAaveV1APR(address token) external view returns (address, uint256);

    /**
     * @dev Get the APR for the token from AaveV2 protocol
     *
     * @param token Token address for which you want to get APR
     *
     * @return APR corresponding to the token provided
     */
    function getAaveV2APR(address token) external view returns (address, uint256);

    /**
     * @dev Get the best startegy for the token among compound and aave
     *
     * @param tokensHash Hash of token address/addresses for which
     *                   you want to get the Best strategy
     *
     * @return Best strategy hash corresponding to the tokens hash provided
     */
    function getBestAPR(bytes32 tokensHash) external view returns (bytes32);
}
