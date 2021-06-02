// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @dev Interface of the harvest code provider.
 */
interface IHarvestCodeProvider {
    /**
     * @dev Get the codes for harvesting the tokens using uniswap router
     *
     * @param _optyVault Address of Vault Contract
     * @param _rewardToken Reward token address
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _rewardTokenAmount reward token amount to harvest
     *
     * @return _codes Array of harvest codes which can be executed to complete the execution of
     *         harvesting of reward token
     *
     * Requirements:
     *
     * - `_rewardTokenAmount` should be greater than 0.
     */
    function getHarvestCodes(
        address payable _optyVault,
        address _rewardToken,
        address _underlyingToken,
        uint256 _rewardTokenAmount
    ) external view returns (bytes[] memory _codes);

    function getOptimalTokenAmount(
        address _borrowToken,
        address _underlyingToken,
        uint256 _borrowTokenAmount
    ) external view returns (uint256);

    function rewardBalanceInUnderlyingTokens(
        address _rewardToken,
        address _underlyingToken,
        uint256 _amount
    ) external view returns (uint256);
}
