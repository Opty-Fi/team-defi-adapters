// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface ICurveRegistry {
    /* solhint-disable func-name-mixedcase */
    function get_lp_token(address) external view returns (address);

    function get_coins(address) external view returns (address[8] memory);

    function get_n_coins(address) external view returns (uint256[2] memory);

    function get_gauges(address) external view returns (address[10] memory, int128[10] memory);

    function get_underlying_coins(address) external view returns (address[8] memory);
    /* solhint-disable func-name-mixedcase */
}
