// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";

//  helper contracts
import { Modifiers } from "../../configuration/Modifiers.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// interfaces
import { IAdapter } from "../../../interfaces/opty/defiAdapters/IAdapter.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";
import { IAdapterStaking } from "../../../interfaces/opty/defiAdapters/IAdapterStaking.sol";
import { ICurveDeposit } from "../../../interfaces/curve/ICurveDeposit.sol";
import { ICurveGauge } from "../../../interfaces/curve/ICurveGauge.sol";
import { ICurveAddressProvider } from "../../../interfaces/curve/ICurveAddressProvider.sol";
import { ICurveRegistry } from "../../../interfaces/curve/ICurveRegistry.sol";
import { ICurveSwap } from "../../../interfaces/curve/ICurveSwap.sol";
import { ITokenMinter } from "../../../interfaces/curve/ITokenMinter.sol";
import { IHarvestCodeProvider } from "../../../interfaces/opty/IHarvestCodeProvider.sol";

/**
 * @title Adapter for Curve Deposit pools
 * @author Opty.fi
 * @dev Abstraction layer to Curve's deposit pools
 */
contract CurveDepositPoolAdapter is IAdapter, IAdapterHarvestReward, IAdapterStaking, Modifiers {
    using SafeMath for uint256;

    /** @notice  Curve Registry Address Provider */
    address public constant ADDRESS_PROVIDER = address(0x0000000022D53366457F9d5E68Ec105046FC4383);

    /** @notice HBTC token contract address */
    address public constant HBTC = address(0x0316EB71485b0Ab14103307bf65a021042c6d380);

    /** @notice Curve compound zap deposit contract address */
    address public constant CURVE_COMPOUND_DEPOSIT_ZAP = address(0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06);

    /** @notice Curve USDT zap deposit contract address */
    address public constant CURVE_USDT_DEPOSIT_ZAP = address(0xac795D2c97e60DF6a99ff1c814727302fD747a80);

    /** @notice Curve PAX zap deposit contract address */
    address public constant CURVE_PAX_DEPOSIT_ZAP = address(0xA50cCc70b6a011CffDdf45057E39679379187287);

    /** @notice Curve Y zap deposit contract address */
    address public constant CURVE_Y_DEPOSIT_ZAP = address(0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3);

    /** @notice Curve BUSD zap deposit contract address */
    address public constant CURVE_BUSD_DEPOSIT_ZAP = address(0xb6c057591E073249F2D9D88Ba59a46CFC9B59EdB);

    /** @notice Curve SUSD zap deposit contract address */
    address public constant CURVE_SUSD_DEPOSIT_ZAP = address(0xFCBa3E75865d2d561BE8D220616520c171F12851);

    /** @notice max deposit's default value in percentage */
    uint256 public maxDepositProtocolPct; // basis points

    /** @notice max deposit value datatypes */
    DataTypes.MaxExposure public maxExposureType;

    /** @dev deposit addresses that uses old API */
    mapping(address => bool) public isOldDepositZap;

    /** @notice Maps liquidityPool to absolute max deposit value in underlying */
    mapping(address => uint256) public maxDepositAmount;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct;

    /**
     * @dev map coins and tokens to curve deposit pool
     */
    constructor(address _registry) public Modifiers(_registry) {
        setIsOldDepositZap(CURVE_COMPOUND_DEPOSIT_ZAP, true); // curve-compound
        setIsOldDepositZap(CURVE_USDT_DEPOSIT_ZAP, true); // curve-usdt
        setIsOldDepositZap(CURVE_PAX_DEPOSIT_ZAP, true); // curve-pax
        setIsOldDepositZap(CURVE_Y_DEPOSIT_ZAP, true); // curve-y
        setIsOldDepositZap(CURVE_BUSD_DEPOSIT_ZAP, true); // curve-busd
        setIsOldDepositZap(CURVE_SUSD_DEPOSIT_ZAP, true); // curve-susd
        setMaxDepositProtocolPct(uint256(10000)); // 100% (basis points)
        setMaxDepositPoolType(DataTypes.MaxExposure.Pct);
    }

    /**
     * @notice Sets the percentage of max deposit value for the given liquidity pool
     * @param _liquidityPool liquidity pool address
     * @param _maxDepositPoolPct liquidity pool's max deposit percentage (in basis points, For eg: 50% means 5000)
     */
    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external onlyGovernance {
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
    }

    /**
     * @notice Sets the absolute max deposit value in USD/BTC based liquidity pool type (USD or BTC)
     * @param _liquidityPool liquidity pool address
     * @param _maxDepositAmount the amount is in USD for USD pools and BTC for BTC pools
     */
    function setMaxDepositAmount(address _liquidityPool, uint256 _maxDepositAmount) external onlyGovernance {
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @dev Maps true to a liquidity pool if it uses old deposit zap API
     * @param _liquidityPool liquidity pool address
     * @param _isOld set true if the liquidity pool uses old deposit zap's API
     */
    function setIsOldDepositZap(address _liquidityPool, bool _isOld) public onlyGovernance {
        isOldDepositZap[_liquidityPool] = _isOld;
    }

    /**
     * @notice Sets the default percentage of max deposit pool value
     * @param _maxDepositProtocolPct Pool's max deposit percentage (in basis points, For eg: 50% means 5000)
     * to be set as default value
     */
    function setMaxDepositProtocolPct(uint256 _maxDepositProtocolPct) public onlyGovernance {
        maxDepositProtocolPct = _maxDepositProtocolPct;
    }

    /**
     * @notice Sets the type of investment limit
     *                  1. Percentage of pool value
     *                  2. Amount in underlying token
     * @dev Types (can be number or percentage) supported for the maxDeposit value
     * @param _type Type of maxDeposit to be set (can be absolute value or percentage)
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) public onlyGovernance {
        maxExposureType = _type;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function setRewardToken(address) external override onlyOperator {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function getPoolValue(address _liquidityPool, address) public view override returns (uint256) {
        address _swapPool = _getSwapPool(_liquidityPool);
        uint256 _virtualPrice = ICurveSwap(_swapPool).get_virtual_price();
        uint256 _totalSupply = ERC20(getLiquidityPoolToken(address(0), _liquidityPool)).totalSupply();
        // the pool value will be in USD for US dollar stablecoin pools
        // the pool value will be in BTC for BTC pools
        return (_virtualPrice.mul(_totalSupply)).div(10**36);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _amount = ERC20(_underlyingTokens[0]).balanceOf(_vault);
        _codes = _getDepositCode(_underlyingTokens[0], _liquidityPool, _amount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory) {
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
        address _swapPool = _getSwapPool(_liquidityPool);
        address _curveRegistry = _getCurveRegistry();
        address[8] memory _underlyingCoins = _getUnderlyingTokens(_swapPool, _curveRegistry);
        uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
        _underlyingTokens = new address[](_nCoins);
        for (uint256 _i = 0; _i < _nCoins; _i++) {
            _underlyingTokens[_i] = _underlyingCoins[_i];
        }
    }

    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in CurveDeposit pool
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
        address _curveRegistry = _getCurveRegistry();
        address _liquidityGauge = _getLiquidityGauge(_liquidityPool, _curveRegistry);
        if (_liquidityGauge != address(0)) {
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                getMinter(_liquidityGauge),
                abi.encodeWithSignature("mint(address)", _liquidityGauge)
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
        uint256 _rewardTokenAmount = ERC20(getRewardToken(_liquidityPool)).balanceOf(_vault);
        return getHarvestSomeCodes(_vault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function canStake(address _liquidityPool) public view override returns (bool) {
        address _curveRegistry = _getCurveRegistry();
        if (_getLiquidityGauge(_liquidityPool, _curveRegistry) != address(0)) {
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
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalanceStake(_vault, _liquidityPool);
        uint256 _balanceInToken = getAllAmountInTokenStake(_vault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInToken).add(1);
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
        uint256 _balanceInToken = getAllAmountInTokenStake(_vault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
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
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        _codes = _getDepositCode(_underlyingTokens[0], _liquidityPool, _amounts[0]);
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
            address _swapPool = _getSwapPool(_liquidityPool);
            address _curveRegistry = _getCurveRegistry();
            address[8] memory _tokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
            uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
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

            if (_nCoins == 1) {
                uint256 _i;
                for (uint256 _j = 0; _j < _nCoins; _j++) {
                    if (_tokens[_j] == _underlyingTokens[0]) {
                        _i = _j;
                    }
                }
                _codes[2] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature(
                        "remove_liquidity_one_coin(uint256,int128,uint256,bool)",
                        _amount,
                        _i,
                        uint256(0),
                        true
                    )
                );
            } else {
                if (_nCoins == uint256(2)) {
                    uint256[2] memory _minAmountOut = [uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[2])", _amount, _minAmountOut)
                    );
                } else if (_nCoins == uint256(3)) {
                    uint256[3] memory _minAmountOut = [uint256(0), uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[3])", _amount, _minAmountOut)
                    );
                } else if (_nCoins == uint256(4)) {
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
     */
    function getLiquidityPoolToken(address, address _liquidityPool) public view override returns (address) {
        return ICurveDeposit(_liquidityPool).token();
    }

    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _holder,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        uint256 _liquidityPoolTokenAmount = getLiquidityPoolTokenBalance(_holder, _underlyingToken, _liquidityPool);
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
        return ERC20(getLiquidityPoolToken(_underlyingToken, _liquidityPool)).balanceOf(_vault);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) public view override returns (uint256) {
        address _curveRegistry = _getCurveRegistry();
        address _swapPool = _getSwapPool(_liquidityPool);
        uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
        address[8] memory _underlyingTokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _nCoins; i++) {
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
        address _curveRegistry = _getCurveRegistry();
        address _liquidityGauge = _getLiquidityGauge(_liquidityPool, _curveRegistry);
        if (_liquidityGauge != address(0)) {
            return ITokenMinter(getMinter(_liquidityGauge)).token();
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
        address _curveRegistry = _getCurveRegistry();
        if (_getLiquidityGauge(_liquidityPool, _curveRegistry) != address(0)) {
            // TODO : get the amount of unclaimed CRV tokens
            return uint256(1000000000000000000);
        }
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
            IHarvestCodeProvider(registryContract.getHarvestCodeProvider()).getHarvestCodes(
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
        if (_stakeAmount > 0) {
            address _curveRegistry = _getCurveRegistry();
            address _liquidityGauge = _getLiquidityGauge(_liquidityPool, _curveRegistry);
            address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);
            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _liquidityGauge, uint256(0))
            );
            _codes[1] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _liquidityGauge, _stakeAmount)
            );
            _codes[2] = abi.encode(_liquidityGauge, abi.encodeWithSignature("deposit(uint256)", _stakeAmount));
        }
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
        if (_unstakeAmount > 0) {
            address _curveRegistry = _getCurveRegistry();
            address _liquidityGauge = _getLiquidityGauge(_liquidityPool, _curveRegistry);
            _codes = new bytes[](1);
            _codes[0] = abi.encode(_liquidityGauge, abi.encodeWithSignature("withdraw(uint256)", _unstakeAmount));
        }
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getAllAmountInTokenStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        address _curveRegistry = _getCurveRegistry();
        address _swapPool = _getSwapPool(_liquidityPool);
        uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
        address[8] memory _underlyingTokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _nCoins; i++) {
            if (_underlyingTokens[i] == _underlyingToken) {
                tokenIndex = i;
            }
        }
        uint256 _liquidityPoolTokenAmount =
            ICurveGauge(_getLiquidityGauge(_liquidityPool, _curveRegistry)).balanceOf(_vault);
        uint256 _b = 0;
        if (_liquidityPoolTokenAmount > 0) {
            _b = ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        IHarvestCodeProvider _harvesCodeProviderContract =
            IHarvestCodeProvider(registryContract.getHarvestCodeProvider());
        uint256 _unclaimedRewwardTokenAmount = getUnclaimedRewardTokenAmount(_vault, _liquidityPool);
        _b = _b.add(
            _harvesCodeProviderContract.rewardBalanceInUnderlyingTokens(
                getRewardToken(_liquidityPool),
                _underlyingToken,
                _unclaimedRewwardTokenAmount
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
        address _curveRegistry = _getCurveRegistry();
        return ICurveGauge(_getLiquidityGauge(_liquidityPool, _curveRegistry)).balanceOf(_vault);
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

    /**
     * @dev This functions composes the function calls to deposit asset into deposit pool
     * @param _underlyingToken address of the underlying asset
     * @param _liquidityPool liquidity pool address
     * @param _amount the amount in underlying token
     * @return _codes bytes array of function calls to be executed from vault
     * */
    function _getDepositCode(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) internal view returns (bytes[] memory _codes) {
        (uint256 _nCoins, address[8] memory _underlyingTokens, uint256[] memory _amounts, uint256 _codeLength) =
            _getDepositCodeConfig(_underlyingToken, _liquidityPool, _amount);
        if (_codeLength > 1) {
            _codes = new bytes[](_codeLength);
            uint256 _j = 0;
            for (uint256 i = 0; i < _nCoins; i++) {
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
            if (_nCoins == uint256(2)) {
                uint256[2] memory _depositAmounts = [_amounts[0], _amounts[1]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[2],uint256)", _depositAmounts, uint256(0))
                );
            } else if (_nCoins == uint256(3)) {
                uint256[3] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[3],uint256)", _depositAmounts, uint256(0))
                );
            } else if (_nCoins == uint256(4)) {
                uint256[4] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2], _amounts[3]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[4],uint256)", _depositAmounts, uint256(0))
                );
            }
        }
    }

    /**
     * @dev This function composes the configuration required to construct fuction calls
     * @param _underlyingToken address of the underlying asset
     * @param _liquidityPool liquidity pool address
     * @param _amount amount in underlying token
     * @return _nCoins number of underlying tokens in liquidity pool
     * @return _underlyingTokens underlying tokens in a liquidity pool
     * @return _amounts value in an underlying token for each underlying token
     * @return _codeLength number of function call required for deposit
     */
    function _getDepositCodeConfig(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    )
        internal
        view
        returns (
            uint256 _nCoins,
            address[8] memory _underlyingTokens,
            uint256[] memory _amounts,
            uint256 _codeLength
        )
    {
        address _curveRegistry = _getCurveRegistry();
        address _swapPool = _getSwapPool(_liquidityPool);
        _nCoins = _getNCoins(_swapPool, _curveRegistry);
        _underlyingTokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
        _amounts = new uint256[](_nCoins);
        _codeLength = 1;
        for (uint256 _i = 0; _i < _nCoins; _i++) {
            if (_underlyingTokens[_i] == _underlyingToken) {
                _amounts[_i] = _getDepositAmount(_liquidityPool, _underlyingToken, _amount);
                if (_amounts[_i] > 0) {
                    if (_underlyingTokens[_i] == HBTC) {
                        _codeLength++;
                    } else {
                        _codeLength += 2;
                    }
                }
            }
        }
    }

    /**
     * @dev Get the underlying tokens within a liquidity pool
     * @param _swapPool the swap pool address
     * @param _curveRegistry the address of the Curve registry
     * @return list of underlying token addresses
     */
    function _getUnderlyingTokens(address _swapPool, address _curveRegistry) internal view returns (address[8] memory) {
        return ICurveRegistry(_curveRegistry).get_underlying_coins(_swapPool);
    }

    /**
     * @dev Get a liquidity gauge address associated with a liquidity pool
     * @param _liquidityPool the liquidity pool address
     * @param _curveRegistry the Curve registry's address
     * @return gauge address
     */
    function _getLiquidityGauge(address _liquidityPool, address _curveRegistry) internal view returns (address) {
        (address[10] memory _liquidityGauges, ) =
            ICurveRegistry(_curveRegistry).get_gauges(_getSwapPool(_liquidityPool));
        return _liquidityGauges[0];
    }

    /**
     * @dev Get the address of swap pool associated with the liquidity pool
     * @param _liquidityPool liquidity pool address
     * @return  Address of the swap pool
     */
    function _getSwapPool(address _liquidityPool) internal view returns (address) {
        return
            isOldDepositZap[_liquidityPool]
                ? ICurveDeposit(_liquidityPool).curve()
                : ICurveDeposit(_liquidityPool).pool();
    }

    /**
     * @dev Get the address of the main registry contract
     * @return Address of the main registry contract
     */
    function _getCurveRegistry() internal view returns (address) {
        return ICurveAddressProvider(ADDRESS_PROVIDER).get_registry();
    }

    /**
     * @dev Get number of underlying tokens in a liquidity pool
     * @param _swapPool swap pool address associated with liquidity pool
     * @param _curveRegistry address of the main registry contract
     * @return  Number of underlying tokens
     */
    function _getNCoins(address _swapPool, address _curveRegistry) internal view returns (uint256) {
        return ICurveRegistry(_curveRegistry).get_n_coins(_swapPool)[1];
    }

    /**
     * @dev Get the final value of amount in underlying token to be deposited
     * @param _liquidityPool liquidity pool address
     * @param _underlyingToken underlying token address
     * @param _amount amount in underlying token
     * @return amount in underlying token to be deposited affected by investment limitation
     */
    function _getDepositAmount(
        address _liquidityPool,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256) {
        return
            maxExposureType == DataTypes.MaxExposure.Pct
                ? _getMaxDepositAmountPct(_liquidityPool, _underlyingToken, _amount)
                : _getMaxDepositAmount(_liquidityPool, _underlyingToken, _amount);
    }

    /**
     * @dev Gets the maximum amount in underlying token limited by percentage
     * @param _liquidityPool liquidity pool address
     * @param _underlyingToken underlying token address
     * @param _amount amount in underlying token
     * @return  amount in underlying token to be deposited affected by
     *          investment limit in percentage
     */
    function _getMaxDepositAmountPct(
        address _liquidityPool,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256) {
        uint256 _poolValue = getPoolValue(_liquidityPool, _underlyingToken);
        uint256 _poolPct = maxDepositPoolPct[_liquidityPool];
        if (_poolPct == 0 && maxDepositProtocolPct == 0) {
            return 0;
        }
        uint256 _scaledLimit =
            _poolPct == 0 ? _poolValue.mul(maxDepositProtocolPct).div(10000) : _poolValue.mul(_poolPct).div(10000);
        uint256 _decimals = ERC20(_underlyingToken).decimals();
        uint256 _limit = _scaledLimit.mul(10**_decimals);
        return _amount > _limit ? _limit : _amount;
    }

    /**
     * @dev Gets the maximum amount in underlying token affected by investment
     *      limit set for liquidity pool in amount
     * @param _liquidityPool liquidity pool address
     * @param _underlyingToken underlying token address
     * @param _amount amount in underlying token
     * @return amount in underlying token to be deposited affected by
     *         investment limit set for liquidity pool in amount
     */
    function _getMaxDepositAmount(
        address _liquidityPool,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256) {
        uint256 _scaledMaxAmount = maxDepositAmount[_liquidityPool];
        if (_scaledMaxAmount == 0) {
            return 0;
        }
        uint256 _decimals = ERC20(_underlyingToken).decimals();
        uint256 _maxAmount = _scaledMaxAmount.mul(10**_decimals);
        return _amount > _maxAmount ? _maxAmount : _amount;
    }
}
