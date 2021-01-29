// SPDX-License-Identifier:MIT

pragma solidity ^0.6.10;

import "../../ERC20/IERC20.sol";

interface IAaveV2Token {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);

    function RESERVE_TREASURY_ADDRESS() external view returns (address);

    function POOL() external view returns (address);

    function scaledBalanceOf(address user) external view returns (uint256);

    function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256);

    function scaledTotalSupply() external view returns (uint256);

    function isTransferAllowed(address user, uint256 amount) external view returns (bool);
}
