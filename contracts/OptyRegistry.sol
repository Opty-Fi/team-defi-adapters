// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.11;

contract Modifiers {
    
    address public owner;
    address public governance;
    address public strategist;
    
    constructor () internal {
        owner = msg.sender;
        governance = msg.sender;
        strategist = msg.sender;
    }
    
    modifier onlyValidAddress(){
        require(msg.sender != address(0), "caller is zero address");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "caller is not owner");
        _;
    }
    
    modifier onlyGovernance() {
        require(msg.sender == governance, "caller is not having governance");
        _;
    }
    
    modifier onlyStrategist() {
        require(msg.sender == strategist, "Caller is not strategist");
        _;
    }
}

contract OptyRegistry is Modifiers {
    
    mapping(address => bool) public tokens;
    
    constructor () public Modifiers() {
        
    }
    
    function enableTokens(address _token) external onlyValidAddress onlyOwner onlyGovernance onlyStrategist returns(bool){
        tokens[_token] = true;
        return tokens[_token];
    }
}