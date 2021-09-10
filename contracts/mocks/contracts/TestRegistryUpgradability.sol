// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { ModifiersController } from "../../protocol/configuration/ModifiersController.sol";
import { RegistryProxy } from "../../protocol/configuration/RegistryProxy.sol";

contract TestRegistryUpgradability is ModifiersController {
    /**
     * @dev Set RegistryProxy to act as Registry
     * @param _registryProxy RegistryProxy Contract address to act as Registry
     */
    function become(RegistryProxy _registryProxy) external {
        require(msg.sender == _registryProxy.governance(), "!governance");
        require(_registryProxy.acceptImplementation() == 0, "!unauthorized");
    }

    function isNewContract() external view returns (bool) {
        return true;
    }

    function getTreasury() external view returns (address) {
        return treasury;
    }
}
