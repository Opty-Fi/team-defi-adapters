import { expect, assert } from "chai";
import hre from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import { setUp } from "./setup";
import { CONTRACTS } from "../../helpers/type";
import { TOKENS, TESTING_CONTRACTS, TESTING_DEPLOYMENT_ONCE } from "../../helpers/constants";
import { TypedAdapterStrategies } from "../../helpers/data";
import { getSoliditySHA3Hash } from "../../helpers/utils";
import { ESSENTIAL_CONTRACTS } from "../../helpers/constants";
import { deployContract, executeFunc } from "../../helpers/helpers";
import { deployVault } from "../../helpers/contracts-deployments";
import {
  setBestBasicStrategy,
  approveLiquidityPoolAndMapAdapter,
  fundWalletToken,
  getBlockTimestamp,
  getTokenName,
  getTokenSymbol,
} from "../../helpers/contracts-actions";
import scenario from "./scenarios/opty-minter.json";
type ARGUMENTS = {
  contractName?: string;
  amount?: string;
  index?: number;
  rate?: string;
};
describe(scenario.title, () => {
  const token = "DAI";
  const tokenAddr = TOKENS["DAI"];
  const MAX_AMOUNT = "1000000000000000000000";
  let essentialContracts: CONTRACTS;
  let adapters: CONTRACTS;
  const contracts: CONTRACTS = {};
  let Vault: Contract;
  let users: { [key: string]: Signer };
  const tokensHash = getSoliditySHA3Hash(["address[]"], [[tokenAddr]]);
  const TOKEN_STRATEGY = TypedAdapterStrategies["CompoundAdapter"][0];
  before(async () => {
    try {
      const [owner, admin] = await hre.ethers.getSigners();
      users = { owner, admin };
      [essentialContracts, adapters] = await setUp(users["owner"]);
      await approveLiquidityPoolAndMapAdapter(
        users["owner"],
        essentialContracts.registry,
        adapters["CompoundAdapter"].address,
        TOKEN_STRATEGY.strategy[0].contract,
      );
      await setBestBasicStrategy(
        TOKEN_STRATEGY.strategy,
        tokensHash,
        essentialContracts.registry,
        essentialContracts.strategyProvider,
        "RP1",
      );
      const timestamp = (await getBlockTimestamp(hre)) * 2;
      await fundWalletToken(hre, tokenAddr, users["owner"], BigNumber.from(MAX_AMOUNT), timestamp);
      assert.isDefined(essentialContracts, "Essential contracts not deployed");
      assert.isDefined(adapters, "Adapters not deployed");
    } catch (error) {
      console.log(error);
    }
  });
  beforeEach(async () => {
    const underlyingTokenName = await getTokenName(hre, token);
    const underlyingTokenSymbol = await getTokenSymbol(hre, token);
    const opty = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY, false, users["owner"], [
      essentialContracts["registry"].address,
      0,
    ]);

    const optyMinter = await deployContract(hre, ESSENTIAL_CONTRACTS.OPTY_MINTER, false, users["owner"], [
      essentialContracts["registry"].address,
      opty.address,
    ]);

    Vault = await deployVault(
      hre,
      essentialContracts.registry.address,
      essentialContracts.riskManager.address,
      essentialContracts.strategyManager.address,
      optyMinter.address,
      tokenAddr,
      users["owner"],
      users["admin"],
      underlyingTokenName,
      underlyingTokenSymbol,
      "RP1",
      TESTING_DEPLOYMENT_ONCE,
    );

    const ERC20Instance = await hre.ethers.getContractAt("ERC20", tokenAddr);

    contracts["optyMinter"] = optyMinter;

    contracts["vault"] = Vault;

    contracts["erc20"] = ERC20Instance;
  });
  for (let i = 0; i < scenario.stories.length; i++) {
    const story = scenario.stories[i];
    it(story.description, async () => {
      for (let i = 0; i < story.setActions.length; i++) {
        const action = story.setActions[i];
        switch (action.action) {
          case "addOptyVault(address)": {
            const { contractName }: ARGUMENTS = action.args;
            if (contractName) {
              if (action.expect === "success") {
                await executeFunc(contracts[action.contract], users[action.executer], action.action, [
                  contracts[contractName].address,
                ]);
              } else {
                await expect(
                  executeFunc(contracts[action.contract], users[action.executer], action.action, [
                    contracts[contractName].address,
                  ]),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(contractName, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setOptyVault(address,bool)": {
            const { contractName }: ARGUMENTS = action.args;
            if (contractName) {
              if (action.expect === "success") {
                await executeFunc(contracts[action.contract], users[action.executer], action.action, [
                  contracts[contractName].address,
                  true,
                ]);
              } else {
                await expect(
                  executeFunc(contracts[action.contract], users[action.executer], action.action, [
                    contracts[contractName].address,
                    true,
                  ]),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(contractName, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "setOptyVaultRate(address,uint256)": {
            const { contractName, rate }: ARGUMENTS = action.args;
            if (contractName && rate) {
              if (action.expect === "success") {
                await executeFunc(contracts[action.contract], users[action.executer], action.action, [
                  contracts[contractName].address,
                  rate,
                ]);
              } else {
                await expect(
                  executeFunc(contracts[action.contract], users[action.executer], action.action, [
                    contracts[contractName].address,
                    rate,
                  ]),
                ).to.be.revertedWith(action.message);
              }
            }
            assert.isDefined(contractName, `args is wrong in ${action.action} testcase`);
            assert.isDefined(rate, `args is wrong in ${action.action} testcase`);

            break;
          }
          case "approve(address,uint256)": {
            const { amount }: ARGUMENTS = action.args;
            console.log(amount);
            if (action.expect === "success") {
              await executeFunc(contracts[action.contract], users[action.executer], action.action, [
                contracts["vault"].address,
                amount ? amount : "0",
              ]);
            } else {
              await expect(
                executeFunc(contracts[action.contract], users[action.executer], action.action, [
                  contracts["vault"].address,
                  amount ? amount : "0",
                ]),
              ).to.be.revertedWith(action.message);
            }
            break;
          }
          case "userDepositRebalance(uint256)": {
            const { amount }: ARGUMENTS = action.args;
            if (action.expect === "success") {
              await executeFunc(contracts[action.contract], users[action.executer], action.action, [
                amount ? amount : "0",
              ]);
              const address = await users[action.executer].getAddress();
              const thousandDays = 100000;
              await hre.network.provider.request({
                method: "evm_increaseTime",
                params: [thousandDays],
              });
              const balance = await contracts["optyMinter"]
                .connect(users[action.executer])
                ["claimableOpty(address)"](address);
              console.log(balance);
            } else {
              await expect(
                contracts[action.contract].connect(users[action.executer])[action.action](amount ? amount : "0"),
              ).to.be.revertedWith(action.message);
            }
            break;
          }
        }
      }
      for (let i = 0; i < story.getActions.length; i++) {
        const action = story.getActions[i];
        switch (action.action) {
          case "allOptyVaults(uint256)": {
            const { index }: ARGUMENTS = action.args;
            if (index) {
              const value = await contracts[action.contract][action.action](index);
              expect(value).to.be.equal(contracts[action.expectedValue.toString()].address);
            }
            assert.isDefined(index, `args is wrong in ${action.action} testcase`);

            break;
          }
          case "optyVaultEnabled(address)": {
            const { contractName }: ARGUMENTS = action.args;
            if (contractName) {
              const value = await contracts[action.contract][action.action](contracts[contractName].address);
              expect(value).to.be.equal(action.expectedValue);
            }
            assert.isDefined(contractName, `args is wrong in ${action.action} testcase`);
            break;
          }
          case "optyVaultRatePerSecond(address)": {
            const { contractName }: ARGUMENTS = action.args;
            if (contractName) {
              const value = await contracts[action.contract][action.action](contracts[contractName].address);
              expect(value).to.be.equal(action.expectedValue);
            }
            assert.isDefined(contractName, `args is wrong in ${action.action} testcase`);
            break;
          }
        }
      }
    }).timeout(100000);
  }
});
