// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

interface StrategyManager {

    function getWithdrawAllStepsCount(bytes32 _hash) external view returns (uint8); 

    function getDepositAllStepCount(bytes32 _hash) external view returns (uint8);

    function getClaimRewardStepsCount(bytes32 _hash) external view returns (uint8);

    function getHarvestRewardStepsCount(bytes32 _hash) external view returns (uint8);

    function getBalanceInUnderlyingToken(
        address payable _optyPool,
        address _underlyingToken,
        bytes32 _hash
    ) external view returns (uint256 _balance);

    function getPoolDepositAllCodes(
        address payable _optyPool,
        address _underlyingToken,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    function getPoolWithdrawAllCodes(
        address payable _optyPool,
        address _underlyingToken,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    function getPoolClaimAllRewardCodes(
        address payable _optyPool,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);

    function getPoolHarvestAllRewardCodes(
        address payable _optyPool,
        address _underlyingToken,
        bytes32 _hash,
        uint8 _stepIndex,
        uint8 _stepCount
    ) external view returns (bytes[] memory _codes);
}