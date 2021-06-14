import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber, utils } from "ethers";
import { CONTRACTS } from "../../../helpers/type";
import { TOKENS, TESTING_DEPLOYMENT_ONCE, ZERO_ADDRESS } from "../../../helpers/constants";
import { TypedAdapterStrategies } from "../../../helpers/data";
import { deployAdapter, deployEssentialContracts } from "../../../helpers/contracts-deployments";
import {
  approveTokens,
  fundWalletToken,
  getBlockTimestamp,
  insertDataCurveDeposit,
} from "../../../helpers/contracts-actions";
import scenarios from "../scenarios/adapters.json";

type ARGUMENTS = {
  amount?: { [key: string]: string };
};

describe("CurvePoolAdapter", () => {
  const ADAPTER_NAME = "CurvePoolAdapter";
  const strategies = TypedAdapterStrategies[ADAPTER_NAME];
  const MAX_AMOUNT: { [key: string]: BigNumber } = {
    DAI: BigNumber.from("1000000000000000000000"),
    USDC: BigNumber.from("1000000000"),
  };
  let essentialContracts: CONTRACTS;
  let adapter: Contract;
  let ownerAddress: string;
  let owner: Signer;
  before(async () => {
    try {
      [owner] = await hre.ethers.getSigners();
      ownerAddress = await owner.getAddress();
      essentialContracts = await deployEssentialContracts(hre, owner, TESTING_DEPLOYMENT_ONCE);
      await approveTokens(owner, essentialContracts["registry"]);
      adapter = await deployAdapter(
        hre,
        owner,
        ADAPTER_NAME,
        essentialContracts["registry"].address,
        essentialContracts["harvestCodeProvider"].address,
        essentialContracts["priceOracle"].address,
        TESTING_DEPLOYMENT_ONCE,
      );
      await insertDataCurveDeposit(owner, adapter);
      assert.isDefined(essentialContracts, "Essential contracts not deployed");
      assert.isDefined(adapter, "Adapter not deployed");
    } catch (error) {
      console.log(error);
    }
  });

  for (let i = 0; i < strategies.length; i++) {
    describe(`${strategies[i].strategyName}`, async () => {
      const strategy = strategies[i];
      let lpToken: string;
      let nCoins: string[];
      const depositAmount: string[] = [];
      before(async () => {
        try {
          const timestamp = (await getBlockTimestamp(hre)) * 2;
          nCoins = await adapter.getUnderlyingTokens(strategy.strategy[0].contract, ZERO_ADDRESS);
          for (let i = 0; i < nCoins.length; i++) {
            if (nCoins[i] === TOKENS["DAI"]) {
              await fundWalletToken(hre, nCoins[i], owner, MAX_AMOUNT["DAI"], timestamp);
              depositAmount.push(MAX_AMOUNT["DAI"].div(BigNumber.from("2")).toString());
            } else if (nCoins[i] === TOKENS["USDC"]) {
              await fundWalletToken(hre, nCoins[i], owner, MAX_AMOUNT["USDC"], timestamp);
              depositAmount.push(MAX_AMOUNT["USDC"].div(BigNumber.from("2")).toString());
            }
          }
          lpToken = await adapter.getLiquidityPoolToken(ZERO_ADDRESS, strategy.strategy[0].contract);
        } catch (error) {
          console.error(error);
        }
      });

      for (let i = 0; i < scenarios.stories.length; i++) {
        it(scenarios.stories[i].description, async () => {
          const story = scenarios.stories[i];
          for (let i = 0; i < story.actions.length; i++) {
            const action = story.actions[i];
            switch (action.action) {
              case "getDepositSomeCodes(address,address[],address,uint256[])":
              case "getDepositAllCodes(address,address[],address)": {
                let codes;
                if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await adapter[action.action](
                      ZERO_ADDRESS,
                      [ZERO_ADDRESS],
                      strategy.strategy[0].contract,
                      depositAmount,
                    );
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, [ZERO_ADDRESS], strategy.strategy[0].contract);
                }
                if (codes.length > 0) {
                  for (let i = 0; i < codes.length - 1; i = i + 2) {
                    const tokenIndex = i / 2;
                    if (parseInt(depositAmount[tokenIndex]) > 0) {
                      const inter = new utils.Interface(["function approve(address,uint256)"]);
                      const checkApproval = (code: string, amount: string) => {
                        if (code !== "0x") {
                          const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], code);
                          expect(address).to.equal(nCoins[tokenIndex]);
                          const value = inter.decodeFunctionData("approve", abiCode);
                          expect(value[0]).to.equal(strategy.strategy[0].contract);
                          if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                            expect(value[1]).to.equal(amount);
                          }
                        }
                      };
                      checkApproval(codes[i], "0");
                      checkApproval(codes[i + 1], depositAmount[tokenIndex]);
                    }
                  }
                  const inter = new utils.Interface([`function add_liquidity(uint256[${nCoins.length}],uint256)`]);
                  const [address, abiCode] = utils.defaultAbiCoder.decode(
                    ["address", "bytes"],
                    codes[codes.length - 1],
                  );
                  expect(address).to.equal(strategy.strategy[0].contract);
                  const value = inter.decodeFunctionData("add_liquidity", abiCode);
                  if (action.action === "getDepositSomeCodes(address,address[],address,uint256[])") {
                    expect(value[0].length).to.equal(depositAmount.length);
                    for (let i = 0; i < depositAmount.length; i++) {
                      expect(value[0][i]).to.equal(depositAmount[i]);
                    }
                  }
                  expect(value[1]).to.equal(0);
                }

                break;
              }
              case "getWithdrawAllCodes(address,address[],address)":
              case "getWithdrawSomeCodes(address,address[],address,uint256)": {
                let codes;
                const withdrawalAmount = BigNumber.from("1000000000");
                if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                  const { amount }: ARGUMENTS = action.args;
                  if (amount) {
                    codes = await adapter[action.action](
                      ZERO_ADDRESS,
                      nCoins,
                      strategy.strategy[0].contract,
                      withdrawalAmount,
                    );
                  }
                } else {
                  codes = await adapter[action.action](ownerAddress, nCoins, strategy.strategy[0].contract);
                }
                for (let i = 0; i < codes.length; i++) {
                  if (i < 2) {
                    const inter = new utils.Interface(["function approve(address,uint256)"]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(lpToken);
                    const value = inter.decodeFunctionData("approve", abiCode);
                    expect(value[0]).to.equal(strategy.strategy[0].contract);
                    if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                      expect(value[1]).to.equal(i == 0 ? 0 : withdrawalAmount);
                    }
                  } else {
                    const inter = new utils.Interface([`function remove_liquidity(uint256,uint256[${nCoins.length}])`]);
                    const [address, abiCode] = utils.defaultAbiCoder.decode(["address", "bytes"], codes[i]);
                    expect(address).to.equal(strategy.strategy[0].contract);
                    const value = inter.decodeFunctionData("remove_liquidity", abiCode);
                    if (action.action === "getWithdrawSomeCodes(address,address[],address,uint256)") {
                      expect(value[0]).to.equal(withdrawalAmount);
                    }
                  }
                }
                break;
              }
            }
          }
        }).timeout(150000);
      }
    });
  }
});
