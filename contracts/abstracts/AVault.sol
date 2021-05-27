// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;
import "hardhat/console.sol";

/**
 * @title AVault
 *
 * @author Opty.fi
 *
 * @dev Abstract contract for Opty.Fi Vaults
 *
 * This contract is used for having the functions which are common
 * in the vault contracts
 */
abstract contract AVault {
    /**
     * @notice Function for executing any functionlaity and check if it is working or not
     *
     * @dev Function to execute the code and revert with error message if code provided is incorrect
     *
     * @param _code Encoded data in bytes which acts as code to execute
     * @param _errorMsg Error message to throw when code execution call fails
     */
    function executeCode(bytes memory _code, string memory _errorMsg) public {
        (address _contract, bytes memory _data) = abi.decode(_code, (address, bytes));
        (bool _success, ) = _contract.call(_data); //solhint-disable-line avoid-low-level-calls
        console.log("Success: ", _success);
        require(_success, _errorMsg);
    }

    /**
     * @notice Function for executing bunch of functionlaities and check if they are working or not
     *
     * @dev Function to execute the codes array and revert with error message if code provided is incorrect
     *
     * @param _codes Array of encoded data in bytes which acts as code to execute
     * @param _errorMsg Error message to throw when code execution call fails
     */
    function executeCodes(bytes[] memory _codes, string memory _errorMsg) public {
        for (uint8 _j = 0; _j < uint8(_codes.length); _j++) {
            executeCode(_codes[_j], _errorMsg);
            // (address pool, bytes memory data) = abi.decode(_codes[_j], (address, bytes));
            // (success, ) = pool.call(data); //solhint-disable-line avoid-low-level-calls
            // require(success, _errMsg);
        }
    }
}
