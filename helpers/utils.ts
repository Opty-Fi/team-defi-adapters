import abi from "ethereumjs-abi";
import { BigNumber, BigNumberish } from "ethers";

// function to get the equivalent hash (as generated by the solidity) of data passed in args
export function getSoliditySHA3Hash(argTypes: string[], args: any[]): string {
  const soliditySHA3Hash = "0x" + abi.soliditySHA3(argTypes, args).toString("hex");
  return soliditySHA3Hash;
}

export function amountInHex(fundAmount: BigNumber): string {
  const amount: string = "0x" + Number(fundAmount).toString(16);
  return amount;
}

export function delay(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function removeDuplicateFromStringArray(list: string[]): string[] {
  return list.filter((x, i, a) => a.indexOf(x) == i);
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function to_10powNumber_BN(decimals: BigNumberish): BigNumber {
  return BigNumber.from(10).pow(decimals);
}
