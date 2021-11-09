import hre from "hardhat";
import { Signer } from "ethers";
import { CONTRACTS } from "../../helpers/type";
import { deployEssentialContracts, deployAdapters } from "../../helpers/contracts-deployments";
import { TESTING_DEPLOYMENT_ONCE } from "../../helpers/constants/utils";

export async function setUp(owner: Signer): Promise<[CONTRACTS, CONTRACTS]> {
  const contracts = await deployEssentialContracts(hre, owner, TESTING_DEPLOYMENT_ONCE);

  const adapters = await deployAdapters(hre, owner, contracts.registry.address, TESTING_DEPLOYMENT_ONCE);
  return [contracts, adapters];
}
