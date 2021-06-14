// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { Modifiers } from "../../configuration/Modifiers.sol";
import { PlainTokens } from "./PlainTokens.sol";
import { CurveDepositPool } from "./CurveDepositPool.sol";
import { CurveSwapPool } from "./CurveSwapPool.sol";
import { CurveGaugePool } from "./CurveGaugePool.sol";

/**
 * @dev Curve's registry in opty.fi's flavour
 */

contract CurveRegistry is Modifiers {
    mapping(address => address[]) public liquidityPoolToUnderlyingTokens;
    mapping(address => address) public liquidityPoolToSwap;
    mapping(address => address) public liquidityPoolToGauges;

    /**
     * @dev map coins and tokens to curvepool
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
    }

    function setLiquidityPoolToUnderlyingTokens(address _lendingPool, address[] memory _tokens) public onlyOperator {
        liquidityPoolToUnderlyingTokens[_lendingPool] = _tokens;
    }

    function setLiquiidtyPoolToGauges(address _pool, address _gauge) public onlyOperator {
        liquidityPoolToGauges[_pool] = _gauge;
    }

    function setLiquidityPoolToSwap(address _liquidityPool, address _swapPool) public onlyOperator {
        liquidityPoolToSwap[_liquidityPool] = _swapPool;
    }
}
