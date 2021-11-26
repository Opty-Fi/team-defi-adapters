// solhint-disable func-name-mixedcase
// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface ICurveGaugeRead {
    function deposit(uint256 _value) external;

    function withdraw(uint256 _value) external;

    function claimable_tokens(address _holder) external view returns (uint256);

    function minter() external view returns (address);

    function balanceOf(address _holder) external view returns (uint256);
}