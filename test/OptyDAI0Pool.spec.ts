import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { solidity, MockProvider } from 'ethereum-waffle'

import { expandTo18Decimals } from './shared/utilities'

chai.use(solidity)

const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)

describe('OptyDAI0Pool', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'beep beep beep beep beep beep beep beep beep beep beep beep',
    gasLimit: 9999999
  })
  const [wallet, other] = provider.getWallets()

  let token: Contract
  beforeEach(async () => {
    // deploy the contract
  })

  it('name, symbol, decimals, totalSupply, balanceOf', async () => {
    // test case for reading properties of pool token
  })
})