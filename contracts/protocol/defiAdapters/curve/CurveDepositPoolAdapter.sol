// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { PlainTokens } from "./PlainTokens.sol";
import { CurveDepositPool } from "./CurveDepositPool.sol";
import { CurveSwapPool } from "./CurveSwapPool.sol";
import { CurveGaugePool } from "./CurveGaugePool.sol";

//  helper contracts
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "../../configuration/Modifiers.sol";
import { IAdapter } from "../../../interfaces/opty/defiAdapters/IAdapter.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";
import { IAdapterStaking } from "../../../interfaces/opty/defiAdapters/IAdapterStaking.sol";
import { ICurveDeposit } from "../../../interfaces/curve/ICurveDeposit.sol";
import { ICurveGauge } from "../../../interfaces/curve/ICurveGauge.sol";
import { ICurveAddressProvider } from "../../../interfaces/curve/ICurveAddressProvider.sol";
import { ICurveRegistry } from "../../../interfaces/curve/ICurveRegistry.sol";
import { ITokenMinter } from "../../../interfaces/curve/ITokenMinter.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IHarvestCodeProvider } from "../../../interfaces/opty/IHarvestCodeProvider.sol";
import { IPriceOracle } from "../../../interfaces/opty/IPriceOracle.sol";

/**
 * @title Adapter for Curve Deposit pools
 * @author Opty.fi
 * @dev Abstraction layer to Curve's deposit pools
 */
contract CurvePoolAdapter is IAdapter, IAdapterHarvestReward, IAdapterStaking, Modifiers {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public constant ADDRESS_PROVIDER = address(0x0000000022D53366457F9d5E68Ec105046FC4383);

    /** @dev deposit addresses that uses old API */
    mapping(address => bool) public isOldDepositZap;

    /** @notice Mapping  of depositPool to the underlyingTokens */
    // mapping(address => address[]) public liquidityPoolToUnderlyingTokens;

    /** @notice Mapping  of depositPool to the swapPool */
    // mapping(address => address) public liquidityPoolToSwap;

    /** @notice Mapping  of depositPool to the Gauge contract address */
    // mapping(address => address) public liquidityPoolToGauges;

    /** @notice  Maps liquidityPool to list of 2 max deposit values in number */
    mapping(address => uint256[2]) public maxDeposit2Amount;

    /** @notice  Maps liquidityPool to list of 3 max deposit values in number */
    mapping(address => uint256[3]) public maxDeposit3Amount;

    /** @notice  Maps liquidityPool to list of 4 max deposit values in number */
    mapping(address => uint256[4]) public maxDeposit4Amount;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct; // basis points

    /** @notice max deposit's default value in percentage */
    uint256 public maxDepositPoolPctDefault; // basis points

    /** @notice list of max deposit's default values in number */
    uint256[4] public maxDepositAmountDefault;

    /**
     * @dev map coins and tokens to curve deposit pool
     */
    constructor(address _registry) public Modifiers(_registry) {
        isOldDepositZap[0xeB21209ae4C2c9FF2a86ACA31E123764A3B6Bc06] = true; // curve-compound
        isOldDepositZap[0xac795D2c97e60DF6a99ff1c814727302fD747a80] = true; // curve-usdt
        isOldDepositZap[0xA50cCc70b6a011CffDdf45057E39679379187287] = true; // curve-pax
        isOldDepositZap[0xbBC81d23Ea2c3ec7e56D39296F0cbB648873a5d3] = true; // curve-y
        isOldDepositZap[0xb6c057591E073249F2D9D88Ba59a46CFC9B59EdB] = true; // curve-busd
        isOldDepositZap[0xFCBa3E75865d2d561BE8D220616520c171F12851] = true; // curve-susd

        // deposit pool
        // address[] memory _compoundUnderlyingTokens = new address[](2);
        // _compoundUnderlyingTokens[0] = PlainTokens.DAI;
        // _compoundUnderlyingTokens[1] = PlainTokens.USDC;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.COMPOUND_DEPOSIT_POOL, _compoundUnderlyingTokens);
        // setLiquidityPoolToSwap(CurveDepositPool.COMPOUND_DEPOSIT_POOL, CurveSwapPool.COMPOUND_SWAP_POOL);

        // address[] memory _usdtUnderlyingTokens = new address[](3);
        // _usdtUnderlyingTokens[0] = PlainTokens.DAI;
        // _usdtUnderlyingTokens[1] = PlainTokens.USDC;
        // _usdtUnderlyingTokens[2] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.USDT_DEPOSIT_POOL, _usdtUnderlyingTokens);
        // setLiquidityPoolToSwap(CurveDepositPool.USDT_DEPOSIT_POOL, CurveSwapPool.USDT_SWAP_POOL);

        // address[] memory _paxUnderlyingTokens = new address[](4);
        // _paxUnderlyingTokens[0] = PlainTokens.DAI;
        // _paxUnderlyingTokens[1] = PlainTokens.USDC;
        // _paxUnderlyingTokens[2] = PlainTokens.USDT;
        // _paxUnderlyingTokens[3] = PlainTokens.PAX;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.PAX_DEPOSIT_POOL, _paxUnderlyingTokens);
        // setLiquidityPoolToSwap(CurveDepositPool.PAX_DEPOSIT_POOL, CurveSwapPool.PAX_SWAP_POOL);

        // address[] memory _yUnderlyingTokens = new address[](4);
        // _yUnderlyingTokens[0] = PlainTokens.DAI;
        // _yUnderlyingTokens[1] = PlainTokens.USDC;
        // _yUnderlyingTokens[2] = PlainTokens.USDT;
        // _yUnderlyingTokens[3] = PlainTokens.TUSD;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.Y_DEPOSIT_POOL, _yUnderlyingTokens);
        // setLiquidityPoolToSwap(CurveDepositPool.Y_DEPOSIT_POOL, CurveSwapPool.Y_SWAP_POOL);

        // address[] memory _busdUnderlyingTokens = new address[](4);
        // _busdUnderlyingTokens[0] = PlainTokens.DAI;
        // _busdUnderlyingTokens[1] = PlainTokens.USDC;
        // _busdUnderlyingTokens[2] = PlainTokens.USDT;
        // _busdUnderlyingTokens[3] = PlainTokens.BUSD;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.BUSD_DEPOSIT_POOL, _busdUnderlyingTokens);
        // setLiquidityPoolToSwap(CurveDepositPool.BUSD_DEPOSIT_POOL, CurveSwapPool.BUSD_SWAP_POOL);

        // address[] memory _susdUnderlyingTokens = new address[](4);
        // _susdUnderlyingTokens[0] = PlainTokens.DAI;
        // _susdUnderlyingTokens[1] = PlainTokens.USDC;
        // _susdUnderlyingTokens[2] = PlainTokens.USDT;
        // _susdUnderlyingTokens[3] = PlainTokens.SUSD;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.SUSD_DEPOSIT_POOL, _susdUnderlyingTokens);
        // setLiquidityPoolToSwap(CurveDepositPool.SUSD_DEPOSIT_POOL, CurveSwapPool.SUSD_SWAP_POOL);

        // /* solhint-disable max-line-length */
        // address[] memory _gusdUnderlyingTokens = new address[](4);
        // _gusdUnderlyingTokens[0] = PlainTokens.GUSD;
        // _gusdUnderlyingTokens[1] = PlainTokens.DAI;
        // _gusdUnderlyingTokens[2] = PlainTokens.USDC;
        // _gusdUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.GUSD_DEPOSIT_POOL, _gusdUnderlyingTokens); // GUSD,DAI,USDC,USDT
        // setLiquidityPoolToSwap(CurveDepositPool.GUSD_DEPOSIT_POOL, CurveSwapPool.GUSD_SWAP_POOL);

        // address[] memory _husdUnderlyingTokens = new address[](4);
        // _gusdUnderlyingTokens[0] = PlainTokens.HUSD;
        // _gusdUnderlyingTokens[1] = PlainTokens.DAI;
        // _gusdUnderlyingTokens[2] = PlainTokens.USDC;
        // _gusdUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.HUSD_DEPOSIT_POOL, _husdUnderlyingTokens); // HUSD, DAI,USDC,USDT
        // setLiquidityPoolToSwap(CurveDepositPool.HUSD_DEPOSIT_POOL, CurveSwapPool.HUSD_SWAP_POOL);

        // address[] memory _usdkUnderlyingTokens = new address[](4);
        // _usdkUnderlyingTokens[0] = PlainTokens.USDK;
        // _usdkUnderlyingTokens[1] = PlainTokens.DAI;
        // _usdkUnderlyingTokens[2] = PlainTokens.USDC;
        // _usdkUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.USDK_DEPOSIT_POOL, _usdkUnderlyingTokens); // USDK, DAI.USDC,USDT
        // setLiquidityPoolToSwap(CurveDepositPool.USDK_DEPOSIT_POOL, CurveSwapPool.USDK_SWAP_POOL);

        // address[] memory _usdnUnderlyingTokens = new address[](4);
        // _usdnUnderlyingTokens[0] = PlainTokens.USDN;
        // _usdnUnderlyingTokens[1] = PlainTokens.DAI;
        // _usdnUnderlyingTokens[2] = PlainTokens.USDC;
        // _usdnUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.USDN_DEPOSIT_POOL, _usdnUnderlyingTokens); // USDN, DAI, USDC, USDT
        // setLiquidityPoolToSwap(CurveDepositPool.USDN_DEPOSIT_POOL, CurveSwapPool.USDN_SWAP_POOL);

        // address[] memory _linkusdUnderlyingTokens = new address[](4);
        // _linkusdUnderlyingTokens[0] = PlainTokens.LINKUSD;
        // _linkusdUnderlyingTokens[1] = PlainTokens.DAI;
        // _linkusdUnderlyingTokens[2] = PlainTokens.USDC;
        // _linkusdUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.LINKUSD_DEPOSIT_POOL, _linkusdUnderlyingTokens); // LINKUSD, DAI, USDC, USDT
        // setLiquidityPoolToSwap(CurveDepositPool.LINKUSD_DEPOSIT_POOL, CurveSwapPool.LINKUSD_SWAP_POOL);

        // address[] memory _musdUnderlyingTokens = new address[](4);
        // _musdUnderlyingTokens[0] = PlainTokens.MUSD;
        // _musdUnderlyingTokens[1] = PlainTokens.DAI;
        // _musdUnderlyingTokens[2] = PlainTokens.USDC;
        // _musdUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.MUSD_DEPOSIT_POOL, _musdUnderlyingTokens); // MUSD, DAI, USDC, USDT
        // setLiquidityPoolToSwap(CurveDepositPool.MUSD_DEPOSIT_POOL, CurveSwapPool.MUSD_SWAP_POOL);

        // address[] memory _rsvUnderlyingTokens = new address[](4);
        // _rsvUnderlyingTokens[0] = PlainTokens.RSV;
        // _rsvUnderlyingTokens[1] = PlainTokens.DAI;
        // _rsvUnderlyingTokens[2] = PlainTokens.USDC;
        // _rsvUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.RSV_DEPOSIT_POOL, _rsvUnderlyingTokens); // RSV, DAI, USDC, USDT
        // setLiquidityPoolToSwap(CurveDepositPool.RSV_DEPOSIT_POOL, CurveSwapPool.RSV_SWAP_POOL);

        // address[] memory _tbtcUnderlyingTokens = new address[](4);
        // _tbtcUnderlyingTokens[0] = PlainTokens.TBTC;
        // _tbtcUnderlyingTokens[1] = PlainTokens.DAI;
        // _tbtcUnderlyingTokens[2] = PlainTokens.USDC;
        // _tbtcUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.TBTC_DEPOSIT_POOL, _tbtcUnderlyingTokens); // TBTC, DAI, USDC, USDT
        // setLiquidityPoolToSwap(CurveDepositPool.TBTC_DEPOSIT_POOL, CurveSwapPool.TBTC_SWAP_POOL);

        // address[] memory _dusdUnderlyingTokens = new address[](4);
        // _dusdUnderlyingTokens[0] = PlainTokens.DUSD;
        // _dusdUnderlyingTokens[1] = PlainTokens.DAI;
        // _dusdUnderlyingTokens[2] = PlainTokens.USDC;
        // _dusdUnderlyingTokens[3] = PlainTokens.USDT;
        // setLiquidityPoolToUnderlyingTokens(CurveDepositPool.DUSD_DEPOSIT_POOL, _dusdUnderlyingTokens); // DUSD, DAI, USDC, USDT
        // setLiquidityPoolToSwap(CurveDepositPool.DUSD_DEPOSIT_POOL, CurveSwapPool.DUSD_SWAP_POOL);
        // /* solhint-disable max-line-length */

        // // set liquidity pool to gauges
        // setLiquiidtyPoolToGauges(CurveDepositPool.COMPOUND_DEPOSIT_POOL, CurveGaugePool.COMPOUND_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.USDT_DEPOSIT_POOL, CurveGaugePool.USDT_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.PAX_DEPOSIT_POOL, CurveGaugePool.PAX_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.Y_DEPOSIT_POOL, CurveGaugePool.Y_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.BUSD_DEPOSIT_POOL, CurveGaugePool.BUSD_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.SUSD_DEPOSIT_POOL, CurveGaugePool.SUSD_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.GUSD_DEPOSIT_POOL, CurveGaugePool.GUSD_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.HUSD_DEPOSIT_POOL, CurveGaugePool.HUSD_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.USDK_DEPOSIT_POOL, CurveGaugePool.USDK_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.USDN_DEPOSIT_POOL, CurveGaugePool.USDN_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.MUSD_DEPOSIT_POOL, CurveGaugePool.MUSD_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.RSV_DEPOSIT_POOL, CurveGaugePool.RSV_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.TBTC_DEPOSIT_POOL, CurveGaugePool.TBTC_GAUGE);
        // setLiquiidtyPoolToGauges(CurveDepositPool.DUSD_DEPOSIT_POOL, CurveGaugePool.DUSD_GAUGE);

        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
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
     * @notice Sets the default absolute max deposit value in underlying
     * @param _maxDepositAmountDefault array of 4 absolute max deposit values in underlying to be set as default value
     */
    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    /**
     * @notice Sets the absolute max deposit value in underlying for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in absolute value)
     * @param _maxDepositAmount Array of 2 Pool's max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDeposit2Amount(address _liquidityPool, uint256[2] memory _maxDepositAmount) external onlyGovernance {
        maxDeposit2Amount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @notice Sets the absolute max deposit value in underlying for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in absolute value)
     * @param _maxDepositAmount Array of 3 Pool's max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDeposit3Amount(address _liquidityPool, uint256[3] memory _maxDepositAmount) external onlyGovernance {
        maxDeposit3Amount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @notice Sets the absolute max deposit value in underlying for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in absolute value)
     * @param _maxDepositAmount Array of 4 Pool's max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDeposit4Amount(address _liquidityPool, uint256[4] memory _maxDepositAmount) external onlyGovernance {
        maxDeposit4Amount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @notice Maps the liquidity pool to the list of underlyingTokens supported by the given lp
     * @param _liquidityPool liquidity pool address for which to map the underlying tokens supported
     * @param _tokens list of underlying tokens linked to the given liquidity pool
     */
    // function setLiquidityPoolToUnderlyingTokens(address _liquidityPool, address[] memory _tokens) public onlyOperator {
    //     liquidityPoolToUnderlyingTokens[_liquidityPool] = _tokens;
    // }

    /**
     * @notice Maps the liquidity pool to the curve's guage contract address
     * @param _pool Curve's liquidity pool address
     * @param _gauge Curve's gauge contract address
     */
    // function setLiquiidtyPoolToGauges(address _pool, address _gauge) public onlyOperator {
    //     liquidityPoolToGauges[_pool] = _gauge;
    // }

    /**
     * @notice Sets the default percentage of max deposit pool value
     * @param _maxDepositPoolPctDefault Pool's max deposit percentage (in basis points, For eg: 50% means 5000)
     * to be set as default value
     */
    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    // /**
    //  * @notice Maps the liquidity pool to the curve's swap pool address
    //  * @param _liquidityPool Curve's liquidity pool address
    //  * @param _swapPool Curve's swap pool address
    //  */
    // function setLiquidityPoolToSwap(address _liquidityPool, address _swapPool) public onlyGovernance {
    //     liquidityPoolToSwap[_liquidityPool] = _swapPool;
    // }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function setRewardToken(address) external override onlyOperator {
        revert("!empty");
    }

    function getPoolValue(address, address) external view override returns (uint256) {
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
        address _curveRegistry = _getCurveRegistry();
        address _swapPool = _getSwapPool(_liquidityPool);
        uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
        address[8] memory _underlyingTokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
        uint256[] memory _amounts = new uint256[](_nCoins);
        for (uint256 _i = 0; _i < _nCoins; _i++) {
            _amounts[_i] = IERC20(_underlyingTokens[_i]).balanceOf(_vault);
        }
        if (_nCoins == uint256(2)) {
            _codes = _getDeposit2Code(_underlyingTokens, _liquidityPool, _amounts);
        } else if (_nCoins == uint256(3)) {
            _codes = _getDeposit3Code(_underlyingTokens, _liquidityPool, _amounts);
        } else if (_nCoins == uint256(4)) {
            _codes = _getDeposit4Code(_underlyingTokens, _liquidityPool, _amounts);
        }
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
        address _swapPool =
            isOldDepositZap[_liquidityPool]
                ? ICurveDeposit(_liquidityPool).curve()
                : ICurveDeposit(_liquidityPool).pool();
        address _curveRegistry = ICurveAddressProvider(ADDRESS_PROVIDER).get_registry();
        uint256 _nCoins = ICurveRegistry(_curveRegistry).get_n_coins(_swapPool)[1];
        address[8] memory _uTokens = ICurveRegistry(_curveRegistry).get_underlying_coins(_swapPool);
        // liquidityPoolToUnderlyingTokens[_liquidityPool];
        for (uint256 _i = 0; _i < _nCoins; _i++) {
            _underlyingTokens[_i] = _uTokens[_i];
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
        uint256 _rewardTokenAmount = IERC20(getRewardToken(_liquidityPool)).balanceOf(_vault);
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
        address[] memory,
        address _liquidityPool,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        address _curveRegistry = _getCurveRegistry();
        address _swapPool = _getSwapPool(_liquidityPool);
        uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
        address[8] memory _underlyingTokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
        require(_amounts.length == _nCoins, "!_amounts.length");
        if (_nCoins == uint256(2)) {
            _codes = _getDeposit2Code(_underlyingTokens, _liquidityPool, _amounts);
        } else if (_nCoins == uint256(3)) {
            _codes = _getDeposit3Code(_underlyingTokens, _liquidityPool, _amounts);
        } else if (_nCoins == uint256(4)) {
            _codes = _getDeposit4Code(_underlyingTokens, _liquidityPool, _amounts);
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
        uint256 nCoins = _underlyingTokens.length;
        if (nCoins == uint256(1)) {
            _codes = _getWithdraw1Code(_underlyingTokens[0], _liquidityPool, _amount);
        } else if (nCoins == uint256(2)) {
            _codes = _getWithdraw2Code(_liquidityPool, _amount);
        } else if (nCoins == uint256(3)) {
            _codes = _getWithdraw3Code(_liquidityPool, _amount);
        } else if (nCoins == uint256(4)) {
            _codes = _getWithdraw4Code(_liquidityPool, _amount);
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
     * @dev Deploy function for a pool with 2 tokens
     */
    function _getDeposit2Code(
        address[8] memory _underlyingTokens,
        address _liquidityPool,
        uint256[] memory _amounts
    ) internal view returns (bytes[] memory _codes) {
        uint256[2] memory _amountsIn;
        uint256[] memory _amountsAux = new uint256[](2);
        uint8 _codeLength = 1;
        bool _isAmount = false;
        // calculator for lines of code
        for (uint8 i = 0; i < 2; i++) {
            _amountsIn[i] = _amounts[i];
            if (_amountsIn[i] > 0) {
                if (_underlyingTokens[i] == PlainTokens.HBTC) {
                    _codeLength++;
                } else {
                    _codeLength += 2;
                }
            }
        }
        _amountsAux = _getDeposit2Amount(_liquidityPool, _amounts);
        _codes = new bytes[](_codeLength);
        uint8 _j = 0;
        for (uint8 i = 0; i < 2; i++) {
            _amountsIn[i] = _amountsAux[i];
            if (_amountsIn[i] > 0) {
                _isAmount = true;
                if (_underlyingTokens[i] == PlainTokens.HBTC) {
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amountsIn[i])
                    );
                } else {
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
                    );
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amountsIn[i])
                    );
                }
            }
        }
        if (_isAmount) {
            _codes[_j] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("add_liquidity(uint256[2],uint256)", _amountsIn, uint256(0))
            );
        }
    }

    /**
     * @dev Deploy function for a pool with 3 tokens
     */
    function _getDeposit3Code(
        address[8] memory _underlyingTokens,
        address _liquidityPool,
        uint256[] memory _amounts
    ) internal view returns (bytes[] memory _codes) {
        uint256[3] memory _amountsIn;
        uint256[] memory _amountsAux = new uint256[](3);
        uint8 _codeLength = 1;
        bool _isAmount = false;
        // calculator for lines of code
        for (uint8 i = 0; i < 3; i++) {
            _amountsIn[i] = _amounts[i];
            if (_amountsIn[i] > 0) {
                if (_underlyingTokens[i] == PlainTokens.HBTC) {
                    _codeLength++;
                } else {
                    _codeLength += 2;
                }
            }
        }
        _amountsAux = _getDeposit3Amount(_liquidityPool, _amounts);
        _codes = new bytes[](_codeLength);
        uint8 _j = 0;
        for (uint8 i = 0; i < 3; i++) {
            _amountsIn[i] = _amountsAux[i];
            if (_amountsIn[i] > 0) {
                _isAmount = true;
                if (_underlyingTokens[i] == PlainTokens.HBTC) {
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amountsIn[i])
                    );
                } else {
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
                    );
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amountsIn[i])
                    );
                }
            }
        }
        if (_isAmount) {
            _codes[_j] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("add_liquidity(uint256[3],uint256)", _amountsIn, uint256(0))
            );
        }
    }

    /**
     * @dev Deploy function for a pool with 4 tokens
     */
    function _getDeposit4Code(
        address[8] memory _underlyingTokens,
        address _liquidityPool,
        uint256[] memory _amounts
    ) internal view returns (bytes[] memory _codes) {
        uint256[2] memory _amountsIn;
        uint256[] memory _amountsAux = new uint256[](4);
        uint8 _codeLength = 1;
        bool _isAmount = false;
        // calculator for lines of code
        for (uint8 i = 0; i < 4; i++) {
            _amountsIn[i] = _amounts[i];
            if (_amountsIn[i] > 0) {
                if (_underlyingTokens[i] == PlainTokens.HBTC) {
                    _codeLength++;
                } else {
                    _codeLength += 2;
                }
            }
        }
        _amountsAux = _getDeposit4Amount(_liquidityPool, _amounts);
        _codes = new bytes[](_codeLength);
        uint8 _j = 0;
        for (uint8 i = 0; i < 4; i++) {
            _amountsIn[i] = _amountsAux[i];
            if (_amountsIn[i] > 0) {
                _isAmount = true;
                if (_underlyingTokens[i] == PlainTokens.HBTC) {
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amountsIn[i])
                    );
                } else {
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
                    );
                    _codes[_j++] = abi.encode(
                        _underlyingTokens[i],
                        abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amountsIn[i])
                    );
                }
            }
        }
        if (_isAmount) {
            _codes[_j] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("add_liquidity(uint256[4],uint256)", _amountsIn, uint256(0))
            );
        }
    }

    /**
     * @dev Swaps _amount of _liquidityPoolToken for a certain quantity of each underlying token
     */
    function _getWithdraw1Code(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) internal view returns (bytes[] memory _codes) {
        if (_amount > 0) {
            address _curveRegistry = _getCurveRegistry();
            address _swapPool = _getSwapPool(_liquidityPool);
            uint256 _nCoins = _getNCoins(_swapPool, _curveRegistry);
            address[8] memory _underlyingTokens = _getUnderlyingTokens(_swapPool, _curveRegistry);
            uint256 i = 0;
            for (uint256 j = 0; j < _nCoins; j++) {
                if (_underlyingTokens[j] == _underlyingToken) {
                    i = j;
                }
            }
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
        }
    }

    /**
     * @dev Swaps _amount of _liquidityPoolToken for a certain quantity of each underlying token
     */
    function _getWithdraw2Code(address _liquidityPool, uint256 _amount) internal view returns (bytes[] memory _codes) {
        if (_amount > 0) {
            uint256[2] memory _minAmountOut = [uint256(0), uint256(0)];
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
            _codes[2] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("remove_liquidity(uint256,uint256[2])", _amount, _minAmountOut)
            );
        }
    }

    /**
     * @dev Swaps _amount of _liquidityPoolToken for a certain quantity of each underlying token
     */
    function _getWithdraw3Code(address _liquidityPool, uint256 _amount) internal view returns (bytes[] memory _codes) {
        if (_amount > 0) {
            uint256[3] memory _minAmountOut = [uint256(0), uint256(0), uint256(0)];
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
            _codes[2] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("remove_liquidity(uint256,uint256[3])", _amount, _minAmountOut)
            );
        }
    }

    /**
     * @dev Swaps _amount of _liquidityPoolToken for a certain quantity of each underlying token
     */
    function _getWithdraw4Code(address _liquidityPool, uint256 _amount) internal view returns (bytes[] memory _codes) {
        if (_amount > 0) {
            uint256[4] memory _minAmountOut = [uint256(0), uint256(0), uint256(0), uint256(0)];
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
            _codes[2] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("remove_liquidity(uint256,uint256[4])", _amount, _minAmountOut)
            );
        }
    }

    function _getDepositAmountPct(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _poolValue,
        uint256 _amount
    ) internal view returns (uint256) {
        uint256 _maxDepositPct;
        if (maxDepositPoolPct[_liquidityPool] == uint256(0)) {
            _maxDepositPct = maxDepositPoolPctDefault;
        } else if (maxDepositPoolPct[_liquidityPool] == uint256(-1)) {
            return _amount;
        } else {
            _maxDepositPct = maxDepositPoolPct[_liquidityPool];
        }
        IPriceOracle _priceOracleContract = IPriceOracle(registryContract.getAprOracle());
        uint256 _amountInUSD = _priceOracleContract.getUnderlyingTokenAmountInUSD(_amount, _underlyingToken);
        uint256 _maxAmountInUSD = _poolValue.mul(_maxDepositPct).div(uint256(10000));
        if (_amountInUSD > _maxAmountInUSD) {
            return _priceOracleContract.getUSDAmountInUnderlyingToken(_maxAmountInUSD, _underlyingToken);
        } else {
            return _amount;
        }
    }

    function _getDeposit2Amount(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory)
    {
        uint256[2] memory _maxDepositAmounts;
        uint256[] memory _depositAmounts = new uint256[](2);
        for (uint256 i = 0; i < 2; i++) {
            if (maxDeposit2Amount[_liquidityPool][i] == uint256(0)) {
                _maxDepositAmounts[i] = maxDepositAmountDefault[i];
            } else {
                _maxDepositAmounts[i] = maxDeposit2Amount[_liquidityPool][i];
            }
            if (_maxDepositAmounts[i] > _amounts[i]) {
                _depositAmounts[i] = _amounts[i];
            } else {
                _depositAmounts[i] = _maxDepositAmounts[i];
            }
        }
        return _depositAmounts;
    }

    function _getDeposit3Amount(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory)
    {
        uint256[3] memory _maxDepositAmounts;
        uint256[] memory _depositAmounts = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            if ((maxDeposit3Amount[_liquidityPool])[i] == uint256(0)) {
                _maxDepositAmounts[i] = maxDepositAmountDefault[i];
            } else {
                _maxDepositAmounts[i] = maxDeposit3Amount[_liquidityPool][i];
            }
            if (_maxDepositAmounts[i] > _amounts[i]) {
                _depositAmounts[i] = _amounts[i];
            } else {
                _depositAmounts[i] = _maxDepositAmounts[i];
            }
        }
        return _depositAmounts;
    }

    function _getDeposit4Amount(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory)
    {
        uint256[4] memory _maxDepositAmounts;
        uint256[] memory _depositAmounts = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            if ((maxDeposit4Amount[_liquidityPool])[i] == uint256(0)) {
                _maxDepositAmounts[i] = maxDepositAmountDefault[i];
            } else {
                _maxDepositAmounts[i] = maxDeposit4Amount[_liquidityPool][i];
            }
            if (_maxDepositAmounts[i] > _amounts[i]) {
                _depositAmounts[i] = _amounts[i];
            } else {
                _depositAmounts[i] = _maxDepositAmounts[i];
            }
        }
        return _depositAmounts;
    }

    function _getUnderlyingTokens(address _swapPool, address _curveRegistry)
        internal
        view
        returns (address[8] memory _underlyingTokens)
    {
        _underlyingTokens = ICurveRegistry(_curveRegistry).get_underlying_coins(_swapPool);
    }

    function _getLiquidityGauge(address _liquidityPool, address _curveRegistry)
        internal
        view
        returns (address _liquidityGauge)
    {
        (address[10] memory _liquidityGauges, ) =
            ICurveRegistry(_curveRegistry).get_gauges(_getSwapPool(_liquidityPool));
        _liquidityGauge = _liquidityGauges[0];
    }

    function _getSwapPool(address _liquidityPool) internal view returns (address _swapPool) {
        _swapPool = isOldDepositZap[_liquidityPool]
            ? ICurveDeposit(_liquidityPool).curve()
            : ICurveDeposit(_liquidityPool).pool();
    }

    function _getCurveRegistry() internal view returns (address _curveRegistry) {
        _curveRegistry = ICurveAddressProvider(ADDRESS_PROVIDER).get_registry();
    }

    function _getNCoins(address _swapPool, address _curveRegistry) internal view returns (uint256 _nCoins) {
        _nCoins = ICurveRegistry(_curveRegistry).get_n_coins(_swapPool)[1];
    }
}
