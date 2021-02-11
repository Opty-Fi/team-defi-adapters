// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

contract StrategyProvider {
    mapping(bytes32 => bytes32) public tokenToBestBasicStrategies;
    mapping(bytes32 => bytes32) public tokenToDefaultBasicStrategies;
    mapping(bytes32 => bytes32) public tokenToBestAdvanceStrategies;
    mapping(bytes32 => bytes32) public tokenToDefaultAdvanceStrategies;
    mapping(bytes32 => bytes32) public tokenToBestAdvancePlusStrategies;
    mapping(bytes32 => bytes32) public tokenToDefaultAdvancePlusStrategies;

    function setBestBasicStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToBestBasicStrategies[_tokenHash] = _strategyHash;
    }

    function setBestAdvanceStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToBestAdvanceStrategies[_tokenHash] = _strategyHash;
    }

    function setBestAdvancePlusStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToBestAdvancePlusStrategies[_tokenHash] = _strategyHash;
    }

    function setDefaultBasicStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToDefaultBasicStrategies[_tokenHash] = _strategyHash;
    }

    function setDefaultAdvanceStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToDefaultAdvancePlusStrategies[_tokenHash] = _strategyHash;
    }

    function setDefaultAdvancePlusStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToDefaultAdvancePlusStrategies[_tokenHash] = _strategyHash;
    }
}
