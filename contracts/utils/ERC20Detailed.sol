// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

contract ERC20Detailed {
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    constructor (address _underlyingToken, string memory _profile) internal {
        if (_underlyingToken == address(0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2)) {
            _name = string(abi.encodePacked("opty ","Maker"," ",_profile));
            _symbol = string(abi.encodePacked("op", "MKR",_profile));
            _decimals = ERC20Detailed(_underlyingToken).decimals();
        } else {
            _name = string(abi.encodePacked("opty ",ERC20Detailed(_underlyingToken).name()," ",_profile));
            _symbol = string(abi.encodePacked("op", ERC20Detailed(_underlyingToken).symbol(),_profile));
            _decimals = ERC20Detailed(_underlyingToken).decimals();
        }
    }
    function name() public view returns (string memory) {
        return _name;
    }
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    function decimals() public view returns (uint8) {
        return _decimals;
    }
}