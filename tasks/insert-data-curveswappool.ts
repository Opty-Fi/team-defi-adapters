import { task } from 'hardhat/config';

task("insert-data-curveswappooladapter", "set mapping in curve swap pool adapter")
    .addParam("address", "The curveswappooladapter contract address")
    .setAction(async (taskArgs, localBRE) => {

        const tokens = require("../helpers/tokens")
        const swapPools = require("../helpers/curve-swap-pools")

        const swapPoolMapping = {
            [`${swapPools["COMPOUND_SWAP_POOL"]}`]: {
                lpToken: `${tokens["CDAI_CUSDC"]}`,
                underlyingTokens: [`${tokens["CDAI"]}`, `${tokens["CUSDC"]}`],
                hasRemoveLiquidityOneCoin: false
            },
            [`${swapPools["USDT_SWAP_POOL"]}`]: {
                lpToken: `${tokens["CDAI_CUSD_CUSDT"]}`,
                underlyingTokens: [`${tokens["CDAI"]}`, `${tokens["CUSDC"]}`, `${tokens["USDT"]}`],
                hasRemoveLiquidityOneCoin: false
            },
            [`${swapPools["PAX_SWAP_POOL"]}`]: {
                lpToken: `${tokens["Y_PAX_CRV"]}`,
                underlyingTokens: [`${tokens["YCDAI"]}`, `${tokens["YCUSDC"]}`, `${tokens["YCUSDT"]}`,`${tokens["PAX"]}`],
                hasRemoveLiquidityOneCoin: false
            },
            [`${swapPools["Y_SWAP_POOL"]}`]: {
                lpToken: `${tokens["YDAI_YUSDC_YUSDT_YTUSD"]}`,
                underlyingTokens: [`${tokens["YDAI"]}`, `${tokens["YUSDC"]}`, `${tokens["YUSDT"]}`,`${tokens["YTUSD"]}`],
                hasRemoveLiquidityOneCoin: false
            },
            [`${swapPools["BUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["YDAI_YUSDC_YUSDT_YBUSD"]}`,
                underlyingTokens: [`${tokens["YDAI"]}`, `${tokens["YUSDC"]}`, `${tokens["YUSDT"]}`, `${tokens["YBUSD"]}`],
                hasRemoveLiquidityOneCoin: false
            },
            [`${swapPools["SUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["CRV_PLAIN_3_AND_SUSD"]}`,
                underlyingTokens: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`, `${tokens["SUSD"]}`],
                hasRemoveLiquidityOneCoin: false
            },
            [`${swapPools["REN_SWAP_POOL"]}`]: {
                lpToken: `${tokens["CRV_REN_WBTC"]}`,
                underlyingTokens: [`${tokens["REN_BTC"]}`, `${tokens["WBTC"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["SBTC_SWAP_POOL"]}`]: {
                lpToken: `${tokens["CRV_REN_BTC_WBTC_SBTC"]}`,
                underlyingTokens: [`${tokens["REN_BTC"]}`, `${tokens["WBTC"]}`, `${tokens["SBTC"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["HBTC_SWAP_POOL"]}`]: {
                lpToken: `${tokens["HCRV"]}`,
                underlyingTokens: [`${tokens["HBTC"]}`, `${tokens["WBTC"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["THREE_SWAP_POOL"]}`]: {
                lpToken: `${tokens["THREE_CRV"]}`,
                underlyingTokens: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["GUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["GUSD_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["GUSD"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["HUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["HUSD_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["HUSD"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["USDK_SWAP_POOL"]}`]: {
                lpToken: `${tokens["USDK_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["USDK"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["USDN_SWAP_POOL"]}`]: {
                lpToken: `${tokens["USDN_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["USDN"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["LINKUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["LINKUSD_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["LINKUSD"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["MUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["MUSD_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["MUSD"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["RSV_SWAP_POOL"]}`]: {
                lpToken: `${tokens["RSV_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["RSV"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["TBTC_SWAP_POOL"]}`]: {
                lpToken: `${tokens["TBTC_SBTC_CRV"]}`,
                underlyingTokens: [`${tokens["TBTC"]}`, `${tokens["CRV_REN_BTC_WBTC_SBTC"]}`, `${tokens[""]}`],
                hasRemoveLiquidityOneCoin: true
            },
            [`${swapPools["DUSD_SWAP_POOL"]}`]: {
                lpToken: `${tokens["DUSD_THREE_CRV"]}`,
                underlyingTokens: [`${tokens["DUSD"]}`, `${tokens["THREE_CRV"]}`],
                hasRemoveLiquidityOneCoin: true
            }
        }

        // get contract address

        // create contract instance

        console.log(taskArgs.address);
    })