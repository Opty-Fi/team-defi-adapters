// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

interface IDForceStake {
    function stake(uint _value) external;
    function exit() external;
    function balanceOf(address _account) external view returns(uint);
    function earned(address _account) external view returns(uint);
    function getReward() external;
}