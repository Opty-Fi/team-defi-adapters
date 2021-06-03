// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @dev Interface used to authorize and keep all the modifiers at one place
 */
interface IModifiersController {
    /**
     * @dev Transfers operator to a new account (`_operator`).
     *
     * @param _operator address of Operator's account
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     */
    function setOperator(address _operator) external;

    /**
     * @dev Transfers minter to a new account (`_minter`).
     *
     * @param _minter address of minter's account
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     */
    function setOPTYMinter(address _minter) external;
}
