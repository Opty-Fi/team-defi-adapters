// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;
import { IMultiCall } from "../interfaces/opty/IMultiCall.sol";

/**
 * @title MultiCall Contract
 * @author Opty.fi
 * @dev Provides functions used commonly for decoding codes and execute
 * the code calls for Opty.fi contracts
 */
abstract contract MultiCall is IMultiCall {
    /**
     * @inheritdoc IMultiCall
     */
    function executeCode(bytes memory _code, string memory _errorMsg) public override {
        (address _contract, bytes memory _data) = abi.decode(_code, (address, bytes));
        (bool _success, ) = _contract.call(_data); //solhint-disable-line avoid-low-level-calls
        require(_success, _errorMsg);
    }

    /**
     * @inheritdoc IMultiCall
     */
    function executeCodes(bytes[] memory _codes, string memory _errorMsg) public override {
        for (uint8 _j = 0; _j < uint8(_codes.length); _j++) {
            executeCode(_codes[_j], _errorMsg);
        }
    }
}
