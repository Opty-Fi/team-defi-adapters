// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "./../libraries/Addresses.sol";
import "./ModifiersController.sol";

/**
 * @dev Contract used to keep all the modifiers at one place
 */
contract Modifiers {
    
    ModifiersController public modifiersControllerContract;
    
    using Address for address;
    
    /**
     * @dev Sets the owner, governance and strategist while deploying the contract
     */
    constructor (address _registry) internal {
        modifiersControllerContract = ModifiersController(_registry);
    }
    
    /**
     * @dev Function to check if the address is zero address or not
     */
    function isZeroAddress(address _address) internal pure returns(bool) {
        require(_address != address(0), "Modifiers: caller is zero address");
        return true;
    }

    /**
     * @dev Modifier to check if the address is zero address or not
     */
    modifier onlyValidAddress() {
        require(msg.sender != address(0), "caller is zero address");
        _;
    }

    /**
     * @dev Modifier to check caller is governance or not
     */
    modifier onlyGovernance() {
        require(msg.sender == modifiersControllerContract.governance(), "caller is not having governance");
        _;
    }
    
    /**
     * @dev Modifier to check caller is operator or not
     */
    modifier onlyOperator() {
        require(msg.sender == modifiersControllerContract.operator(), "caller is not the operator");
        _;
    }
    
    /**
     * @dev Modifier to check caller is operator or not
     */
    modifier onlyStrategist() {
        require(msg.sender == modifiersControllerContract.strategist(), "caller is not the strategist");
        _;
    }
}