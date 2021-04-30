// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import { RiskManager } from "./../RiskManager.sol";
import { OPTYMinter } from "./../OPTYToken/OPTYMinter.sol";

contract StakingPoolStorage {
    mapping(address => uint256) public userLastUpdate;
    uint256 public lastPoolUpdate;
    uint256 public optyRatePerBlock;
    address public token; //  store the underlying token contract address (for example DAI)
    uint256 public poolValue;
    OPTYMinter public optyMinterContract;
}
