// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";

//  helper contracts
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "../../configuration/Modifiers.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";
import { PriceOracle } from "../../configuration/PriceOracle.sol";

//  interfaces
import { IAdapter } from "../../../interfaces/opty/defiAdapters/IAdapter.sol";
import { IAdapterProtocolConfig } from "../../../interfaces/opty/defiAdapters/IAdapterProtocolConfig.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";
import { IAdapterStaking } from "../../../interfaces/opty/defiAdapters/IAdapterStaking.sol";
import { ICurveDeposit } from "../../../interfaces/curve/ICurveDeposit.sol";
import { ICurveSwap } from "../../../interfaces/curve/ICurveSwap.sol";
import { ICurveGauge } from "../../../interfaces/curve/ICurveGauge.sol";
import { ITokenMinter } from "../../../interfaces/curve/ITokenMinter.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Adapter for Curve Deposit pools
 * @author Opty.fi
 * @dev Abstraction layer to Curve's deposit pools
 */
contract CurvePoolAdapter is IAdapter, IAdapterProtocolConfig, IAdapterHarvestReward, IAdapterStaking, Modifiers {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /** @notice Mapping  of depositPool to the underlyingTokens */
    mapping(address => address[]) public liquidityPoolToUnderlyingTokens;

    /** @notice Mapping  of depositPool to the swapPool */
    mapping(address => address) public liquidityPoolToSwap;

    /** @notice Mapping  of depositPool to the Gauge contract address */
    mapping(address => address) public liquidityPoolToGauges;

    /** @notice Maps liquidityPool to list of absolute max deposit values in underlying */
    mapping(address => uint256[]) public maxDepositAmount;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct;

    /** @notice HBTC token contract address */
    address public constant HBTC = address(0x0316EB71485b0Ab14103307bf65a021042c6d380);

    /** @notice max deposit value datatypes */
    DataTypes.MaxExposure public maxExposureType;

    /** @notice HarvestCodeProvider contract instance */
    HarvestCodeProvider public harvestCodeProviderContract;

    /** @notice Price Oracle contract address */
    PriceOracle public oracleContract;

    /** @notice max deposit's default value in percentage */
    uint256 public maxDepositPoolPctDefault; // basis points

    /** @notice list of max deposit's default values in number */
    uint256[4] public maxDepositAmountDefault;

    /**
     * @dev map coins and tokens to curve deposit pool
     */
    constructor(
        address _registry,
        address _harvestCodeProvider,
        address _oracle
    ) public Modifiers(_registry) {
        setOracle(_oracle);
        setHarvestCodeProvider(_harvestCodeProvider);
        setMaxDepositPoolPctDefault(uint256(10000)); // 100% (basis points)
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
     * @notice Sets the absolute max deposit value in underlying for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in absolute value)
     * @param _maxDepositAmount Array of Pool's max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDepositAmount(address _liquidityPool, uint256[] memory _maxDepositAmount) external onlyGovernance {
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @notice Sets the default absolute max deposit value in underlying
     * @param _maxDepositAmountDefault array of 4 absolute max deposit values in underlying to be set as default value
     */
    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     * @dev Reverting '!empty' message as there is no related functionality for this in CurveDeposit pool
     */
    function setRewardToken(address) external override {
        revert("!empty");
    }

    /**
     * @notice Maps the liquidity pool to the list of underlyingTokens supported by the given lp
     * @param _liquidityPool liquidity pool address for which to map the underlying tokens supported
     * @param _tokens list of underlying tokens linked to the given liquidity pool
     */
    function setLiquidityPoolToUnderlyingTokens(address _liquidityPool, address[] memory _tokens) public onlyOperator {
        liquidityPoolToUnderlyingTokens[_liquidityPool] = _tokens;
    }

    /**
     * @notice Maps the liquidity pool to the curve's guage contract address
     * @param _pool Curve's liquidity pool address
     * @param _gauge Curve's gauge contract address
     */
    function setLiquiidtyPoolToGauges(address _pool, address _gauge) public onlyOperator {
        liquidityPoolToGauges[_pool] = _gauge;
    }

    /**
     * @inheritdoc IAdapterProtocolConfig
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) public override onlyOperator {
        harvestCodeProviderContract = HarvestCodeProvider(_harvestCodeProvider);
    }

    /**
     * @notice Sets the default percentage of max deposit pool value
     * @param _maxDepositPoolPctDefault Pool's max deposit percentage (in basis points, For eg: 50% means 5000)
     * to be set as default value
     */
    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    /**
     * @notice Maps the liquidity pool to the curve's swap pool address
     * @param _liquidityPool Curve's liquidity pool address
     * @param _swapPool Curve's swap pool address
     */
    function setLiquidityPoolToSwap(address _liquidityPool, address _swapPool) public onlyGovernance {
        liquidityPoolToSwap[_liquidityPool] = _swapPool;
    }

    /**
     * @notice Set the OptyFi's PriceOracle contract address
     * @param _oracle OptyFi's PriceOracle contract address to be set
     */
    function setOracle(address _oracle) public onlyOperator {
        oracleContract = PriceOracle(_oracle);
    }

    /**
     * @notice Maps the liquidity pool to the curve's guage contract address
     * @param _pool Curve's liquidity pool address
     * @param _gauge Curve's gauge contract address
     */
    function setLiquidityPoolToGauges(address _pool, address _gauge) public onlyOperator {
        liquidityPoolToGauges[_pool] = _gauge;
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
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in CurveDeposit pool
     */
    function getPoolValue(address, address) public view override returns (uint256) {
        revert("!empty");
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
        _underlyingTokens = liquidityPoolToUnderlyingTokens[_liquidityPool];
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
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                getMinter(liquidityPoolToGauges[_liquidityPool]),
                abi.encodeWithSignature("mint(address)", liquidityPoolToGauges[_liquidityPool])
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
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
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
                _codes[2] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature(
                        "remove_liquidity_one_coin(uint256,int128,uint256,bool)",
                        _amount,
                        i,
                        uint256(0),
                        true
                    )
                );
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
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
            return ITokenMinter(getMinter(liquidityPoolToGauges[_liquidityPool])).token();
        }
        return address(0);
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getUnclaimedRewardTokenAmount(
        address payable,
        address _liquidityPool,
        address
    ) public view override returns (uint256) {
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
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
            harvestCodeProviderContract.getHarvestCodes(
                _vault,
                getRewardToken(_liquidityPool),
                _underlyingToken,
                _rewardTokenAmount
            );
    }

    /* solhint-disable no-empty-blocks */

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getAddLiquidityCodes(address payable, address) public view override returns (bytes[] memory) {}

    /* solhint-enable no-empty-blocks */

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
            address _gauge = liquidityPoolToGauges[_liquidityPool];
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
            address _gauge = liquidityPoolToGauges[_liquidityPool];
            _codes = new bytes[](1);
            _codes[0] = abi.encode(_gauge, abi.encodeWithSignature("withdraw(uint256)", _unstakeAmount));
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
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _underlyingTokens.length; i++) {
            if (_underlyingTokens[i] == _underlyingToken) {
                tokenIndex = i;
            }
        }
        address _gauge = liquidityPoolToGauges[_liquidityPool];
        uint256 _liquidityPoolTokenAmount = ICurveGauge(_gauge).balanceOf(_vault);
        uint256 _b = 0;
        if (_liquidityPoolTokenAmount > 0) {
            _b = ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        _b = _b.add(
            harvestCodeProviderContract.rewardBalanceInUnderlyingTokens(
                getRewardToken(_liquidityPool),
                _underlyingToken,
                getUnclaimedRewardTokenAmount(_vault, _liquidityPool, _underlyingToken)
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
        return ICurveGauge(liquidityPoolToGauges[_liquidityPool]).balanceOf(_vault);
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

    function _getDepositAmountPct(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _poolValue,
        uint256 _amount
    ) internal view returns (uint256 _maxDepositPct) {
        if (maxDepositPoolPct[_liquidityPool] == uint256(0)) {
            _maxDepositPct = maxDepositPoolPctDefault;
        } else if (maxDepositPoolPct[_liquidityPool] == uint256(-1)) {
            return _amount;
        } else {
            _maxDepositPct = maxDepositPoolPct[_liquidityPool];
        }
        uint256 _amountInUSD = oracleContract.getUnderlyingTokenAmountInUSD(_amount, _underlyingToken);
        uint256 _maxAmountInUSD = _poolValue.mul(_maxDepositPct).div(uint256(10000));
        if (_amountInUSD > _maxAmountInUSD) {
            return oracleContract.getUSDAmountInUnderlyingToken(_maxAmountInUSD, _underlyingToken);
        } else {
            return _amount;
        }
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
        _underlyingTokens = liquidityPoolToUnderlyingTokens[_liquidityPool];
    }
}
