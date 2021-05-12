import { task } from 'hardhat/config';


task("insert-data-curvedepositpool", "Inserts ")
    .addParam("address", "The curvedepositpooladapter contract address")
    .setAction(async (taskArgs, localBRE) => {
        const tokens = require("../helpers/tokens");
        const curveDepositPools = require("../helpers/curve-deposit-pools");
        const curveDepositPoolGauges = require("../helpers/curve-deposit-pool-gauges");

        const liquidityPoolToUnderlyingTokens = {
            [`${curveDepositPools["COMPOUND_DEPOSIT_POOL"]}`]: [`${tokens["DAI"]}`, `${tokens["USDC"]}`],
            [`${curveDepositPools["USDT_DEPOSIT_POOL"]}`]: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["PAX_DEPOSIT_POOL"]}`]: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`, `${tokens["PAX"]}`],
            [`${curveDepositPools["Y_DEPOSIT_POOL"]}`]: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`, `${tokens["TUSD"]}`],
            [`${curveDepositPools["BUSD_DEPOSIT_POOL"]}`]: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`, `${tokens["BUSD"]}`],
            [`${curveDepositPools["SUSD_DEPOSIT_POOL"]}`]: [`${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`, `${tokens["SUSD"]}`],
            [`${curveDepositPools["GUSD_DEPOSIT_POOL"]}`]: [`${tokens["GUSD"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["HUSD_DEPOSIT_POOL"]}`]: [`${tokens["HUSD"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["USDK_DEPOSIT_POOL"]}`]: [`${tokens["USDK"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["USDN_DEPOSIT_POOL"]}`]: [`${tokens["USDN"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["LINKUSD_DEPOSIT_POOL"]}`]: [`${tokens["LINKUSD"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["MUSD_DEPOSIT_POOL"]}`]: [`${tokens["MUSD"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["RSV_DEPOSIT_POOL"]}`]: [`${tokens["RSV"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["TBTC_DEPOSIT_POOL"]}`]: [`${tokens["TBTC"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
            [`${curveDepositPools["DUSD_DEPOSIT_POOL"]}`]: [`${tokens["DUSD"]}`, `${tokens["DAI"]}`, `${tokens["USDC"]}`, `${tokens["USDT"]}`],
        }

        const liquidityPoolToGauges = {
            [`${curveDepositPools["COMPOUND_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["COMPOUND_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["USDT_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["USDT_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["PAX_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["PAX_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["Y_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["Y_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["BUSD_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["BUSD_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["SUSD_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["SUSD_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["GUSD_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["GUSD_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["HUSD_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["HUSD_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["USDK_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["USDK_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["USDN_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["USDN_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["MUSD_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["MUSD_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["RSV_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["RSV_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["TBTC_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["TBTC_DEPOSIT_POOL_GAUGE"]}`,
            [`${curveDepositPools["DUSD_DEPOSIT_POOL"]}`]: `${curveDepositPoolGauges["DUSD_DEPOSIT_POOL_GAUGE"]}`,
        }

        const CurvePoolCodeProvider = await localBRE.ethers.getContractFactory("CurvePoolCodeProvider");
        const instance = new localBRE.ethers.Contract(taskArgs.address, CurvePoolCodeProvider.interface, await localBRE.ethers.provider.getSigner());

        // underlying
        const tokens1 = liquidityPoolToUnderlyingTokens[curveDepositPools["COMPOUND_DEPOSIT_POOL"]];
        const tx1 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["COMPOUND_DEPOSIT_POOL"], tokens1);
        await tx1.wait();
        const lastToken1 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["COMPOUND_DEPOSIT_POOL"], tokens1.length - 1)
        console.log(`COMPOUND_DEPOSIT_POOL underlying token assertion result is ${lastToken1 == tokens1[tokens1.length - 1]}`);

        // gauge
        const gauge01 = liquidityPoolToGauges[curveDepositPools["COMPOUND_DEPOSIT_POOL"]];
        const tx01 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["COMPOUND_DEPOSIT_POOL"], gauge01)
        await tx01.wait();
        const gaugeResult01 = await instance.liquidityPoolToGauges(curveDepositPools["COMPOUND_DEPOSIT_POOL"])
        console.log(`COMPOUND_DEPOSIT_POOL gauge assertion result is ${gaugeResult01 == gauge01}`);

        // underlying
        const tokens2 = liquidityPoolToUnderlyingTokens[curveDepositPools["USDT_DEPOSIT_POOL"]]
        const tx2 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["USDT_DEPOSIT_POOL"], tokens2);
        await tx2.wait();
        const lastToken2 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["USDT_DEPOSIT_POOL"], tokens2.length - 1)
        console.log(`USDT_DEPOSIT_POOL underlying token assertion result is ${lastToken2 == tokens2[tokens2.length - 1]}`);

        //gauge
        const gauge02 = liquidityPoolToGauges[curveDepositPools["USDT_DEPOSIT_POOL"]];
        const tx02 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["USDT_DEPOSIT_POOL"], gauge02)
        await tx02.wait();
        const gaugeResult02 = await instance.liquidityPoolToGauges(curveDepositPools["USDT_DEPOSIT_POOL"])
        console.log(`USDT_DEPOSIT_POOL gauge assertion result is ${gaugeResult02 == gauge02}`);

        // underlying 
        const tokens3 = liquidityPoolToUnderlyingTokens[curveDepositPools["PAX_DEPOSIT_POOL"]]
        const tx3 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["PAX_DEPOSIT_POOL"], tokens3);
        await tx3.wait();
        const lastToken3 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["PAX_DEPOSIT_POOL"], tokens3.length - 1)
        console.log(`PAX_DEPOSIT_POOL underlying token assertion result is ${lastToken3 == tokens3[tokens3.length - 1]}`);

        // gauge
        const gauge03 = liquidityPoolToGauges[curveDepositPools["PAX_DEPOSIT_POOL"]];
        const tx03 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["PAX_DEPOSIT_POOL"], gauge03)
        await tx03.wait();
        const gaugeResult03 = await instance.liquidityPoolToGauges(curveDepositPools["PAX_DEPOSIT_POOL"])
        console.log(`PAX_DEPOSIT_POOL gauge assertion result is ${gaugeResult03 == gauge03}`);

        // underlying
        const tokens4 = liquidityPoolToUnderlyingTokens[curveDepositPools["Y_DEPOSIT_POOL"]]
        const tx4 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["Y_DEPOSIT_POOL"], tokens4);
        await tx4.wait();
        const lastToken4 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["Y_DEPOSIT_POOL"], tokens4.length - 1)
        console.log(`Y_DEPOSIT_POOL underlying token assertion result is ${lastToken4 == tokens4[tokens4.length - 1]}`);

        // gauge
        const gauge04 = liquidityPoolToGauges[curveDepositPools["Y_DEPOSIT_POOL"]];
        const tx04 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["Y_DEPOSIT_POOL"], gauge04)
        await tx04.wait();
        const gaugeResult04 = await instance.liquidityPoolToGauges(curveDepositPools["Y_DEPOSIT_POOL"])
        console.log(`Y_DEPOSIT_POOL gauge assertion result is ${gaugeResult04 == gauge04}`);

        // underlying
        const tokens5 = liquidityPoolToUnderlyingTokens[curveDepositPools["BUSD_DEPOSIT_POOL"]]
        const tx5 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["BUSD_DEPOSIT_POOL"], tokens5);
        await tx5.wait();
        const lastToken5 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["BUSD_DEPOSIT_POOL"], tokens5.length - 1)
        console.log(`BUSD_DEPOSIT_POOL underlying token assertion result is ${lastToken5 == tokens5[tokens5.length - 1]}`);

        // gauge
        const gauge05 = liquidityPoolToGauges[curveDepositPools["BUSD_DEPOSIT_POOL"]];
        const tx05 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["BUSD_DEPOSIT_POOL"], gauge05)
        await tx05.wait();
        const gaugeResult05 = await instance.liquidityPoolToGauges(curveDepositPools["BUSD_DEPOSIT_POOL"])
        console.log(`BUSD_DEPOSIT_POOL gauge assertion result is ${gaugeResult05 == gauge05}`);

        // underlying
        const tokens6 = liquidityPoolToUnderlyingTokens[curveDepositPools["SUSD_DEPOSIT_POOL"]]
        const tx6 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["SUSD_DEPOSIT_POOL"], tokens6);
        await tx6.wait();
        const lastToken6 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["SUSD_DEPOSIT_POOL"], tokens6.length - 1)
        console.log(`SUSD_DEPOSIT_POOL underlying token assertion result is ${lastToken6 == tokens6[tokens6.length - 1]}`);

        // gauge
        const gauge06 = liquidityPoolToGauges[curveDepositPools["SUSD_DEPOSIT_POOL"]]
        const tx06 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["SUSD_DEPOSIT_POOL"], gauge06)
        await tx06.wait();
        const gaugeResult06 = await instance.liquidityPoolToGauges(curveDepositPools["SUSD_DEPOSIT_POOL"])
        console.log(`SUSD_DEPOSIT_POOL gauge assertion result is ${gaugeResult06 == gauge06}`);

        // underlying
        const tokens7 = liquidityPoolToUnderlyingTokens[curveDepositPools["GUSD_DEPOSIT_POOL"]]
        const tx7 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["GUSD_DEPOSIT_POOL"], tokens7);
        await tx7.wait();
        const lastToken7 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["GUSD_DEPOSIT_POOL"], tokens7.length - 1)
        console.log(`GUSD_DEPOSIT_POOL underlying token assertion result is ${lastToken7 == tokens7[tokens7.length - 1]}`);

        // gauge
        const gauge07 = liquidityPoolToGauges[curveDepositPools["GUSD_DEPOSIT_POOL"]]
        const tx07 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["GUSD_DEPOSIT_POOL"], gauge07)
        await tx07.wait();
        const gaugeResult07 = await instance.liquidityPoolToGauges(curveDepositPools["GUSD_DEPOSIT_POOL"])
        console.log(`GUSD_DEPOSIT_POOL gauge assertion result is ${gaugeResult07 == gauge07}`);

        // underlying
        const tokens8 = liquidityPoolToUnderlyingTokens[curveDepositPools["HUSD_DEPOSIT_POOL"]]
        const tx8 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["HUSD_DEPOSIT_POOL"], tokens8);
        await tx8.wait();
        const lastToken8 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["HUSD_DEPOSIT_POOL"], tokens8.length - 1)
        console.log(`HUSD_DEPOSIT_POOL underlying token assertion result is ${lastToken8 == tokens8[tokens8.length - 1]}`);

        // gauge
        const gauge08 = liquidityPoolToGauges[curveDepositPools["HUSD_DEPOSIT_POOL"]];
        const tx08 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["HUSD_DEPOSIT_POOL"], gauge08)
        await tx08.wait();
        const gaugeResult08 = await instance.liquidityPoolToGauges(curveDepositPools["HUSD_DEPOSIT_POOL"])
        console.log(`HUSD_DEPOSIT_POOL gauge assertion result is ${gaugeResult08 == gauge08}`);

        // underlying
        const tokens9 = liquidityPoolToUnderlyingTokens[curveDepositPools["USDK_DEPOSIT_POOL"]]
        const tx9 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["USDK_DEPOSIT_POOL"], tokens9);
        await tx9.wait();
        const lastToken9 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["USDK_DEPOSIT_POOL"], tokens9.length - 1)
        console.log(`USDK_DEPOSIT_POOL underlying token assertion result is ${lastToken9 == tokens9[tokens9.length - 1]}`);

        // gauge
        const gauge09 = liquidityPoolToGauges[curveDepositPools["USDK_DEPOSIT_POOL"]]
        const tx09 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["USDK_DEPOSIT_POOL"], gauge09)
        await tx09.wait();
        const gaugeResult09 = await instance.liquidityPoolToGauges(curveDepositPools["USDK_DEPOSIT_POOL"])
        console.log(`USDK_DEPOSIT_POOL gauge assertion result is ${gaugeResult09 == gauge09}`);

        // underlying
        const tokens10 = liquidityPoolToUnderlyingTokens[curveDepositPools["USDN_DEPOSIT_POOL"]]
        const tx10 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["USDN_DEPOSIT_POOL"], tokens10);
        await tx10.wait();
        const lastToken10 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["USDN_DEPOSIT_POOL"], tokens10.length - 1)
        console.log(`USDN_DEPOSIT_POOL underlying token assertion result is ${lastToken10 == tokens10[tokens10.length - 1]}`);

        // gauge
        const gauge010 = liquidityPoolToGauges[curveDepositPools["USDN_DEPOSIT_POOL"]]
        const tx010 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["USDN_DEPOSIT_POOL"], gauge010)
        await tx010.wait();
        const gaugeResult010 = await instance.liquidityPoolToGauges(curveDepositPools["USDN_DEPOSIT_POOL"])
        console.log(`USDN_DEPOSIT_POOL gauge assertion result is ${gaugeResult010 == gauge010}`);

        // underlying
        const tokens11 = liquidityPoolToUnderlyingTokens[curveDepositPools["LINKUSD_DEPOSIT_POOL"]]
        const tx11 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["LINKUSD_DEPOSIT_POOL"], tokens11);
        await tx11.wait();
        const lastToken11 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["LINKUSD_DEPOSIT_POOL"], tokens11.length - 1)
        console.log(`LINKUSD_DEPOSIT_POOL underlying token assertion result is ${lastToken11 == tokens11[tokens11.length - 1]}`);

        // underlying
        const tokens12 = liquidityPoolToUnderlyingTokens[curveDepositPools["MUSD_DEPOSIT_POOL"]]
        const tx12 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["MUSD_DEPOSIT_POOL"], tokens12);
        await tx12.wait();
        const lastToken12 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["MUSD_DEPOSIT_POOL"], tokens12.length - 1)
        console.log(`COMPOUND_DEPOSIT_POOL underlying token assertion result is ${lastToken12 == tokens12[tokens12.length - 1]}`);

        // gauge
        const gauge012 = liquidityPoolToGauges[curveDepositPools["MUSD_DEPOSIT_POOL"]]
        const tx012 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["MUSD_DEPOSIT_POOL"], gauge012)
        await tx012.wait();
        const gaugeResult012 = await instance.liquidityPoolToGauges(curveDepositPools["MUSD_DEPOSIT_POOL"])
        console.log(`MUSD_DEPOSIT_POOL gauge assertion result is ${gaugeResult012 == gauge012}`);

        // underlying
        const tokens13 = liquidityPoolToUnderlyingTokens[curveDepositPools["RSV_DEPOSIT_POOL"]]
        const tx13 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["RSV_DEPOSIT_POOL"], tokens13);
        await tx13.wait();
        const lastToken13 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["RSV_DEPOSIT_POOL"], tokens13.length - 1)
        console.log(`RSV_DEPOSIT_POOL underlying token assertion result is ${lastToken13 == tokens13[tokens13.length - 1]}`);

        // gauge
        const gauge013 = liquidityPoolToGauges[curveDepositPools["RSV_DEPOSIT_POOL"]]
        const tx013 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["RSV_DEPOSIT_POOL"], gauge013)
        await tx013.wait();
        const gaugeResult013 = await instance.liquidityPoolToGauges(curveDepositPools["RSV_DEPOSIT_POOL"])
        console.log(`RSV_DEPOSIT_POOL gauge assertion result is ${gaugeResult013 == gauge013}`);

        // underlying
        const tokens14 = liquidityPoolToUnderlyingTokens[curveDepositPools["TBTC_DEPOSIT_POOL"]]
        const tx14 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["TBTC_DEPOSIT_POOL"], tokens14);
        await tx14.wait();
        const lastToken14 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["TBTC_DEPOSIT_POOL"], tokens14.length - 1)
        console.log(`TBTC_DEPOSIT_POOL underlying token assertion result is ${lastToken14 == tokens14[tokens14.length - 1]}`);

        // gauge
        const gauge014 = liquidityPoolToGauges[curveDepositPools["TBTC_DEPOSIT_POOL"]]
        const tx014 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["TBTC_DEPOSIT_POOL"], gauge014)
        await tx014.wait();
        const gaugeResult014 = await instance.liquidityPoolToGauges(curveDepositPools["TBTC_DEPOSIT_POOL"])
        console.log(`TBTC_DEPOSIT_POOL gauge assertion result is ${gaugeResult014 == gauge014}`);

        // underlying
        const tokens15 = liquidityPoolToUnderlyingTokens[curveDepositPools["DUSD_DEPOSIT_POOL"]]
        const tx15 = await instance.setLiquidityPoolToUnderlyingTokens(curveDepositPools["DUSD_DEPOSIT_POOL"], tokens15);
        await tx15.wait();
        const lastToken15 = await instance.liquidityPoolToUnderlyingTokens(curveDepositPools["DUSD_DEPOSIT_POOL"], tokens15.length - 1)
        console.log(`DUSD_DEPOSIT_POOL underlying token assertion result is ${lastToken15 == tokens15[tokens15.length - 1]}`);

        // gauge
        const gauge015 = liquidityPoolToGauges[curveDepositPools["DUSD_DEPOSIT_POOL"]]
        const tx015 = await instance.setLiquiidtyPoolToGauges(curveDepositPools["DUSD_DEPOSIT_POOL"], gauge015)
        await tx015.wait();
        const gaugeResult015 = await instance.liquidityPoolToGauges(curveDepositPools["DUSD_DEPOSIT_POOL"])
        console.log(`DUSD_DEPOSIT_POOL gauge assertion result is ${gaugeResult015 == gauge015}`);
    })