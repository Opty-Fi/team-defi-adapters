export default {
  SETUP: {
    NAME: "setup",
    DESCRIPTION: "Deploy Registry, HarvestCodeProvider and Adapter contracts and setup all necessary actions",
  },
  DEPLOYMENT_TASKS: {
    DEPLOY_ERC20: { NAME: "deploy-erc20", DESCRIPTION: "Deploy ERC20" },
    DEPLOY_ADAPTER: { NAME: "deploy-adapter", DESCRIPTION: "Deploy Adapter contract" },
    DEPLOY_ADAPTERS: { NAME: "deploy-adapters", DESCRIPTION: "Deploy Adapter contracts" },
    DEPLOY_HARVEST_CODE_PROVIDER: { NAME: "deploy-harvest-code-provider", DESCRIPTION: "Deploy Harvest Code Provider" },
    DEPLOY_INFRA: { NAME: "deploy-infra", DESCRIPTION: "Deploy infrastructure contracts" },
    DEPLOY_REGISTRY: { NAME: "deploy-registry", DESCRIPTION: "Deploy Registry" },
  },
  ACTION_TASKS: {
    SET_MAX_DEPOSIT_MODE: { NAME: "set-max-deposit-mode", DESCRIPTION: "Set max deposit mode for adapter" },
    SET_MAX_DEPOSIT: { NAME: "set-max-deposit", DESCRIPTION: "Set max deposit amount for adapter" },
    APPROVE_ERC20: { NAME: "approve-erc20", DESCRIPTION: "approve erc20 token" },
    BALANCE_OF: { NAME: "balance-of", DESCRIPTION: "Check token balance of address" },
    GET_ACTION: { NAME: "get-action", DESCRIPTION: "execute a get action in smart contract" },
    LIST_ACCOUNTS: { NAME: "list-accounts", DESCRIPTION: "Prints the list of accounts" },
  },
};
