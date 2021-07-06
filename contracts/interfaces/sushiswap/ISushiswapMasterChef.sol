// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

interface ISushiswapMasterChef {
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    function userInfo(uint256 _pid, address _user) external view returns (UserInfo memory);

    function pendingSushi(uint256 _pid, address _user) external view returns (uint256);
}
