// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

interface IAaveV2PriceOracle {
    function getAssetPrice(address _asset) external view returns(uint256);
    function getAssetsPrices(address[] calldata _assets) external view returns(uint256[] memory);
    function getSourceOfAsset(address _asset) external view returns(uint256);
    function getFallbackOracle() external view returns(uint256);
}
