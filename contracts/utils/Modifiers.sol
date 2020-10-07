// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

/**
 * @dev Contract used to keep all the modifiers at one place
 */
contract Modifiers {
    
    address public owner;
    address public governance;
    address public strategist;
    uint256 private _guardCounter;
    
    /**
     * @dev Sets the owner, governance and strategist while deploying the contract
     */
    constructor () internal {
        owner = msg.sender;
        governance = msg.sender;
        strategist = msg.sender;
        _guardCounter = 1;
    }
    
    /**
     * @dev Function to check if the address is zero address or not
     */
    function isZeroAddress(address _address) internal pure returns(bool) {
        require(_address != address(0), "Modifiers: caller is zero address");
        return true;
    }
    
    /**
     * @dev Function to check caller is either of owner or governance or strategist
     */
    function eitherOwnerGovernanceStrategist() internal view returns(bool) {
        if (msg.sender == owner || msg.sender == governance || msg.sender == strategist) {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * @dev Modifier to check if the address is zero address or not
     */
    modifier onlyValidAddress() {
        require(msg.sender != address(0), "caller is zero address");
        _;
    }
    
    /**
     * @dev Modifier to check caller is owner or not
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "caller is not owner");
        _;
    }
    
    /**
     * @dev Modifier to check caller is governance or not
     */
    modifier onlyGovernance() {
        require(msg.sender == governance, "caller is not having governance");
        _;
    }
    
    /**
     * @dev Modifier to check caller is strategist or not
     */
    modifier onlyStrategist() {
        require(msg.sender == strategist, "Caller is not strategist");
        _;
    }

    /**
     * @dev Modifier to check re-entrancy issue
     */
    modifier nonReentrant() {
        _guardCounter += 1;
        uint256 localCounter = _guardCounter;
        _;
        require(localCounter == _guardCounter, "ReentrancyGuard: reentrant call");
    }
}