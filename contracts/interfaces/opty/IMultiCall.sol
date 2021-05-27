// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

/**
 * @dev Interface of the Opty.fi Vaults.
 */
interface IMultiCall {
    function executeCode(bytes calldata _code, string calldata _errorMsg) external;

    function executeCodes(bytes[] calldata _codes, string calldata _errorMsg) external;
}
