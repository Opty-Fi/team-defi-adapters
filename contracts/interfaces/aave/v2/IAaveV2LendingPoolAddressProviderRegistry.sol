// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface IAaveV2LendingPoolAddressProviderRegistry {
    function getAddressesProvidersList() external view returns (address[] memory);

    function getAddressesProviderIdByAddress(address addressesProvider) external view returns (uint256);
}
