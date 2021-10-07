// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { MultiCall } from "../../utils/MultiCall.sol";
import { IStrategyManager } from "../../interfaces/opty/IStrategyManager.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";

contract TestStrategyManager is MultiCall {
    function testPoolDepositAllCode(
        address _strategyManager,
        address _underlyingToken,
        bytes32 _investStrategyhash,
        uint256 _stepIndex,
        uint256 _stepCount
    ) external {
        executeCodes(
            IStrategyManager(_strategyManager).getPoolDepositAllCodes(
                payable(address(this)),
                _underlyingToken,
                _investStrategyhash,
                _stepIndex,
                _stepCount
            ),
            "depositAll"
        );
    }

    function testPoolWithdrawAllCodes(
        address _strategyManager,
        address _underlyingToken,
        bytes32 _investStrategyhash,
        uint256 _stepIndex,
        uint256 _stepCount
    ) external {
        executeCodes(
            IStrategyManager(_strategyManager).getPoolWithdrawAllCodes(
                payable(address(this)),
                _underlyingToken,
                _investStrategyhash,
                _stepIndex,
                _stepCount
            ),
            "withdrawAll"
        );
    }

    function testPoolClaimAllRewardCodes(address _strategyManager, bytes32 _investStrategyhash) external {
        executeCodes(
            IStrategyManager(_strategyManager).getPoolClaimAllRewardCodes(payable(address(this)), _investStrategyhash),
            "claimAllReward"
        );
    }

    function testPoolHarvestAllRewardCodes(
        address _strategyManager,
        address _underlyingToken,
        bytes32 _investStrategyhash
    ) external {
        executeCodes(
            IStrategyManager(_strategyManager).getPoolHarvestAllRewardCodes(
                payable(address(this)),
                _underlyingToken,
                _investStrategyhash
            ),
            "harvestAll"
        );
    }

    function testPoolHarvestSomeRewardCodes(
        address _strategyManager,
        address _underlyingToken,
        bytes32 _investStrategyhash,
        DataTypes.VaultRewardStrategy memory _vaultRewardStrategy
    ) external {
        executeCodes(
            IStrategyManager(_strategyManager).getPoolHarvestSomeRewardCodes(
                payable(address(this)),
                _underlyingToken,
                _investStrategyhash,
                _vaultRewardStrategy
            ),
            "harvestSome"
        );
    }

    function testAddLiquidityCodes(
        address _strategyManager,
        address _underlyingToken,
        bytes32 _investStrategyhash
    ) external {
        executeCodes(
            IStrategyManager(_strategyManager).getAddLiquidityCodes(
                payable(address(this)),
                _underlyingToken,
                _investStrategyhash
            ),
            "addLiquidity"
        );
    }

    function testSplitPaymentCode(
        address _strategyManager,
        address _underlyingToken,
        uint256 _redeemAmountInToken,
        DataTypes.TreasuryShare[] memory _treasuryShares
    ) external {
        executeCodes(
            IStrategyManager(_strategyManager).getSplitPaymentCode(
                _treasuryShares,
                payable(address(this)),
                _underlyingToken,
                _redeemAmountInToken
            ),
            "splitPayment"
        );
    }
}
