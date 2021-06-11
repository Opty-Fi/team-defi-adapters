// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { IAdapter } from "../../../interfaces/opty/IAdapter.sol";
import { ICurveDeposit } from "../../../interfaces/curve/ICurveDeposit.sol";
import { ICurveSwap } from "../../../interfaces/curve/ICurveSwap.sol";
import { ICurveGauge } from "../../../interfaces/curve/ICurveGauge.sol";
import { ITokenMinter } from "../../../interfaces/curve/ITokenMinter.sol";
import { SafeERC20, IERC20, SafeMath } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "../../configuration/Modifiers.sol";
import { IHarvestCodeProvider } from "../../../interfaces/opty/IHarvestCodeProvider.sol";
import { IPriceOracle } from "../../../interfaces/opty/IPriceOracle.sol";
import { PlainTokens } from "./PlainTokens.sol";
import { CurveDepositPool } from "./CurveDepositPool.sol";
import { CurveSwapPool } from "./CurveSwapPool.sol";
import { CurveGaugePool } from "./CurveGaugePool.sol";

/**
 * @dev Abstraction layer to Curve's deposit pools
 */

contract CurvePoolAdapter is IAdapter, Modifiers {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => address[]) public liquidityPoolToUnderlyingTokens;
    mapping(address => address) public liquidityPoolToSwap;
    mapping(address => address) public liquidityPoolToGauges;
    mapping(address => uint256[2]) public maxDeposit2Amount;
    mapping(address => uint256[3]) public maxDeposit3Amount;
    mapping(address => uint256[4]) public maxDeposit4Amount;
    mapping(address => uint256) public maxDepositPoolPct; // basis points

    uint256 public maxDepositPoolPctDefault; // basis points
    uint256[4] public maxDepositAmountDefault;

    /**
     * @dev map coins and tokens to curve deposit pool
     */
    constructor(address _registry) public Modifiers(_registry) {
        // deposit pool
        address[] memory _compoundUnderlyingTokens = new address[](2);
        _compoundUnderlyingTokens[0] = PlainTokens.DAI;
        _compoundUnderlyingTokens[1] = PlainTokens.USDC;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.COMPOUND_DEPOSIT_POOL, _compoundUnderlyingTokens);
        setLiquidityPoolToSwap(CurveDepositPool.COMPOUND_DEPOSIT_POOL, CurveSwapPool.COMPOUND_SWAP_POOL);

        address[] memory _usdtUnderlyingTokens = new address[](3);
        _usdtUnderlyingTokens[0] = PlainTokens.DAI;
        _usdtUnderlyingTokens[1] = PlainTokens.USDC;
        _usdtUnderlyingTokens[2] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.USDT_DEPOSIT_POOL, _usdtUnderlyingTokens);
        setLiquidityPoolToSwap(CurveDepositPool.USDT_DEPOSIT_POOL, CurveSwapPool.USDT_SWAP_POOL);

        address[] memory _paxUnderlyingTokens = new address[](4);
        _paxUnderlyingTokens[0] = PlainTokens.DAI;
        _paxUnderlyingTokens[1] = PlainTokens.USDC;
        _paxUnderlyingTokens[2] = PlainTokens.USDT;
        _paxUnderlyingTokens[3] = PlainTokens.PAX;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.PAX_DEPOSIT_POOL, _paxUnderlyingTokens);
        setLiquidityPoolToSwap(CurveDepositPool.PAX_DEPOSIT_POOL, CurveSwapPool.PAX_SWAP_POOL);

        address[] memory _yUnderlyingTokens = new address[](4);
        _yUnderlyingTokens[0] = PlainTokens.DAI;
        _yUnderlyingTokens[1] = PlainTokens.USDC;
        _yUnderlyingTokens[2] = PlainTokens.USDT;
        _yUnderlyingTokens[3] = PlainTokens.TUSD;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.Y_DEPOSIT_POOL, _yUnderlyingTokens);
        setLiquidityPoolToSwap(CurveDepositPool.Y_DEPOSIT_POOL, CurveSwapPool.Y_SWAP_POOL);

        address[] memory _busdUnderlyingTokens = new address[](4);
        _busdUnderlyingTokens[0] = PlainTokens.DAI;
        _busdUnderlyingTokens[1] = PlainTokens.USDC;
        _busdUnderlyingTokens[2] = PlainTokens.USDT;
        _busdUnderlyingTokens[3] = PlainTokens.BUSD;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.BUSD_DEPOSIT_POOL, _busdUnderlyingTokens);
        setLiquidityPoolToSwap(CurveDepositPool.BUSD_DEPOSIT_POOL, CurveSwapPool.BUSD_SWAP_POOL);

        address[] memory _susdUnderlyingTokens = new address[](4);
        _susdUnderlyingTokens[0] = PlainTokens.DAI;
        _susdUnderlyingTokens[1] = PlainTokens.USDC;
        _susdUnderlyingTokens[2] = PlainTokens.USDT;
        _susdUnderlyingTokens[3] = PlainTokens.SUSD;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.SUSD_DEPOSIT_POOL, _susdUnderlyingTokens);
        setLiquidityPoolToSwap(CurveDepositPool.SUSD_DEPOSIT_POOL, CurveSwapPool.SUSD_SWAP_POOL);

        /* solhint-disable max-line-length */
        address[] memory _gusdUnderlyingTokens = new address[](4);
        _gusdUnderlyingTokens[0] = PlainTokens.GUSD;
        _gusdUnderlyingTokens[1] = PlainTokens.DAI;
        _gusdUnderlyingTokens[2] = PlainTokens.USDC;
        _gusdUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.GUSD_DEPOSIT_POOL, _gusdUnderlyingTokens); // GUSD,DAI,USDC,USDT
        setLiquidityPoolToSwap(CurveDepositPool.GUSD_DEPOSIT_POOL, CurveSwapPool.GUSD_SWAP_POOL);

        address[] memory _husdUnderlyingTokens = new address[](4);
        _gusdUnderlyingTokens[0] = PlainTokens.HUSD;
        _gusdUnderlyingTokens[1] = PlainTokens.DAI;
        _gusdUnderlyingTokens[2] = PlainTokens.USDC;
        _gusdUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.HUSD_DEPOSIT_POOL, _husdUnderlyingTokens); // HUSD, DAI,USDC,USDT
        setLiquidityPoolToSwap(CurveDepositPool.HUSD_DEPOSIT_POOL, CurveSwapPool.HUSD_SWAP_POOL);

        address[] memory _usdkUnderlyingTokens = new address[](4);
        _usdkUnderlyingTokens[0] = PlainTokens.USDK;
        _usdkUnderlyingTokens[1] = PlainTokens.DAI;
        _usdkUnderlyingTokens[2] = PlainTokens.USDC;
        _usdkUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.USDK_DEPOSIT_POOL, _usdkUnderlyingTokens); // USDK, DAI.USDC,USDT
        setLiquidityPoolToSwap(CurveDepositPool.USDK_DEPOSIT_POOL, CurveSwapPool.USDK_SWAP_POOL);

        address[] memory _usdnUnderlyingTokens = new address[](4);
        _usdnUnderlyingTokens[0] = PlainTokens.USDN;
        _usdnUnderlyingTokens[1] = PlainTokens.DAI;
        _usdnUnderlyingTokens[2] = PlainTokens.USDC;
        _usdnUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.USDN_DEPOSIT_POOL, _usdnUnderlyingTokens); // USDN, DAI, USDC, USDT
        setLiquidityPoolToSwap(CurveDepositPool.USDN_DEPOSIT_POOL, CurveSwapPool.USDN_SWAP_POOL);

        address[] memory _linkusdUnderlyingTokens = new address[](4);
        _linkusdUnderlyingTokens[0] = PlainTokens.LINKUSD;
        _linkusdUnderlyingTokens[1] = PlainTokens.DAI;
        _linkusdUnderlyingTokens[2] = PlainTokens.USDC;
        _linkusdUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.LINKUSD_DEPOSIT_POOL, _linkusdUnderlyingTokens); // LINKUSD, DAI, USDC, USDT
        setLiquidityPoolToSwap(CurveDepositPool.LINKUSD_DEPOSIT_POOL, CurveSwapPool.LINKUSD_SWAP_POOL);

        address[] memory _musdUnderlyingTokens = new address[](4);
        _musdUnderlyingTokens[0] = PlainTokens.MUSD;
        _musdUnderlyingTokens[1] = PlainTokens.DAI;
        _musdUnderlyingTokens[2] = PlainTokens.USDC;
        _musdUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.MUSD_DEPOSIT_POOL, _musdUnderlyingTokens); // MUSD, DAI, USDC, USDT
        setLiquidityPoolToSwap(CurveDepositPool.MUSD_DEPOSIT_POOL, CurveSwapPool.MUSD_SWAP_POOL);

        address[] memory _rsvUnderlyingTokens = new address[](4);
        _rsvUnderlyingTokens[0] = PlainTokens.RSV;
        _rsvUnderlyingTokens[1] = PlainTokens.DAI;
        _rsvUnderlyingTokens[2] = PlainTokens.USDC;
        _rsvUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.RSV_DEPOSIT_POOL, _rsvUnderlyingTokens); // RSV, DAI, USDC, USDT
        setLiquidityPoolToSwap(CurveDepositPool.RSV_DEPOSIT_POOL, CurveSwapPool.RSV_SWAP_POOL);

        address[] memory _tbtcUnderlyingTokens = new address[](4);
        _tbtcUnderlyingTokens[0] = PlainTokens.TBTC;
        _tbtcUnderlyingTokens[1] = PlainTokens.DAI;
        _tbtcUnderlyingTokens[2] = PlainTokens.USDC;
        _tbtcUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.TBTC_DEPOSIT_POOL, _tbtcUnderlyingTokens); // TBTC, DAI, USDC, USDT
        setLiquidityPoolToSwap(CurveDepositPool.TBTC_DEPOSIT_POOL, CurveSwapPool.TBTC_SWAP_POOL);

        address[] memory _dusdUnderlyingTokens = new address[](4);
        _dusdUnderlyingTokens[0] = PlainTokens.DUSD;
        _dusdUnderlyingTokens[1] = PlainTokens.DAI;
        _dusdUnderlyingTokens[2] = PlainTokens.USDC;
        _dusdUnderlyingTokens[3] = PlainTokens.USDT;
        setLiquidityPoolToUnderlyingTokens(CurveDepositPool.DUSD_DEPOSIT_POOL, _dusdUnderlyingTokens); // DUSD, DAI, USDC, USDT
        setLiquidityPoolToSwap(CurveDepositPool.DUSD_DEPOSIT_POOL, CurveSwapPool.DUSD_SWAP_POOL);
        /* solhint-disable max-line-length */

        // set liquidity pool to gauges
        setLiquiidtyPoolToGauges(CurveDepositPool.COMPOUND_DEPOSIT_POOL, CurveGaugePool.COMPOUND_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.USDT_DEPOSIT_POOL, CurveGaugePool.USDT_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.PAX_DEPOSIT_POOL, CurveGaugePool.PAX_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.Y_DEPOSIT_POOL, CurveGaugePool.Y_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.BUSD_DEPOSIT_POOL, CurveGaugePool.BUSD_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.SUSD_DEPOSIT_POOL, CurveGaugePool.SUSD_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.GUSD_DEPOSIT_POOL, CurveGaugePool.GUSD_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.HUSD_DEPOSIT_POOL, CurveGaugePool.HUSD_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.USDK_DEPOSIT_POOL, CurveGaugePool.USDK_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.USDN_DEPOSIT_POOL, CurveGaugePool.USDN_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.MUSD_DEPOSIT_POOL, CurveGaugePool.MUSD_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.RSV_DEPOSIT_POOL, CurveGaugePool.RSV_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.TBTC_DEPOSIT_POOL, CurveGaugePool.TBTC_GAUGE);
        setLiquiidtyPoolToGauges(CurveDepositPool.DUSD_DEPOSIT_POOL, CurveGaugePool.DUSD_GAUGE);

        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
    }

    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external onlyGovernance {
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
    }

    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    function setMaxDeposit2Amount(address _liquidityPool, uint256[2] memory _maxDepositAmount) external onlyGovernance {
        maxDeposit2Amount[_liquidityPool] = _maxDepositAmount;
    }

    function setMaxDeposit3Amount(address _liquidityPool, uint256[3] memory _maxDepositAmount) external onlyGovernance {
        maxDeposit3Amount[_liquidityPool] = _maxDepositAmount;
    }

    function setMaxDeposit4Amount(address _liquidityPool, uint256[4] memory _maxDepositAmount) external onlyGovernance {
        maxDeposit4Amount[_liquidityPool] = _maxDepositAmount;
    }

    function getPoolValue(address _liquidityPool, address _underlyingToken) external view override returns (uint256) {
        revert("!empty");
    }

    function getDepositAllCodes(
        address payable _optyVault,
        address[] memory,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 nCoins = _underlyingTokens.length;
        uint256[] memory _amounts = new uint256[](nCoins);
        for (uint256 i = 0; i < nCoins; i++) {
            _amounts[i] = IERC20(_underlyingTokens[i]).balanceOf(_optyVault);
        }
        return getDepositSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _amounts);
    }

    function getBorrowAllCodes(
        address payable,
        address[] memory,
        address,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    function getRepayAndWithdrawAllCodes(
        address payable,
        address[] memory,
        address,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _amount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _amount);
    }

    function getUnderlyingTokens(address _liquidityPool, address)
        external
        view
        override
        returns (address[] memory _underlyingTokens)
    {
        _underlyingTokens = liquidityPoolToUnderlyingTokens[_liquidityPool];
    }

    function getSomeAmountInTokenBorrow(
        address payable,
        address,
        address,
        uint256,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    function getAllAmountInTokenBorrow(
        address payable,
        address,
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken
     */
    function calculateAmountInLPToken(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("not-implemented");
    }

    function calculateRedeemableLPTokenAmount(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (uint256 _amount) {
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalance(_optyVault, _underlyingToken, _liquidityPool);
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInToken).add(1);
    }

    function isRedeemableAmountSufficient(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    function getClaimRewardTokenCode(address payable, address _liquidityPool)
        external
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

    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(_liquidityPool)).balanceOf(_optyVault);
        return getHarvestSomeCodes(_optyVault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    function canStake(address _liquidityPool) external view override returns (bool) {
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
            return true;
        }
        return false;
    }

    function getStakeAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _stakeAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getStakeSomeCodes(_liquidityPool, _stakeAmount);
    }

    function getUnstakeAllCodes(address payable _optyVault, address _liquidityPool)
        external
        view
        override
        returns (bytes[] memory _codes)
    {
        uint256 _unstakeAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        return getUnstakeSomeCodes(_liquidityPool, _unstakeAmount);
    }

    function calculateRedeemableLPTokenAmountStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (uint256 _amount) {
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        uint256 _balanceInToken = getAllAmountInTokenStake(_optyVault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInToken).add(1);
    }

    function isRedeemableAmountSufficientStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInTokenStake(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    function getUnstakeAndWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        return getUnstakeAndWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
    }

    function setLiquidityPoolToUnderlyingTokens(address _lendingPool, address[] memory _tokens) public onlyOperator {
        liquidityPoolToUnderlyingTokens[_lendingPool] = _tokens;
    }

    function setLiquiidtyPoolToGauges(address _pool, address _gauge) public onlyOperator {
        liquidityPoolToGauges[_pool] = _gauge;
    }

    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    function setLiquidityPoolToSwap(address _liquidityPool, address _swapPool) public onlyGovernance {
        liquidityPoolToSwap[_liquidityPool] = _swapPool;
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amounts Quantity of _underlyingToken to deposit
     *
     * @return _codes Returns the codes for deposit tokens in the liquidityPool provided
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
        if (nCoins == uint256(2)) {
            _codes = _getDeposit2Code(_underlyingTokens, _liquidityPool, _amounts);
        } else if (nCoins == uint256(3)) {
            _codes = _getDeposit3Code(_underlyingTokens, _liquidityPool, _amounts);
        } else if (nCoins == uint256(4)) {
            _codes = _getDeposit4Code(_underlyingTokens, _liquidityPool, _amounts);
        }
    }

    /**
     * @dev Swaps _amount of _liquidityPoolToken for _underlyingToken
     *
     * @param _liquidityPool Address of the token that represents users' holdings in the pool
     * @param _amount Quantity of _liquidityPoolToken to swap for _underlyingToken
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

    function getLiquidityPoolToken(address, address _liquidityPool) public view override returns (address) {
        return ICurveDeposit(_liquidityPool).token();
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken
     */
    function getAllAmountInToken(
        address payable _holder,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        uint256 _liquidityPoolTokenAmount = getLiquidityPoolTokenBalance(_holder, _underlyingToken, _liquidityPool);
        return getSomeAmountInToken(_underlyingToken, _liquidityPool, _liquidityPoolTokenAmount);
    }

    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        return IERC20(getLiquidityPoolToken(_underlyingToken, _liquidityPool)).balanceOf(_optyVault);
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken
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

    function getRewardToken(address _liquidityPool) public view override returns (address) {
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
            return ITokenMinter(getMinter(liquidityPoolToGauges[_liquidityPool])).token();
        }
        return address(0);
    }

    function getUnclaimedRewardTokenAmount(address payable, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        if (liquidityPoolToGauges[_liquidityPool] != address(0)) {
            // TODO : get the amount of unclaimed CRV tokens
            return uint256(1000000000000000000);
        }
        return uint256(0);
    }

    function getHarvestSomeCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        return
            IHarvestCodeProvider(registryContract.getHarvestCodeProvider()).getHarvestCodes(
                _optyVault,
                getRewardToken(_liquidityPool),
                _underlyingToken,
                _rewardTokenAmount
            );
    }

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
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken in staking vault(gauge)
     */
    function getAllAmountInTokenStake(
        address payable _optyVault,
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
        uint256 _liquidityPoolTokenAmount = ICurveGauge(_gauge).balanceOf(_optyVault);
        uint256 _b = 0;
        if (_liquidityPoolTokenAmount > 0) {
            _b = ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        _b = _b.add(
            IHarvestCodeProvider(registryContract.getHarvestCodeProvider()).rewardBalanceInUnderlyingTokens(
                getRewardToken(_liquidityPool),
                _underlyingToken,
                getUnclaimedRewardTokenAmount(_optyVault, _liquidityPool)
            )
        );
        return _b;
    }

    function getLiquidityPoolTokenBalanceStake(address payable _optyVault, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        return ICurveGauge(liquidityPoolToGauges[_liquidityPool]).balanceOf(_optyVault);
    }

    function getUnstakeAndWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            _codes = new bytes[](4);
            _codes[0] = getUnstakeSomeCodes(_liquidityPool, _redeemAmount)[0];
            bytes[] memory _withdrawCodes =
                getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
            _codes[1] = _withdrawCodes[0];
            _codes[2] = _withdrawCodes[1];
            _codes[3] = _withdrawCodes[2];
        }
    }

    function getMinter(address _gauge) public view returns (address) {
        return ICurveGauge(_gauge).minter();
    }

    /**
     * @dev Deploy function for a pool with 2 tokens
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amounts Quantity of _underlyingToken to deposit
     */
    function _getDeposit2Code(
        address[] memory _underlyingTokens,
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
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amounts Quantity of _underlyingToken to deposit
     */
    function _getDeposit3Code(
        address[] memory _underlyingTokens,
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
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amounts Quantity of _underlyingToken to deposit
     */
    function _getDeposit4Code(
        address[] memory _underlyingTokens,
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
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amount Quantity of _liquidityPoolToken to swap for underlying tokens
     */
    function _getWithdraw1Code(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _amount
    ) internal view returns (bytes[] memory _codes) {
        if (_amount > 0) {
            address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
            uint256 i = 0;
            for (uint256 j = 0; j < _underlyingTokens.length; j++) {
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
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amount Quantity of _liquidityPoolToken to swap for underlying tokens
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
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amount Quantity of _liquidityPoolToken to swap for underlying tokens
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
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amount Quantity of _liquidityPoolToken to swap for underlying tokens
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

    function _getUnderlyingTokens(address _liquidityPool) internal view returns (address[] memory _underlyingTokens) {
        _underlyingTokens = liquidityPoolToUnderlyingTokens[_liquidityPool];
    }
}
