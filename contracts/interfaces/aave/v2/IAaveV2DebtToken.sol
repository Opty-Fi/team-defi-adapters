// SPDX-License-Identifier:MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../../ERC20/IERC20.sol";

struct SupplyData {
    uint256 principalSupply;
    uint256 totalSupply;
    uint256 averageBorrowRate;
    uint40 lastSupplyUpdateTimestamp;
}

interface IAaveV2DebtToken {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);

    function POOL() external view returns (address);

    function approveDelegation(address _delegatee, uint256 _amount) external;

    function borrowAllowance(address _fromUser, address _toUser) external view returns (uint256);

    // stable debt tokens
    function getSupplyData() external view returns (SupplyData memory);

    function getTotalSupplyAndAvgRate() external view returns (uint256 _totalSupply, uint256 _averageStableRate);

    function principalBalanceOf(address _user) external view returns (uint256);

    function getUserLastUpdated() external view returns (uint40);

    function getAverageStableRate() external view returns (uint256);

    function getUserStableRate(address _user) external view returns (uint256);

    // variable debt methods
    function scaledBalanceOf(address user) external view returns (uint256);

    function scaledTotalSupply() external view returns (uint256);

    function getScaledUserBalanceAndSupply(address user) external view returns (uint256 _pricipalBalance, uint256 _totalSupply);
}
