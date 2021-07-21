// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface ICurveAddressProvider {
    // solhint-disable-next-line func-name-mixedcase
    function get_registry() external view returns (address);
}
