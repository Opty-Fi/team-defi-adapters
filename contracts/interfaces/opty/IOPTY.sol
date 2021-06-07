// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @dev optyfi's governance token interface
 */
interface IOPTY {
    function mint(address to, uint256 amount) external;
}
