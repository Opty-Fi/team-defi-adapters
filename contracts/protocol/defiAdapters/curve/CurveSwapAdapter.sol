// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

//  helper contracts
import { Modifiers } from "../../configuration/Modifiers.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";

//  interfaces
import { IAdapter } from "../../../interfaces/opty/defiAdapters/IAdapter.sol";
import { IAdapterProtocolConfig } from "../../../interfaces/opty/defiAdapters/IAdapterProtocolConfig.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";
import { IAdapterStaking } from "../../../interfaces/opty/defiAdapters/IAdapterStaking.sol";
import { IAdapterCurveInvestLimit } from "../../../interfaces/opty/defiAdapters/IAdapterCurveInvestLimit.sol";
import { ICurveDeposit } from "../../../interfaces/curve/ICurveDeposit.sol";
import { ICurveSwap } from "../../../interfaces/curve/ICurveSwap.sol";
import { ICurveGauge } from "../../../interfaces/curve/ICurveGauge.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { DataTypes } from "../../../libraries/types/DataTypes.sol";

/**
 * @title Adapter for Curve Swap pools
 * @author Opty.fi
 * @dev Abstraction layer to Curve's swap pools
 */
contract CurveSwapAdapter is
    IAdapter,
    IAdapterProtocolConfig,
    IAdapterHarvestReward,
    IAdapterStaking,
    IAdapterCurveInvestLimit,
    Modifiers
{
    using SafeMath for uint256;

    /** @notice Mapping  of swapPool to the underlyingTokens */
    mapping(address => address[]) public swapPoolToUnderlyingTokens;

    /** @notice Mapping  of swapPool to the LiquidityPoolToken */
    mapping(address => address) public swapPoolToLiquidityPoolToken;

    /** @notice Mapping  of swapPool to the Gauge contract address */
    mapping(address => address) public swapPoolToGauges;

    /** @notice Mapping  of swapPool to status of removing liquidity pool for 1 coin */
    mapping(address => bool) public noRemoveLiquidityOneCoin;

    /** @notice  Maps liquidityPool to max deposit value in absolute value */
    mapping(address => uint256[]) public maxDepositAmount;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct; // basis points

    /** @notice HBTC token contract address */
    address public constant HBTC = address(0x0316EB71485b0Ab14103307bf65a021042c6d380);

    /** @notice max deposit value datatypes */
    DataTypes.MaxExposure public maxExposureType;

    /** @notice HarvestCodeProvider contract instance */
    HarvestCodeProvider public harvestCodeProviderContract;

    /** @notice CurveSwap Pools's reward token address */
    address public rewardToken;

    /** @notice max deposit's default value in percentage */
    uint256 public maxDepositPoolPctDefault; // basis points

    /** @notice list of max deposit's default values in number */
    uint256[4] public maxDepositAmountDefault;

    /**
     * @dev mapp coins and tokens to curve deposit pool
     */
    constructor(address _registry, address _harvestCodeProvider) public Modifiers(_registry) {
        setHarvestCodeProvider(_harvestCodeProvider);
        setRewardToken(address(0xD533a949740bb3306d119CC777fa900bA034cd52));
        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
        setMaxDepositPoolType(DataTypes.MaxExposure.Pct);
    }

    /**
     * @inheritdoc IAdapter
     */
    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external override onlyGovernance {
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
    }

    /**
     * @inheritdoc IAdapterCurveInvestLimit
     */
    function setMaxDepositAmount(address _liquidityPool, uint256[] memory _maxDepositAmount)
        external
        override
        onlyGovernance
    {
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @inheritdoc IAdapterCurveInvestLimit
     */
    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external override onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    /**
     * @inheritdoc IAdapter
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) public override onlyGovernance {
        maxExposureType = _type;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function setRewardToken(address _rewardToken) public override onlyOperator {
        rewardToken = _rewardToken;
    }

    /**
     * @notice Maps the curve swap pool with the liquidity pool token
     * @param _swapPool Curve's Swap pool address
     * @param _liquidityPoolToken liquidity pool's token address
     */
    function setSwapPoolToLiquidityPoolToken(address _swapPool, address _liquidityPoolToken) public onlyOperator {
        swapPoolToLiquidityPoolToken[_swapPool] = _liquidityPoolToken;
    }

    /**
     * @notice Maps the curve liquidity pool with the list of supported underlying tokens
     * @param _swapPool Curve's liquidity pool address
     * @param _tokens liquidity pool's token address
     */
    function setSwapPoolToUnderlyingTokens(address _swapPool, address[] memory _tokens) public onlyOperator {
        swapPoolToUnderlyingTokens[_swapPool] = _tokens;
    }

    /**
     * @notice Maps the curve swap pool with its gauge contract address
     * @param _pool Curve's Swap pool address
     * @param _gauge Curve's gauge contract address corresponding to the given swap pool
     */
    function setSwapPoolToGauges(address _pool, address _gauge) public onlyOperator {
        swapPoolToGauges[_pool] = _gauge;
    }

    /**
     * @dev Store's boolean whether curve's swap pool contracts has ability to remove liquidity for a single coin or not
     * @param _pool Curve's Swap pool address
     */
    function toggleNoRemoveLiquidityOneCoin(address _pool) public onlyOperator {
        if (!noRemoveLiquidityOneCoin[_pool]) {
            noRemoveLiquidityOneCoin[_pool] = true;
        } else {
            noRemoveLiquidityOneCoin[_pool] = false;
        }
    }

    /**
     * @inheritdoc IAdapterProtocolConfig
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) public override onlyOperator {
        harvestCodeProviderContract = HarvestCodeProvider(_harvestCodeProvider);
    }

    /**
     * @inheritdoc IAdapter
     */
    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public override onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _vault,
        address[] memory,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 nCoins = _underlyingTokens.length;
        uint256[] memory _amounts = new uint256[](nCoins);
        for (uint256 i = 0; i < nCoins; i++) {
            _amounts[i] = IERC20(_underlyingTokens[i]).balanceOf(_vault);
        }
        return getDepositSomeCodes(_vault, _underlyingTokens, _liquidityPool, _amounts);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _amount = getLiquidityPoolTokenBalance(_vault, _underlyingTokens[0], _liquidityPool);
        return getWithdrawSomeCodes(_vault, _underlyingTokens, _liquidityPool, _amount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getUnderlyingTokens(address _liquidityPool, address)
        public
        view
        override
        returns (address[] memory _underlyingTokens)
    {
        _underlyingTokens = swapPoolToUnderlyingTokens[_liquidityPool];
    }

    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in CurveSwap pool
     */
    function calculateAmountInLPToken(
        address,
        address,
        uint256
    ) public view override returns (uint256) {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateRedeemableLPTokenAmount(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (uint256 _amount) {
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalance(_vault, _underlyingToken, _liquidityPool);
        uint256 _balanceInToken = getAllAmountInToken(_vault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInToken).add(1);
    }

    /**
     * @inheritdoc IAdapter
     */
    function isRedeemableAmountSufficient(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_vault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getClaimRewardTokenCode(address payable, address _liquidityPool)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                getMinter(swapPoolToGauges[_liquidityPool]),
                abi.encodeWithSignature("mint(address)", swapPoolToGauges[_liquidityPool])
            );
        }
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestAllCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(_liquidityPool)).balanceOf(_vault);
        return getHarvestSomeCodes(_vault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function canStake(address _liquidityPool) public view override returns (bool) {
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            return true;
        }
        return false;
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getStakeAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _stakeAmount = getLiquidityPoolTokenBalance(_vault, _underlyingTokens[0], _liquidityPool);
        return getStakeSomeCodes(_liquidityPool, _stakeAmount);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeAllCodes(address payable _vault, address _liquidityPool)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        uint256 _unstakeAmount = getLiquidityPoolTokenBalanceStake(_vault, _liquidityPool);
        return getUnstakeSomeCodes(_liquidityPool, _unstakeAmount);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function calculateRedeemableLPTokenAmountStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (uint256 _amount) {
        uint256 _stakedLiquidityPoolTokenBalance = getLiquidityPoolTokenBalanceStake(_vault, _liquidityPool);
        uint256 _balanceInTokenStaked = getAllAmountInTokenStake(_vault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_stakedLiquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInTokenStaked).add(1);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function isRedeemableAmountSufficientStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bool) {
        uint256 _balanceInTokenStaked = getAllAmountInTokenStake(_vault, _underlyingToken, _liquidityPool);
        return _balanceInTokenStaked >= _redeemAmount;
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeAndWithdrawAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalanceStake(_vault, _liquidityPool);
        return getUnstakeAndWithdrawSomeCodes(_vault, _underlyingTokens, _liquidityPool, _redeemAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositSomeCodes(
        address payable,
        address[] memory,
        address _liquidityPool,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 nCoins = _underlyingTokens.length;
        require(_amounts.length == nCoins, "!_amounts.length");
        uint256 _codeLength = 1;
        for (uint256 i = 0; i < nCoins; i++) {
            if (_amounts[i] > 0) {
                if (_underlyingTokens[i] == HBTC) {
                    _codeLength++;
                } else {
                    _codeLength += 2;
                }
            }
        }

        if (_codeLength > 1) {
            _amounts = _getDepositAmounts(_liquidityPool, _amounts);
            _codes = new bytes[](_codeLength);
            uint256 _j = 0;
            for (uint256 i = 0; i < nCoins; i++) {
                if (_amounts[i] > 0) {
                    if (_underlyingTokens[i] == HBTC) {
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[i],
                            abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amounts[i])
                        );
                    } else {
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[i],
                            abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
                        );
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[i],
                            abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amounts[i])
                        );
                    }
                }
            }
            if (nCoins == uint256(2)) {
                uint256[2] memory _depositAmounts = [_amounts[0], _amounts[1]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[2],uint256)", _depositAmounts, uint256(0))
                );
            } else if (nCoins == uint256(3)) {
                uint256[3] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[3],uint256)", _depositAmounts, uint256(0))
                );
            } else if (nCoins == uint256(4)) {
                uint256[4] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2], _amounts[3]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[4],uint256)", _depositAmounts, uint256(0))
                );
            }
        }
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _amount
    ) public view override returns (bytes[] memory _codes) {
        if (_amount > 0) {
            address[] memory tokens = _getUnderlyingTokens(_liquidityPool);
            uint256 nCoins = tokens.length;
            address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);

            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
            );
            _codes[1] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amount)
            );

            if (_underlyingTokens.length == 1) {
                uint256 i = 0;
                for (uint256 j = 0; j < nCoins; j++) {
                    if (tokens[j] == _underlyingTokens[0]) {
                        i = j;
                    }
                }
                if (!noRemoveLiquidityOneCoin[_liquidityPool]) {
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        // solhint-disable-next-line max-line-length
                        abi.encodeWithSignature(
                            "remove_liquidity_one_coin(uint256,int128,uint256)",
                            _amount,
                            i,
                            uint256(0)
                        )
                    );
                } else {
                    // Note : swap pools of compound,usdt,pax,y,susd and busd
                    //        does not have remove_liquidity_one_coin function
                    revert("!remove_one_coin");
                }
            } else {
                if (nCoins == uint256(2)) {
                    uint256[2] memory _minAmountOut = [uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[2])", _amount, _minAmountOut)
                    );
                } else if (nCoins == uint256(3)) {
                    uint256[3] memory _minAmountOut = [uint256(0), uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[3])", _amount, _minAmountOut)
                    );
                } else if (nCoins == uint256(4)) {
                    uint256[4] memory _minAmountOut = [uint256(0), uint256(0), uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[4])", _amount, _minAmountOut)
                    );
                }
            }
        }
    }

    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in CurveSwap pool
     */
    function getPoolValue(address, address) public view override returns (uint256) {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolToken(address, address _liquidityPool) public view override returns (address) {
        return swapPoolToLiquidityPoolToken[_liquidityPool];
    }

    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        uint256 _liquidityPoolTokenAmount = getLiquidityPoolTokenBalance(_vault, _underlyingToken, _liquidityPool);
        return getSomeAmountInToken(_underlyingToken, _liquidityPool, _liquidityPoolTokenAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolTokenBalance(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        return IERC20(getLiquidityPoolToken(_underlyingToken, _liquidityPool)).balanceOf(_vault);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) public view override returns (uint256) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _underlyingTokens.length; i++) {
            if (_underlyingTokens[i] == _underlyingToken) {
                tokenIndex = i;
            }
        }
        if (_liquidityPoolTokenAmount > 0) {
            return ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        return 0;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getRewardToken(address _liquidityPool) public view override returns (address) {
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            return rewardToken;
        }
        return address(0);
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getUnclaimedRewardTokenAmount(address payable, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        /* solhint-disable no-empty-blocks */
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            // TODO : get the amount of unclaimed CRV tokens
        }
        /* solhint-disable no-empty-blocks */
        return uint256(0);
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        return
            harvestCodeProviderContract.getHarvestCodes(
                _vault,
                getRewardToken(_liquidityPool),
                _underlyingToken,
                _rewardTokenAmount
            );
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getStakeSomeCodes(address _liquidityPool, uint256 _stakeAmount)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        address _gauge = swapPoolToGauges[_liquidityPool];
        address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);
        _codes = new bytes[](3);
        _codes[0] = abi.encode(
            _liquidityPoolToken,
            abi.encodeWithSignature("approve(address,uint256)", _gauge, uint256(0))
        );
        _codes[1] = abi.encode(
            _liquidityPoolToken,
            abi.encodeWithSignature("approve(address,uint256)", _gauge, _stakeAmount)
        );
        _codes[2] = abi.encode(_gauge, abi.encodeWithSignature("deposit(uint256)", _stakeAmount));
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeSomeCodes(address _liquidityPool, uint256 _unstakeAmount)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        address _gauge = swapPoolToGauges[_liquidityPool];
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_gauge, abi.encodeWithSignature("withdraw(uint256)", _unstakeAmount));
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getAllAmountInTokenStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _underlyingTokens.length; i++) {
            if (_underlyingTokens[i] == _underlyingToken) {
                tokenIndex = i;
            }
        }
        uint256 _liquidityPoolTokenAmount = getLiquidityPoolTokenBalanceStake(_vault, _liquidityPool);
        uint256 _b = 0;
        if (_liquidityPoolTokenAmount > 0) {
            _b = ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        _b = _b.add(
            harvestCodeProviderContract.rewardBalanceInUnderlyingTokens(
                getRewardToken(_liquidityPool),
                _underlyingToken,
                getUnclaimedRewardTokenAmount(_vault, _liquidityPool)
            )
        );
        return _b;
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getLiquidityPoolTokenBalanceStake(address payable _vault, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        return ICurveGauge(swapPoolToGauges[_liquidityPool]).balanceOf(_vault);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeAndWithdrawSomeCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            _codes = new bytes[](4);
            _codes[0] = getUnstakeSomeCodes(_liquidityPool, _redeemAmount)[0];
            bytes[] memory _withdrawCodes =
                getWithdrawSomeCodes(_vault, _underlyingTokens, _liquidityPool, _redeemAmount);
            _codes[1] = _withdrawCodes[0];
            _codes[2] = _withdrawCodes[1];
            _codes[3] = _withdrawCodes[2];
        }
    }

    /**
     * @notice Get the Curve Minter's address
     */
    function getMinter(address _gauge) public view returns (address) {
        return ICurveGauge(_gauge).minter();
    }

    function _getDepositAmounts(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory _depositAmounts)
    {
        _depositAmounts = maxExposureType == DataTypes.MaxExposure.Pct
            ? _amounts
            : _getMaxDepositAmounts(_liquidityPool, _amounts);
    }

    function _getMaxDepositAmounts(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory _depositAmounts)
    {
        _depositAmounts = new uint256[](_amounts.length);
        for (uint256 i = 0; i < _amounts.length; i++) {
            if ((maxDepositAmount[_liquidityPool].length > 0) && _amounts[i] > (maxDepositAmount[_liquidityPool])[i]) {
                _depositAmounts[i] = maxDepositAmount[_liquidityPool][i];
            } else {
                if (maxDepositAmountDefault.length > 0 && _amounts[i] > maxDepositAmountDefault[i]) {
                    _depositAmounts[i] = maxDepositAmountDefault[i];
                } else {
                    _depositAmounts[i] = _amounts[i];
                }
            }
        }
    }

    function _getUnderlyingTokens(address _liquidityPool) internal view returns (address[] memory _underlyingTokens) {
        _underlyingTokens = swapPoolToUnderlyingTokens[_liquidityPool];
    }
}
