// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

interface ICompound {
    function mint ( uint256 mintAmount ) external returns ( uint256 );
    function redeem(uint256 redeemTokens) external returns (uint256);
    function exchangeRateStored() external view returns (uint);
}