// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { RegistryStorage } from "./RegistryStorage.sol";
import { IModifiersController } from "../../interfaces/opty/IModifiersController.sol";

/**
 * @title ModifiersController
 *
 * @author Opty.fi
 *
 * @dev Contract used to authorize and keep all the modifiers at one place
 */
abstract contract ModifiersController is IModifiersController, RegistryStorage {
    using Address for address;

    /**
     * @inheritdoc IModifiersController
     */
    function setOperator(address _operator) public override onlyGovernance {
        require(_operator != address(0), "!address(0)");
        operator = _operator;
        emit TransferOperator(operator, msg.sender);
    }

    /**
     * @inheritdoc IModifiersController
     */
    function setOPTYMinter(address _minter) public override onlyGovernance {
        require(_minter != address(0), "!address(0)");
        minter = _minter;
        emit TransferOPTYMinter(minter, msg.sender);
    }

    /**
     * @dev Modifier to check caller is governance or not
     */
    modifier onlyGovernance() {
        require(msg.sender == governance, "caller is not having governance");
        _;
    }

    /**
     * @dev Modifier to check caller is operator or not
     */
    modifier onlyOperator() {
        require(msg.sender == operator, "caller is not the operator");
        _;
    }

    /**
     * @dev Modifier to check caller is minter or not
     */
    modifier onlyMinter() {
        require(msg.sender == minter, "caller is not the minter");
        _;
    }
}
