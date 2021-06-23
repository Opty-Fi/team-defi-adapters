import { task, types } from "hardhat/config";
import { deployContract } from "../../helpers/helpers";
import { insertContractIntoDB } from "../../helpers/db";
import { TESTING_CONTRACTS } from "../../helpers/constants";
task("deploy-erc20", "Deploy ERC20")
  .addParam("name", "the name of token", "", types.string)
  .addParam("symbol", "the symbol of token", "", types.string)
  .addParam("total", "the totalSupply of token", 0, types.int)
  .addParam("decimal", "the decimal of token", 18, types.int)
  .addParam("deployedonce", "allow checking whether contracts were deployed previously", false, types.boolean)
  .addParam("insertindb", "allow inserting to database", false, types.boolean)
  .setAction(async ({ name, symbol, total, decimal, deployedonce, insertindb }, hre) => {
    const [owner] = await hre.ethers.getSigners();

    if (name === "") {
      throw new Error("name cannot be empty");
    }

    if (symbol === "") {
      throw new Error("symbol cannot be empty");
    }

    const erc20Contract = await deployContract(hre, TESTING_CONTRACTS.TEST_DUMMY_TOKEN, deployedonce, owner, [
      name,
      symbol,
      decimal,
      total,
    ]);

    console.log(`Contract ${name} token : ${erc20Contract.address}`);

    if (insertindb) {
      const err = await insertContractIntoDB(`symbol`, erc20Contract.address);
      if (err !== "") {
        console.log(err);
      }
    }
  });