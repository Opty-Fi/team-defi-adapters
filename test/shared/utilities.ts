import {
  BigNumber,
  bigNumberify,
} from 'ethers/utils'

export function expandTo18Decimals(n: number): BigNumber {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}
