import { expect } from "chai";
import hre from "hardhat";
import { Signer, Contract, BigNumber } from "ethers";
import { CONTRACTS } from "../../helpers/type";
import { deployRegistry } from "../../helpers/contracts-deployments";
import { deployContract } from "../../helpers/helpers";
import { TESTING_DEPLOYMENT_ONCE, ESSENTIAL_CONTRACTS, UPGRADABLE_CONTRACTS } from "../../helpers/constants";
import scenario from "./scenarios/contract-upgradability.json";

describe(scenario.title, () => {
  const contracts: CONTRACTS = {};
  let users: { [key: string]: Signer };
  for (let i = 0; i < UPGRADABLE_CONTRACTS.length; i++) {
    const testingContract = UPGRADABLE_CONTRACTS[i];
    let wasInitData = false;
    describe(testingContract, () => {
      before(async () => {
        const [owner, user1, treasury] = await hre.ethers.getSigners();
        users = { owner, user1, treasury };
        if (testingContract !== ESSENTIAL_CONTRACTS.REGISTRY) {
          contracts["registry"] = await deployRegistry(hre, owner, TESTING_DEPLOYMENT_ONCE);
          contracts["proxy"] = await deployContract(hre, `${testingContract}Proxy`, TESTING_DEPLOYMENT_ONCE, owner, [
            contracts["registry"].address,
          ]);
        } else {
          contracts["proxy"] = await deployContract(hre, `${testingContract}Proxy`, TESTING_DEPLOYMENT_ONCE, owner, []);
        }
      });

      for (let i = 0; i < scenario.stories.length; i++) {
        const story = scenario.stories[i];
        it(story.description, async () => {
          for (let i = 0; i < story.actions.length; i++) {
            const action = story.actions[i];
            switch (action.action) {
              case "deployContract": {
                contracts["main"] = await deployContract(
                  hre,
                  testingContract,
                  TESTING_DEPLOYMENT_ONCE,
                  users[action.executor],
                  testingContract !== ESSENTIAL_CONTRACTS.REGISTRY ? [contracts["registry"].address] : [],
                );
                contracts["mainProxy"] = await hre.ethers.getContractAt(
                  testingContract,
                  contracts["proxy"].address,
                  users[action.executor],
                );

                break;
              }
              case "deployNewContract": {
                contracts["main"] = await deployContract(
                  hre,
                  `Test${testingContract}NewImplementation`,
                  TESTING_DEPLOYMENT_ONCE,
                  users[action.executor],
                  testingContract !== ESSENTIAL_CONTRACTS.REGISTRY ? [contracts["registry"].address] : [],
                );
                contracts["mainProxy"] = await hre.ethers.getContractAt(
                  `Test${testingContract}NewImplementation`,
                  contracts["proxy"].address,
                  users[action.executor],
                );
                break;
              }
              case "setPendingImplementation(address)": {
                if (action.expect === "success") {
                  await contracts[action.contract]
                    .connect(users[action.executor])
                    [action.action](contracts["main"].address);
                } else {
                  await expect(
                    contracts[action.contract]
                      .connect(users[action.executor])
                      [action.action](contracts["main"].address),
                  ).to.be.revertedWith(action.message);
                }
                break;
              }
              case "become(address)": {
                if (action.expect === "success") {
                  await contracts[action.contract]
                    .connect(users[action.executor])
                    [action.action](contracts["proxy"].address);
                } else {
                  if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                    await expect(
                      contracts[action.contract]
                        .connect(users[action.executor])
                        [action.action](contracts["proxy"].address),
                    ).to.be.revertedWith("!governance");
                  } else {
                    await expect(
                      contracts[action.contract]
                        .connect(users[action.executor])
                        [action.action](contracts["proxy"].address),
                    ).to.be.revertedWith("caller is not having governance");
                  }
                }
                break;
              }
              case "initMainContractData": {
                if (!wasInitData) {
                  if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                    await initDefaultData(contracts["mainProxy"], REGISTRY_TESTING_DEFAULT_DATA);
                  }
                  wasInitData = true;
                }
                break;
              }
              case "checkMainContractFunction": {
                if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                  await verifyDefaultData(contracts["mainProxy"], REGISTRY_TESTING_DEFAULT_DATA);
                }
                break;
              }
              case "checkTestingContractFunction": {
                expect(await contracts["mainProxy"].isNewContract()).to.be.eq(true);
                expect(await contracts["mainProxy"].isNewVariable()).to.be.eq(true);
                break;
              }
              case "verifyOldValue": {
                if (testingContract === ESSENTIAL_CONTRACTS.REGISTRY) {
                  await verifyDefaultData(contracts["mainProxy"], REGISTRY_TESTING_DEFAULT_DATA);
                }
                break;
              }
            }
          }
        });
      }
    });
  }
});

type TESTING_DEFAULT_DATA = {
  setFunction: string;
  input: any[];
  getFunction: {
    name: string;
    input: any[];
    output: any;
  }[];
};

const REGISTRY_TESTING_DEFAULT_DATA: TESTING_DEFAULT_DATA[] = [
  {
    setFunction: "setTreasury(address)",
    input: ["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"],
    getFunction: [
      {
        name: "treasury()",
        input: [],
        output: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
      },
    ],
  },
  {
    setFunction: "setVaultStepInvestStrategyDefinitionRegistry(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "vaultStepInvestStrategyDefinitionRegistry()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setAPROracle(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "aprOracle()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setStrategyProvider(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "strategyProvider()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setRiskManager(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "riskManager()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setHarvestCodeProvider(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "harvestCodeProvider()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setStrategyManager(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "strategyManager()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setOPTY(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "opty()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setPriceOracle(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "priceOracle()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setOPTYStakingRateBalancer(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "optyStakingRateBalancer()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setODEFIVaultBooster(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "odefiVaultBooster()",
        input: [],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "approveToken(address)",
    input: ["0x6b175474e89094c44da98b954eedeac495271d0f"],
    getFunction: [
      {
        name: "tokens(address)",
        input: ["0x6b175474e89094c44da98b954eedeac495271d0f"],
        output: true,
      },
    ],
  },
  {
    setFunction: "approveLiquidityPool(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "liquidityPools(address)",
        input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
        output: [0, true],
      },
    ],
  },
  {
    setFunction: "approveCreditPool(address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "creditPools(address)",
        input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
        output: [0, true],
      },
    ],
  },
  {
    setFunction: "setLiquidityPoolToAdapter(address,address)",
    input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643", "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
    getFunction: [
      {
        name: "liquidityPoolToAdapter(address)",
        input: ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"],
        output: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      },
    ],
  },
  {
    setFunction: "setTokensHashToTokens(address[])",
    input: [["0x6b175474e89094c44da98b954eedeac495271d0f"]],
    getFunction: [
      {
        name: "getTokensHashToTokenList(bytes32)",
        input: ["0x50440c05332207ba7b1bb0dcaf90d1864e3aa44dd98a51f88d0796a7623f0c80"],
        output: ["0x6B175474E89094C44Da98b954EedeAC495271d0F"],
      },
      {
        name: "getTokensHashByIndex(uint256)",
        input: ["0"],
        output: ["0x50440c05332207ba7b1bb0dcaf90d1864e3aa44dd98a51f88d0796a7623f0c80"],
      },
    ],
  },
  {
    setFunction: "addRiskProfile(string,bool,(uint8,uint8))",
    input: ["RP1", false, [0, 10]],
    getFunction: [
      {
        name: "riskProfilesArray(uint256)",
        input: ["0"],
        output: "RP1",
      },
    ],
  },
  {
    setFunction: "setUnderlyingAssetHashToRPToVaults(address[],string,address)",
    input: [["0x6b175474e89094c44da98b954eedeac495271d0f"], "RP1", "0x6b175474e89094c44da98b954eedeac495271d0f"],
    getFunction: [
      {
        name: "underlyingAssetHashToRPToVaults(bytes32,string)",
        input: ["0x50440c05332207ba7b1bb0dcaf90d1864e3aa44dd98a51f88d0796a7623f0c80", "RP1"],
        output: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      },
    ],
  },
  {
    setFunction: "setWithdrawalFee(address,uint256)",
    input: ["0x6b175474e89094c44da98b954eedeac495271d0f", 10],
    getFunction: [
      {
        name: "vaultToVaultConfiguration(address)",
        input: ["0x6b175474e89094c44da98b954eedeac495271d0f"],
        output: [false, false, BigNumber.from("10")],
      },
    ],
  },
];

async function initDefaultData(contract: Contract, data: TESTING_DEFAULT_DATA[]): Promise<void> {
  for (let i = 0; i < data.length; i++) {
    await contract[data[i].setFunction](...data[i].input);
  }
}

async function verifyDefaultData(contract: Contract, data: TESTING_DEFAULT_DATA[]): Promise<void> {
  for (let i = 0; i < data.length; i++) {
    const action = data[i];
    for (let i = 0; i < action.getFunction.length; i++) {
      const getFunction = action.getFunction[i];
      const value = await contract[getFunction.name](...getFunction.input);
      if (Array.isArray(getFunction.output)) {
        const objectValue: any[] = Object.values(value);
        const half_length = Math.ceil(objectValue.length / 2);
        const realValue = objectValue.splice(0, half_length);
        if (getFunction.name === "getTokensHashByIndex(uint256)") {
          console.log(objectValue.splice(0, half_length));
          expect(value.toString()).to.have.eq(getFunction.output[0]);
        } else if (getFunction.name === "vaultToVaultConfiguration(address)") {
          expect(realValue[0]).to.equal(getFunction.output[0]);
          expect(realValue[1]).to.equal(getFunction.output[1]);
          expect(+realValue[2]).to.equal(+getFunction.output[2]);
        } else {
          expect(realValue).to.have.members(getFunction.output);
        }
      } else {
        expect(value).to.be.eq(getFunction.output);
      }
    }
  }
}
