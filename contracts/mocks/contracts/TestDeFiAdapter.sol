// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { MultiCall } from "../../utils/MultiCall.sol";

import { IAdapter } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapter.sol";
import { IAdapterBorrow } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterBorrow.sol";
import "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterInvestLimit.sol";
import { IAdapterHarvestReward } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterHarvestReward.sol";
import { IAdapterStaking } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterStaking.sol";
import { IAdapterStakingCurve } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterStakingCurve.sol";
import { IAdapterFull } from "@optyfi/defi-legos/interfaces/defiAdapters/contracts/IAdapterFull.sol";

contract TestDeFiAdapter is MultiCall {
    function testGetDepositAllCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getDepositAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "depositAll"
        );
    }

    function testGetDepositSomeCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter,
        uint256 _amount
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getDepositSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _amount
            ),
            "depositSome"
        );
    }

    function testGetBorrowAllCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _outputToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getBorrowAllCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _outputToken
            ),
            "borrowAll"
        );
    }

    function testGetStakeAllCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getStakeAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "stakeAll!"
        );
    }

    function testGetStakeSomeCodes(
        address _liquidityPool,
        uint256 _stakeAmount,
        address _adapter
    ) external {
        executeCodes(IAdapterFull(_adapter).getStakeSomeCodes(_liquidityPool, _stakeAmount), "stakeSome!");
    }

    function testGetClaimRewardTokenCode(address _liquidityPool, address _adapter) external {
        executeCodes(
            IAdapterFull(_adapter).getClaimRewardTokenCode(payable(address(this)), _liquidityPool),
            "claimReward"
        );
    }

    function testGetHarvestAllCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getHarvestAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "harvestAll"
        );
    }

    function testGetHarvestSomeCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter,
        uint256 _rewardTokenAmount
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getHarvestSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _rewardTokenAmount
            ),
            "harvestSome"
        );
    }

    function testGetUnstakeAllCodes(address _liquidityPool, address _adapter) external {
        executeCodes(IAdapterFull(_adapter).getUnstakeAllCodes(payable(address(this)), _liquidityPool), "unstakeAll");
    }

    function testGetUnstakeSomeCodes(
        address _liquidityPool,
        uint256 _stakeAmount,
        address _adapter
    ) external {
        executeCodes(IAdapterFull(_adapter).getUnstakeSomeCodes(_liquidityPool, _stakeAmount), "unstakeAll");
    }

    function testGetWithdrawAllCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getWithdrawAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "withdrawAll"
        );
    }

    function testGetWithdrawSomeCodes(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter,
        uint256 _amount
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getWithdrawSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _amount
            ),
            "withdrawSome"
        );
    }

    function testGetRepayAndWithdrawAllCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _outputToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getRepayAndWithdrawAllCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _outputToken
            ),
            "repayAndWithdrawAll"
        );
    }

    function testGetUnstakeAndWithdrawAllCodes(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getUnstakeAndWithdrawAllCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool
            ),
            "unstakeAndWithdrawAll"
        );
    }

    function testGetUnstakeAndWithdrawSomeCodes(
        address _liquidityPool,
        address _underlyingToken,
        uint256 _redeemAmount,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getUnstakeAndWithdrawSomeCodes(
                payable(address(this)),
                _underlyingToken,
                _liquidityPool,
                _redeemAmount
            ),
            "unstakeAndWithdrawSome"
        );
    }

    function testGetAddLiquidityCodes(address _underlyingToken, address _adapter) external {
        executeCodes(
            IAdapterFull(_adapter).getAddLiquidityCodes(payable(address(this)), _underlyingToken),
            "addLiquidity"
        );
    }

    function burnBorrowTokens(address _borrowToken) external {
        ERC20(_borrowToken).transfer(
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE),
            ERC20(_borrowToken).balanceOf(address(this))
        );
    }
}
