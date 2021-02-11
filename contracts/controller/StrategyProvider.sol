// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

contract StrategyProvider {
    
    mapping(bytes32 => bytes32) public tokenToBasicStrategy;
    mapping(bytes32 => bytes32) public tokenToDefaultBasicStrategy;
    mapping(bytes32 => bytes32) public tokenToAdvanceStrategy;
    mapping(bytes32 => bytes32) public tokenToDefaultAdvanceStrategy;
    mapping(bytes32 => bytes32) public tokenToAdvancePlusStrategy;
    mapping(bytes32 => bytes32) public tokenToDefaultAdvancePlusStrategy;
    
    function setBasicStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToBasicStrategy[_tokenHash] = _strategyHash;
    }
    
    function setAdvanceStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToAdvanceStrategy[_tokenHash] = _strategyHash;
    }
    
    function setAdvancePlusStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToAdvancePlusStrategy[_tokenHash] = _strategyHash;
    }
    
    function setDefaultBasicStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToDefaultBasicStrategy[_tokenHash] = _strategyHash;
    }
    
    function setDefaultAdvanceStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToDefaultAdvancePlusStrategy[_tokenHash] = _strategyHash;
    }
    
    function setDefaultAdvancePlusStrategy(bytes32 _tokenHash, bytes32 _strategyHash) public {
        // TODO @ OP-357 : validate tokenHash, strategyHash
        tokenToDefaultAdvancePlusStrategy[_tokenHash] = _strategyHash;
    }
}