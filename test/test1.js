const strategies = require("./sample.json");
const protocols = require("file1.json");
const protocolArtefacts = require("file2.json");

const pools = ["opDAIBsc","opDAIAdv", "opUSDCBsc"]

describe("", () => {
    const dai = strategies["dai"]["basic"];
    const liquidityProtocols = protocols["opDAIBsc"]
    poolIterator i = 0;
    beforeAll(() => {
        // deploy registry
        for (poolName in liquidityProtocols) {
            // get the pool proxy ABI for `poolName`
            // poolProxy = deploy the pool proxy
            // map protocolArtefacts[poolName]["dai"].pool => poolProxy
        }
        // set strategies
        // deploy risk manager
        // deploy strategy manager
    })

    beforeEach(()=>{
        // deploy opty pool contract pools[poolIterator]
        // poolIterator++
    })

    it("opDAIBsc-startegy1-userDeposit",()=>{
        // test the strategies -> userDeposit
    })

    it("opDAIBsc-startegy1-userWithdraw",()=>{
        // test the strategies -> userDeposit
    })

    it("opUSDCAdv",()=>{
        // test the strategies -> userDeposit, userWithdraw etc
    })
})
