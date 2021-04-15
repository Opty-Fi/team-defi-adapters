// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../vaults/RP1-EIP1967/RP1Vault.sol";
import "../vaults/RP2-EIP1967/RP2Vault.sol";

contract TestingEmergencyBrakeRP1 {
    ERC20 tokenAddr;
    RP1Vault vaultAddr;
    constructor(RP1Vault _vault, ERC20 _erc20) public {
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
        tokenAddr.transfer(address(vaultAddr), maxAmount);
        vaultAddr.userWithdrawRebalance(maxAmount);
        tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
    }
    function runTwoTxnWithdrawRebalanceNoDeposit(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        tokenAddr.transfer(address(vaultAddr), maxAmount);
        vaultAddr.userWithdrawRebalance(maxAmount);
        tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
    }
    function runTwoTxnRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        tokenAddr.transfer(address(vaultAddr), maxAmount);
        vaultAddr.rebalance();
       tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.rebalance();
    }
    function runTwoTxnWithdrawAndDepositRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        vaultAddr.userDepositRebalance(maxAmount);
        tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
       
    }
}

contract TestingEmergencyBrakeRP2 {
    ERC20 tokenAddr;
    RP2Vault vaultAddr;
    constructor(RP2Vault _vault, ERC20 _erc20) public {
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
        tokenAddr.transfer(address(vaultAddr), maxAmount);
        vaultAddr.userWithdrawRebalance(maxAmount);
        tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
    }
    function runTwoTxnWithdrawRebalanceNoDeposit(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        tokenAddr.transfer(address(vaultAddr), maxAmount);
        vaultAddr.userWithdrawRebalance(maxAmount);
        tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
    }
    function runTwoTxnRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        tokenAddr.transfer(address(vaultAddr), maxAmount);
        vaultAddr.rebalance();
       tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.rebalance();
    }
    function runTwoTxnWithdrawAndDepositRebalance(uint256 minAmount, uint256 maxAmount) public {
        tokenAddr.approve(address(vaultAddr), (minAmount + maxAmount));
        vaultAddr.userDepositRebalance(maxAmount);
        tokenAddr.transfer(address(vaultAddr), minAmount);
        vaultAddr.userWithdrawRebalance(minAmount);
       
    }
}