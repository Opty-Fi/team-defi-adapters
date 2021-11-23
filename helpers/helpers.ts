import { Contract, Signer, ContractFactory, utils, BigNumber, BigNumberish } from "ethers";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import { to_10powNumber_BN } from "./utils";
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
  const contractArtifact: Artifact = await hre.artifacts.readArtifact(contractName);
  return hre.waffle.deployContract(await hre.ethers.getSigner(owner), contractArtifact, args);
}

export async function executeFunc(contract: Contract, executer: Signer, funcAbi: string, args: any[]): Promise<void> {
  const tx = await contract.connect(executer)[funcAbi](...args);
  await tx.wait();
  return tx;
}

export function isAddress(address: string): boolean {
  return utils.isAddress(address);
}

export async function moveToNextBlock(hre: HardhatRuntimeEnvironment): Promise<void> {
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const block = await hre.ethers.provider.getBlock(blockNumber);
  await moveToSpecificBlock(hre, block.timestamp);
}

export async function moveToSpecificBlock(hre: HardhatRuntimeEnvironment, timestamp: number): Promise<void> {
  await hre.network.provider.send("evm_setNextBlockTimestamp", [timestamp + 1]);
  await hre.network.provider.send("evm_mine");
}

export function getDefaultFundAmountInDecimal(underlyingTokenAddress: string, decimal: BigNumberish): BigNumber {
  let defaultFundAmount: BigNumber;
  switch (getAddress(underlyingTokenAddress)) {
    case getAddress(TypedTokens.BAL):
    case getAddress(TypedTokens.COMP):
    case getAddress(TypedTokens.SAI):
    case getAddress(TypedTokens.REP):
    case getAddress(TypedTokens.TUSD):
    case getAddress(TypedTokens.USDN):
    case getAddress(TypedTokens.ETH):
    case getAddress(TypedTokens.WETH):
    case getAddress(TypedTokens.DUSD):
    case getAddress(TypedTokens.HUSD):
    case getAddress(TypedTokens.MUSD):
    case getAddress(TypedTokens.BUSD):
    case getAddress(TypedTokens.RSV):
    case getAddress(TypedTokens.YCRV):
    case getAddress(TypedTokens.ESD):
    case getAddress(TypedTokens.THREE_CRV):
    case getAddress(TypedTokens.LINK):
    case getAddress(TypedTokens.USDP): {
      defaultFundAmount = BigNumber.from("20").mul(to_10powNumber_BN(decimal));
      break;
    }
    case getAddress(TypedTokens.REN_BTC):
    case getAddress(TypedTokens.TBTC):
    case getAddress(TypedTokens.WBTC):
    case getAddress(TypedTokens.YFI):
    case getAddress(TypedTokens.CREAM):
    case getAddress(TypedTokens.WNXM):
    case getAddress(TypedTokens.BBTC):
    case getAddress(TypedTokens.BOND):
    case getAddress(TypedTokens.KP3R):
    case getAddress(TypedTokens.FTT):
    case getAddress(TypedTokens.SWAG):
    case getAddress(TypedTokens.COVER):
    case getAddress(TypedTokens.IBBTC):
    case getAddress(TypedTokens.PBTC):
    case getAddress(TypedTokens.SUSHI):
    case getAddress(TypedTokens.SETH):
    case getAddress(TypedTokens.STETH):
    case getAddress(TypedTokens.RETH):
    case getAddress(TypedTokens.CRV): {
      defaultFundAmount = BigNumber.from("2").mul(to_10powNumber_BN(decimal));
      break;
    }
    case getAddress(TypedTokens.HBTC):
    case getAddress(TypedTokens.CRV_REN_BTC_WBTC_SBTC): {
      defaultFundAmount = BigNumber.from("2").mul(to_10powNumber_BN(+decimal.toString() - 1));
      break;
    }
    case getAddress(TypedTokens.YWETH):
    case getAddress(TypedTokens.CRETH2): {
      defaultFundAmount = BigNumber.from("2").mul(to_10powNumber_BN(+decimal.toString() - 2));
      break;
    }
    case getAddress(TypedTokens.OBTC):
    case getAddress(TypedTokens.SBTC): {
      defaultFundAmount = BigNumber.from("2").mul(to_10powNumber_BN(+decimal.toString() - 3));
      break;
    }

    case getAddress(TypedTokens.UNI_V2_WBTC_ETH):
    case getAddress(TypedTokens.UNI_V2_ETH_USDT):
    case getAddress(TypedTokens.UNI_V2_USDC_ETH):
    case getAddress(TypedTokens.UNI_V2_DAI_ETH):
    case getAddress(TypedTokens.BBADGER):
    case getAddress(TypedTokens.HFIL): {
      defaultFundAmount = BigNumber.from("2").mul(to_10powNumber_BN(+decimal.toString() - 8));
      break;
    }

    default:
      defaultFundAmount = BigNumber.from("200").mul(to_10powNumber_BN(decimal));
  }
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
