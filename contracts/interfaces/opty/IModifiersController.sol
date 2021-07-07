// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

/**
 * @title Interface for ModifiersController Contract
 * @author Opty.fi
 * @notice Interface used to authorize operator and minter accounts
 */
interface IModifiersController {
    /**
     * @notice Transfers financeOperator to a new account (`_financeOperator`)
     * @param _financeOperator address of financeOperator's account
     */
    function setFinanceOperator(address _financeOperator) external;

    /**
     * @notice Transfers riskOperator to a new account (`_riskOperator`)
     * @param _riskOperator address of riskOperator's account
     */
    function setRiskOperator(address _riskOperator) external;

    /**
     * @notice Transfers strategyOperator to a new account (`_strategyOperator`)
     * @param _strategyOperator address of strategyOperator's account
     */
    function setStrategyOperator(address _strategyOperator) external;

    /**
     * @notice Transfers operator to a new account (`_operator`)
     * @param _operator address of Operator's account
     */
    function setOperator(address _operator) external;

    /**
     * @notice Transfers minter to a new account (`_minter`)
     * @param _minter address of minter's account
     */
    function setOPTYMinter(address _minter) external;
}
