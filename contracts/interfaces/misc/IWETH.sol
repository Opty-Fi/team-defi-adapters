// SPDX-License-Identifier:MIT
pragma solidity 0.6.12;

interface IWETH {
    function deposit() external payable;

    function depositETH() external payable;

    function withdraw(uint256) external;

    function transfer(address recipient, uint256 amount) external;

    function balanceOf(address _holder) external view returns (uint256);
}
