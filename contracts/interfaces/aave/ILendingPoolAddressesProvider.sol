  
// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

interface ILendingPoolAddressesProvider {
    function getLendingPool() external view returns (address);
    function getLendingPoolCore() external view returns (address);
    function getPriceOracle() external view returns(address);
}