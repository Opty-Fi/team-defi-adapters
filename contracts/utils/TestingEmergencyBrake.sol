// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../../pools/basic-EIP1967/Vault.sol";

contract TestingEmergencyBrake {
    ERC20 tokenAddr;
    Vault vaultAddr;
    constructor(Vault _vault, ERC20 _erc20) public {
        vaultAddr = _vault;
        tokenAddr = _erc20;
    }
    function getBalance() public returns (uint256){
        uint256 balance = vaultAddr.balance();
        return balance;
    }
    function runDepositRebalance(uint256 amount) public {
        tokenAddr.approve(address(vaultAddr), amount);
        vaultAddr.userDepositRebalance(amount);
    }
    function runTwoTxnDepositRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        vaultAddr.userDepositRebalance(maxAmount);
        vaultAddr.userDepositRebalance(minAmount);
    }
    function runTwoTxnWithdrawRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        vaultAddr.userDeposit(maxAmount);
        vaultAddr.userWithdrawRebalance(maxAmount);
        vaultAddr.userDeposit(minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
    }
    function runTwoTxnRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        vaultAddr.userDeposit(maxAmount);
        vaultAddr.rebalance();
        vaultAddr.userDeposit(minAmount);
        vaultAddr.rebalance();
    }
    function runTwoTxnWithdrawAndDepositRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        vaultAddr.userDepositRebalance(maxAmount);
        vaultAddr.userDeposit(minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
       
    }
}