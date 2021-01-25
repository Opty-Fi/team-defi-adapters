import { BigNumber, bigNumberify } from "ethers/utils";
import { Contract, ethers } from "ethers";
import exchange from "./exchange.json";
import addressAbis from "./AddressAbis.json";
import tokenAddresses from "./TokenAddresses.json";

const dotenv = require("dotenv");
dotenv.config();
const Pool = require("pg").Pool;
const fs = require("fs"); //    library to read/write to a particular file

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export function expandToTokenDecimals(n: number, exponent: number): ethers.BigNumber {
    // bigNumberify(n).mul(bigNumberify(10).pow(exponent)); -> ethers_V4.0.48 working code (kept until testing gets completed)
    return ethers.BigNumber.from(n).mul(
        ethers.BigNumber.from("10").pow(ethers.BigNumber.from(exponent))
    );
}

export async function fundWallet(
    tokenAddress: string,
    wallet: ethers.Wallet,
    FUND_AMOUNT: ethers.BigNumber
) {
    let amount = "0x" + Number(FUND_AMOUNT).toString(16);
    const uniswapInstance = new ethers.Contract(
        exchange.uniswap.address,
        exchange.uniswap.abi,
        wallet
    );
    if (tokenAddresses.weth.toLowerCase() == tokenAddress.toLowerCase()) {
        const wEthInstance = new ethers.Contract(
            exchange.weth.address,
            exchange.weth.abi,
            wallet
        );
        //  Funding user's wallet with WETH tokens
        await wEthInstance.deposit({ value: amount });
    } else if (tokenAddress.toLowerCase() == tokenAddresses["3crv"].toLowerCase()) {
        //  Funding user's wallet with DAI tokens
        let daiAmount = FUND_AMOUNT.add(expandToTokenDecimals(10, 18));
        await uniswapInstance.swapETHForExactTokens(
            daiAmount,
            [tokenAddresses.weth, tokenAddresses.dai],
            wallet.address,
            "1000000000000000000",
            { value: ethers.utils.hexlify(ethers.utils.parseEther("90")) }
        );

        // Instantiate DAI token contract
        let daiTokenContractInstance = new ethers.Contract(
            tokenAddresses.dai,
            addressAbis.erc20.abi,
            wallet
        );

        //  Approve Curve Swap contract for spending DAI on behalf of user
        let approve_amount = FUND_AMOUNT.add(expandToTokenDecimals(100000000, 18));
        await daiTokenContractInstance.approve(
            exchange.curveSwapContract.address,
            approve_amount
        );

        // Instantiate Curve Swap contract
        let curveSwapContractInstance = new ethers.Contract(
            exchange.curveSwapContract.address,
            <ethers.ContractInterface>exchange.curveSwapContract.abi,
            wallet
        );

        //  Funding wallet with 3Crv tokens
        var overrideOptions = { gasLimit: ethers.utils.hexlify(468201) };
        let mint_amount = FUND_AMOUNT.add(expandToTokenDecimals(1, 18));
        let zero_number = expandToTokenDecimals(0, 18);
        await curveSwapContractInstance.add_liquidity(
            [mint_amount, zero_number, zero_number],
            zero_number,
            overrideOptions
        );

        // Instantiate 3Crv ERC20 token contract
        let erc20TokenContractInstance = new ethers.Contract(
            tokenAddresses["3crv"],
            addressAbis.erc20.abi,
            wallet
        );

        let users3CrvBalance = await erc20TokenContractInstance.balanceOf(
            wallet.address
        );

        // Make the user's wallet balance equals to the TEST_AMOUNT
        await curveSwapContractInstance.remove_liquidity(users3CrvBalance.sub(amount), [
            0,
            0,
            0,
        ]);
    } else {
        // console.log("FUND WALLET WITH TOKENS EXCEPT WETH")
        await uniswapInstance.swapETHForExactTokens(
            amount,
            [tokenAddresses.weth, tokenAddress],
            wallet.address,
            "1000000000000000000",
            {
                value: ethers.utils.hexlify(ethers.utils.parseEther("9500")),
                gasLimit: 4590162,
            }
        );
    }
}

export async function insertGasUsedRecordsIntoDB(
    dateAndTime: number,
    tokenSymbol: string,
    strategyName: string,
    setStrategyGasUsed: number,
    scoreStrategyGasUsed: number,
    setAndScoreStrategyGasUsed: number,
    userDepositRebalanceTxGasUsed: number,
    userWithdrawRebalanceTxGasUsed: number,
    runTimeVersion: string
): Promise<number> {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await pool.query(
                `INSERT INTO public."gasRecords" VALUES (${dateAndTime},'${tokenSymbol}','${strategyName}',${setStrategyGasUsed},${scoreStrategyGasUsed},${setAndScoreStrategyGasUsed},${userDepositRebalanceTxGasUsed},${userWithdrawRebalanceTxGasUsed},'${runTimeVersion}')`
            );
            resolve(res.rowCount);
        } catch (error) {
            reject(`Got error: ${error}`);
        }
    });
}

//  function to write the data(token holders addresses) in a file(scrapedData.json)
export async function writeInFile(fileName: string, data: any) {
    await fs.writeFile(fileName, JSON.stringify(data), "utf8", function (err: any) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log(fileName, " file has been saved. --Write-1");
    });
}

export async function appendInFile(fileName: string, data: any) {
    await fs.appendFileSync(fileName, JSON.stringify(","), "utf8", function (err: any) {
        if (err) {
            console.log("An error occured while appending JSON Object to File.");
            return console.log(err);
        }
        console.log(fileName, " file has been saved.-- Append-1");
    });
    await fs.appendFileSync(fileName, JSON.stringify(data), "utf8", function (
        err: any
    ) {
        if (err) {
            console.log("An error occured while appending JSON Object to File.");
            return console.log(err);
        }
        console.log(fileName, " file has been saved.-- Append-2");
    });
    console.log("last STEP..");
    await formatFile(fileName);
}

async function formatFile(fileName: string) {
    await fs.readFile(fileName, "utf8", async function (err: any, data: string) {
        // console.log("ENTERED loop-3")
        if (err) {
            return console.log(err);
        }
        // console.log("Data: ", data)
        var result = data.replace(/}","{/g, ",");
        var final_data = JSON.parse(result);
        // console.log("Result: ", final_data)
        // console.log("loop-4")
        await writeInFile(fileName, final_data);
    });
}
