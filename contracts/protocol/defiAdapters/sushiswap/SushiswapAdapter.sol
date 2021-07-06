// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { ISushiswapMasterChef } from "../../../interfaces/sushiswap/ISushiswapMasterChef.sol";
import { IERC20, SafeMath } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IAdapter } from "../../../interfaces/opty/defiAdapters/IAdapter.sol";
import { IAdapterInvestLimit } from "../../../interfaces/opty/defiAdapters/IAdapterInvestLimit.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";
import { Modifiers } from "../../configuration/Modifiers.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";

/**
 * @dev Abstraction layer to DForce's pools
 */

contract SushiswapAdapter is IAdapter, IAdapterInvestLimit, IAdapterHarvestReward, Modifiers {
    using SafeMath for uint256;

    mapping(address => uint256) public maxDepositPoolPct; // basis points
    mapping(address => mapping(address => uint256)) public maxDepositAmount;
    mapping(address => uint256) public maxDepositAmountDefault;
    mapping(address => uint256) public underlyingTokenToPid;

    HarvestCodeProvider public harvestCodeProviderContract;
    DataTypes.MaxExposure public maxExposureType;
    address public rewardToken;
    ISushiswapMasterChef public masterChef;
    uint256 public maxDepositPoolPctDefault; // basis points

    constructor(address _registry, address _harvestCodeProvider) public Modifiers(_registry) {
        setHarvestCodeProvider(_harvestCodeProvider);
        setMasterChef(address(0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd));
        setRewardToken(address(0x6B3595068778DD592e39A122f4f5a5cF09C90fE2));
        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
        setMaxDepositPoolType(DataTypes.MaxExposure.Pct);
    }

    function setUnderlyingTokenToPid(address _underlyingToken, uint256 _pid) external onlyOperator {
        require(_underlyingToken != address(0), "Invalid address");
        require(underlyingTokenToPid[_underlyingToken] == uint256(0), "_underlyingTokenToPid already set");
        underlyingTokenToPid[_underlyingToken] = _pid;
    }

    function setMaxDepositPoolPct(address _underlyingToken, uint256 _maxDepositPoolPct)
        external
        override
        onlyGovernance
    {
        maxDepositPoolPct[_underlyingToken] = _maxDepositPoolPct;
    }

    function setMaxDepositAmountDefault(address _underlyingToken, uint256 _maxDepositAmountDefault)
        external
        override
        onlyGovernance
    {
        maxDepositAmountDefault[_underlyingToken] = _maxDepositAmountDefault;
    }

    function setMaxDepositAmount(
        address,
        address _underlyingToken,
        uint256 _maxDepositAmount
    ) external override onlyGovernance {
        maxDepositAmount[address(masterChef)][_underlyingToken] = _maxDepositAmount;
    }

    function getDepositAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address
    ) external view override returns (bytes[] memory _codes) {
        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = IERC20(_underlyingTokens[0]).balanceOf(_vault);
        return getDepositSomeCodes(_vault, _underlyingTokens, address(masterChef), _amounts);
    }

    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address
    ) external view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], address(masterChef));
        return getWithdrawSomeCodes(_optyVault, _underlyingTokens, address(masterChef), _redeemAmount);
    }

    function getUnderlyingTokens(address, address) external view override returns (address[] memory) {
        revert("!empty");
    }

    function getSomeAmountInToken(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    function calculateAmountInLPToken(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    function calculateRedeemableLPTokenAmount(
        address payable _optyVault,
        address,
        address _liquidityPool,
        uint256
    ) external view override returns (uint256 _amount) {
        uint256 _pid = underlyingTokenToPid[_liquidityPool];
        _amount = masterChef.userInfo(_pid, _optyVault).amount;
    }

    function isRedeemableAmountSufficient(
        address payable _optyVault,
        address _underlyingToken,
        address,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, address(masterChef));
        return _balanceInToken >= _redeemAmount;
    }

    /* solhint-disable no-empty-blocks */
    function getClaimRewardTokenCode(address payable, address) external view override returns (bytes[] memory) {}

    /* solhint-disable no-empty-blocks */

    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address
    ) external view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(address(masterChef))).balanceOf(_optyVault);
        return getHarvestSomeCodes(_optyVault, _underlyingToken, address(masterChef), _rewardTokenAmount);
    }

    function canStake(address) external view override returns (bool) {
        return false;
    }

    function setMasterChef(address _masterChef) public onlyOperator {
        require(_masterChef != address(0), "Invalid address");
        masterChef = ISushiswapMasterChef(_masterChef);
    }

    function setHarvestCodeProvider(address _harvestCodeProvider) public onlyOperator {
        harvestCodeProviderContract = HarvestCodeProvider(_harvestCodeProvider);
    }

    function setRewardToken(address _rewardToken) public override onlyOperator {
        rewardToken = _rewardToken;
    }

    function setMaxDepositPoolType(DataTypes.MaxExposure _type) public override onlyGovernance {
        maxExposureType = _type;
    }

    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public override onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    function getDepositSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        if (_amounts[0] > 0) {
            uint256 _pid = underlyingTokenToPid[_underlyingTokens[0]];
            uint256 _depositAmount = _getDepositAmount(address(masterChef), _underlyingTokens[0], _amounts[0]);
            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _underlyingTokens[0],
                abi.encodeWithSignature("approve(address,uint256)", address(masterChef), uint256(0))
            );
            _codes[1] = abi.encode(
                _underlyingTokens[0],
                abi.encodeWithSignature("approve(address,uint256)", address(masterChef), _depositAmount)
            );
            _codes[2] = abi.encode(
                address(masterChef),
                abi.encodeWithSignature("deposit(uint256,uint256)", _pid, _depositAmount)
            );
        }
    }

    function getWithdrawSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            uint256 _pid = underlyingTokenToPid[_underlyingTokens[0]];
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                address(masterChef),
                abi.encodeWithSignature("withdraw(uint256,uint256)", _pid, _redeemAmount)
            );
        }
    }

    function getPoolValue(address, address _underlyingToken) public view override returns (uint256) {
        return IERC20(_underlyingToken).balanceOf(address(masterChef));
    }

    function getLiquidityPoolToken(address _underlyingToken, address) public view override returns (address) {
        return _underlyingToken;
    }

    function getAllAmountInToken(
        address payable _vault,
        address _underlyingToken,
        address
    ) public view override returns (uint256) {
        uint256 _pid = underlyingTokenToPid[_underlyingToken];
        uint256 _balance = masterChef.userInfo(_pid, _vault).amount;
        uint256 _unclaimedReward = getUnclaimedRewardTokenAmount(_vault, _underlyingToken);
        if (_unclaimedReward > 0) {
            _balance = _balance.add(
                harvestCodeProviderContract.rewardBalanceInLPTokensSushi(
                    rewardToken,
                    _underlyingToken,
                    _unclaimedReward
                )
            );
        }
        return _balance;
    }

    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address _underlyingToken,
        address
    ) public view override returns (uint256) {
        uint256 _pid = underlyingTokenToPid[_underlyingToken];
        uint256 _lpTokenBalance = masterChef.userInfo(_pid, _optyVault).amount;
        return _lpTokenBalance;
    }

    function getRewardToken(address) public view override returns (address) {
        return rewardToken;
    }

    function getUnclaimedRewardTokenAmount(address payable _vault, address _underlyingToken)
        public
        view
        override
        returns (uint256)
    {
        uint256 _pid = underlyingTokenToPid[_underlyingToken];
        return ISushiswapMasterChef(_underlyingToken).pendingSushi(_pid, _vault);
    }

    function getHarvestSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        return
            harvestCodeProviderContract.getHarvestLPTokenSushiCodes(
                _vault,
                getRewardToken(address(masterChef)),
                _underlyingToken,
                _rewardTokenAmount
            );
    }

    function _getDepositAmount(
        address,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256 _depositAmount) {
        _depositAmount = _amount;
        uint256 _limit =
            maxExposureType == DataTypes.MaxExposure.Pct
                ? _getMaxDepositAmountByPct(_underlyingToken, _amount)
                : _getMaxDepositAmount(address(masterChef), _underlyingToken, _amount);
        if (_depositAmount > _limit) {
            _depositAmount = _limit;
        }
    }

    function _getMaxDepositAmountByPct(address _underlyingToken, uint256 _amount)
        internal
        view
        returns (uint256 _depositAmount)
    {
        _depositAmount = _amount;
        uint256 _poolValue = getPoolValue(address(0), _underlyingToken);
        uint256 maxPct = maxDepositPoolPct[_underlyingToken];
        if (maxPct == 0) {
            maxPct = maxDepositPoolPctDefault;
        }
        uint256 _limit = (_poolValue.mul(maxPct)).div(uint256(10000));
        if (_depositAmount > _limit) {
            _depositAmount = _limit;
        }
    }

    function _getMaxDepositAmount(
        address,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256 _depositAmount) {
        _depositAmount = _amount;
        uint256 maxDeposit = maxDepositAmount[address(masterChef)][_underlyingToken];
        if (maxDeposit == 0) {
            maxDeposit = maxDepositAmountDefault[_underlyingToken];
        }
        if (_depositAmount > maxDeposit) {
            _depositAmount = maxDeposit;
        }
    }
}
