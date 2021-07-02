// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for ModifiersController Contract
 * @author Opty.fi
 * @notice Interface used to authorize operator and minter accounts
 */
interface IModifiersController {
    /**
     * @notice Transfers operator to a new account (`_operator`)
     * @param _operator address of Operator's account
     */
    function setOperator(address _operator) external;

    /**
     * @notice Transfers minter to a new account (`_minter`)
     * @param _minter address of minter's account
     */
    function setOPTYDistributor(address _minter) external;
}
