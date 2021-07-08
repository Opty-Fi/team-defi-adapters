// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IAdapterFull } from "../../interfaces/opty/defiAdapters/IAdapterFull.sol";
import { MultiCall } from "../../utils/MultiCall.sol";

contract TestDeFiAdapter is MultiCall {
    function depositAll(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getDepositAllCodes(payable(address(this)), _underlyingTokens, _liquidityPool),
            "depositAll"
        );
    }

    function depositSome(
        address _underlyingToken,
        uint256 _amount,
        address _liquidityPool,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        uint256[] memory _amounts = new uint256[](1);
        _underlyingTokens[0] = _underlyingToken;
        _amounts[0] = _amount;
        executeCodes(
            IAdapterFull(_adapter).getDepositSomeCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool,
                _amounts
            ),
            "depositSome"
        );
    }

    function borrowAll(
        address _liquidityPool,
        address _underlyingToken,
        address _outputToken,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getBorrowAllCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool,
                _outputToken
            ),
            "borrowAll"
        );
    }

    function stakeAll(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getStakeAllCodes(payable(address(this)), _underlyingTokens, _liquidityPool),
            "stakeAll!"
        );
    }

    function stakeSome(
        address _liquidityPool,
        uint256 _stakeAmount,
        address _adapter
    ) external {
        executeCodes(IAdapterFull(_adapter).getStakeSomeCodes(_liquidityPool, _stakeAmount), "stakeSome!");
    }

    function claimReward(address _liquidityPool, address _adapter) external {
        executeCodes(
            IAdapterFull(_adapter).getClaimRewardTokenCode(payable(address(this)), _liquidityPool),
            "claimReward"
        );
    }

    function harvestAllReward(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        executeCodes(
            IAdapterFull(_adapter).getHarvestAllCodes(payable(address(this)), _underlyingToken, _liquidityPool),
            "harvestAll"
        );
    }

    function harvestSomeReward(
        address _liquidityPool,
        address _underlyingToken,
        uint256 _rewardTokenAmount,
        address _adapter
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

    function unstakeAll(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getStakeAllCodes(payable(address(this)), _underlyingTokens, _liquidityPool),
            "unstakeAll"
        );
    }

    function unstakeSome(
        address _liquidityPool,
        uint256 _stakeAmount,
        address _adapter
    ) external {
        executeCodes(IAdapterFull(_adapter).getStakeSomeCodes(_liquidityPool, _stakeAmount), "unstakeAll");
    }

    function withdrawAll(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getWithdrawAllCodes(payable(address(this)), _underlyingTokens, _liquidityPool),
            "withdrawAll"
        );
    }

    function withdrawSome(
        address _underlyingToken,
        address _liquidityPool,
        address _adapter,
        uint256 _amount
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getWithdrawSomeCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool,
                _amount
            ),
            "withdrawSome"
        );
    }

    function repayAndWithdrawAll(
        address _liquidityPool,
        address _underlyingToken,
        address _outputToken,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getRepayAndWithdrawAllCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool,
                _outputToken
            ),
            "repayAndWithdrawAll"
        );
    }

    function unstakeAndWithdrawAll(
        address _liquidityPool,
        address _underlyingToken,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getUnstakeAndWithdrawAllCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool
            ),
            "unstakeAndWithdrawAll"
        );
    }

    function unstakeAndWithdrawSome(
        address _liquidityPool,
        address _underlyingToken,
        uint256 _redeemAmount,
        address _adapter
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        _underlyingTokens[0] = _underlyingToken;
        executeCodes(
            IAdapterFull(_adapter).getUnstakeAndWithdrawSomeCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool,
                _redeemAmount
            ),
            "unstakeAndWithdrawSome"
        );
    }
}
