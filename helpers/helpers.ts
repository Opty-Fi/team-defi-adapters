import { Contract, Signer, ContractFactory, utils, BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { STRATEGY_DATA } from "./type";
import { getSoliditySHA3Hash, capitalizeFirstLetter } from "./utils";
import { getAddress } from "ethers/lib/utils";
import { TypedTokens } from "./data";

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  isDeployedOnce: boolean,
  owner: Signer,
  args: any[],
): Promise<Contract> {
  let contract: Contract;
  if (isDeployedOnce) {
    const ownerAddr = await owner.getAddress();
    contract = await _deployContractOnce(hre, contractName, args, ownerAddr);
  } else {
    const factory = await hre.ethers.getContractFactory(contractName);
    contract = await _deployContract(factory, args, owner);
  }
  return contract;
}

async function _deployContract(contractFactory: ContractFactory, args: any[], owner?: Signer): Promise<Contract> {
  let contract: Contract;
  if (owner) {
    contract = await contractFactory.connect(owner).deploy(...args);
  } else {
    contract = await contractFactory.deploy(...args);
  }
  await contract.deployTransaction.wait();
  return contract;
}

async function _deployContractOnce(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  args: any[],
  owner: string,
): Promise<Contract> {
  const result = await hre.deployments.deploy(contractName, {
    from: owner,
    args: args,
  });
  const contract = await hre.ethers.getContractAt(result.abi, result.address);
  return contract;
}

export async function executeFunc(contract: Contract, executer: Signer, funcAbi: string, args: any[]): Promise<void> {
  const tx = await contract.connect(executer)[funcAbi](...args);
  await tx.wait();
  return tx;
}

export async function getExistingContractAddress(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
): Promise<string> {
  let address;
  try {
    const deployedContract = await hre.deployments.get(contractName);
    address = deployedContract.address;
  } catch (error) {
    address = "";
  }
  return address;
}

export async function getContractInstance(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  contractAddress: string,
): Promise<Contract> {
  const contract = await hre.ethers.getContractAt(contractName, contractAddress);
  return contract;
}

export function generateStrategyHash(strategy: STRATEGY_DATA[], tokenAddress: string): string {
  const strategyStepsHash: string[] = [];
  const tokensHash = generateTokenHash([tokenAddress]);
  for (let index = 0; index < strategy.length; index++) {
    strategyStepsHash[index] = getSoliditySHA3Hash(
      ["address", "address", "bool"],
      [strategy[index].contract, strategy[index].outputToken, strategy[index].isBorrow],
    );
  }
  return getSoliditySHA3Hash(["bytes32", "bytes32[]"], [tokensHash, strategyStepsHash]);
}

export function generateStrategyStep(strategy: STRATEGY_DATA[]): [string, string, boolean][] {
  const strategySteps: [string, string, boolean][] = [];
  for (let index = 0; index < strategy.length; index++) {
    const tempArr: [string, string, boolean] = [
      strategy[index].contract,
      strategy[index].outputToken,
      strategy[index].isBorrow,
    ];
    strategySteps.push(tempArr);
  }
  return strategySteps;
}

export function isAddress(address: string): boolean {
  return utils.isAddress(address);
}

export async function moveToNextBlock(hre: HardhatRuntimeEnvironment): Promise<void> {
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const block = await hre.ethers.provider.getBlock(blockNumber);
  await hre.network.provider.send("evm_setNextBlockTimestamp", [block.timestamp + 1]);
  await hre.network.provider.send("evm_mine");
}

export function getDefaultFundAmount(underlyingTokenAddress: string): BigNumber {
  let defaultFundAmount: BigNumber = BigNumber.from("20000");
  defaultFundAmount =
    underlyingTokenAddress == getAddress(TypedTokens.WBTC) ||
    underlyingTokenAddress == getAddress(TypedTokens.COMP) ||
    underlyingTokenAddress == getAddress(TypedTokens.SAI) ||
    underlyingTokenAddress == getAddress(TypedTokens.REP) ||
    underlyingTokenAddress == getAddress(TypedTokens.ETH) ||
    underlyingTokenAddress == getAddress(TypedTokens.WETH) ||
    underlyingTokenAddress == getAddress(TypedTokens.DUSD) ||
    underlyingTokenAddress == getAddress(TypedTokens.HUSD) ||
    underlyingTokenAddress == getAddress(TypedTokens.MUSD) ||
    underlyingTokenAddress == getAddress(TypedTokens.BUSD) ||
    underlyingTokenAddress == getAddress(TypedTokens.RSV) ||
    underlyingTokenAddress == getAddress(TypedTokens.REN_BTC) ||
    underlyingTokenAddress == getAddress(TypedTokens.TBTC)
      ? BigNumber.from("200")
      : defaultFundAmount;
  defaultFundAmount =
    underlyingTokenAddress == getAddress(TypedTokens.REN_BTC) || underlyingTokenAddress == getAddress(TypedTokens.TBTC)
      ? BigNumber.from("2")
      : defaultFundAmount;
  return defaultFundAmount;
}

export function getEthValueGasOverrideOptions(
  hre: HardhatRuntimeEnvironment,
  parseEthAmount: string,
): { value: any; gasLimit: number } {
  const ETH_VALUE_GAS_OVERRIDE_OPTIONS = {
    value: hre.ethers.utils.hexlify(hre.ethers.utils.parseEther(parseEthAmount)),
    gasLimit: 6721975,
  };
  return ETH_VALUE_GAS_OVERRIDE_OPTIONS;
}

//  function to generate the token/list of tokens's hash
export function generateTokenHash(addresses: string[]): string {
  return getSoliditySHA3Hash(["address[]"], [addresses]);
}

export function retrieveAdapterFromStrategyName(strategyName: string): string[] {
  // strategyName should follow format TOKEN-DEPOSIT-STRATEGY-TOKEN
  // For Ex: DAI-deposit-COMPOUND-cDAI
  const strategyStep = strategyName.split("-deposit-");
  const adapterNames: string[] = [];
  console.log(strategyStep);
  for (let i = 1; i < strategyStep.length; i++) {
    const strategySymbol = strategyStep[i].split("-");
    console.log(strategySymbol);
    let adapterName;
    if (strategySymbol[0] === "AAVE") {
      adapterName = "AaveV1";
    } else if (strategySymbol[0] === "AAVE_V2") {
      adapterName = "AaveV2";
    } else if (strategySymbol[0] === "CURVE") {
      adapterName = strategySymbol[1] === "3Crv" ? "CurveSwapPool" : "CurveDepositPool";
    } else {
      adapterName = capitalizeFirstLetter(strategySymbol[0].toLowerCase());
    }
    if (adapterName) {
      adapterNames.push(`${adapterName}Adapter`);
    }
  }
  return adapterNames;
}
