// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IAdapterFull } from "../../interfaces/defiAdapters/IAdapterFull.sol";
import { MultiCall } from "../../utils/MultiCall.sol";
import "../../1_ethereum/curve/interfaces/ICurveGaugeRead.sol";

contract TestDeFiAdapter is MultiCall {
    uint256 public allAmountInTokenStakeWrite;
    uint256 public calculateRedeemableLPTokenAmountStakeWrite;
    uint256 public unclaimedRewardTokenAmountWrite;
    bool public isRedeemableAmountSufficientStakeWrite;

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

    function testGetAllAmountInTokenStakeWrite(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        allAmountInTokenStakeWrite = IAdapterFull(_adapter).getAllAmountInTokenStakeWrite(
            payable(address(this)),
            _underlyingToken,
            _liquidityPool
        );
    }

    function testIsRedeemableAmountSufficientStakeWrite(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount,
        address _adapter
    ) external {
        isRedeemableAmountSufficientStakeWrite = IAdapterFull(_adapter).isRedeemableAmountSufficientStakeWrite(
            payable(address(this)),
            _underlyingToken,
            _liquidityPool,
            _redeemAmount
        );
    }

    function testCalculateRedeemableLPTokenAmountStakeWrite(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount,
        address _adapter
    ) external {
        calculateRedeemableLPTokenAmountStakeWrite = IAdapterFull(_adapter).calculateRedeemableLPTokenAmountStakeWrite(
            payable(address(this)),
            _underlyingToken,
            _liquidityPool,
            _redeemAmount
        );
    }

    function testGetUnclaimedRewardTokenAmountWrite(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        unclaimedRewardTokenAmountWrite = IAdapterFull(_adapter).getUnclaimedRewardTokenAmountWrite(
            payable(address(this)),
            _liquidityPool,
            _underlyingToken
        );
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
