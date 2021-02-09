import { Contract } from "ethers";

 //  Interface for storing the Abi's of CodeProvider Contracts
 export interface CodeProviderContract {
    [id: string]: any;
}

//  Interface for mapping the CodeProvider Contracts deployed with their variable name for using them in the code
export interface OptyCodeProviderContractVariables {
    [id: string]: Contract;
}

//  Interface for getting the pools, lpTokens and underlyingTokens corresponding to CodeProvider Contract
export interface DefiPools {
    [id: string]: {
        pool: string;
        lpToken: string;
        tokens: string[];
    };
}

// Interface to store the gasRecords only
export interface GasRecord {
    testScriptRunDateAndTime: number;
    strategyRunDateAndTime: number;
    strategyName: string;
    setStrategy: number;
    scoreStrategy: number;
    setAndScoreStrategy: number;
    userDepositRebalanceTx: number;
    userWithdrawRebalanceTx: number;
}

//  Interface for mapping the gasUsed records corresponding to underlying token
export interface GasUsedRecords {
    [id: string]: {
        GasRecords: GasRecord[];
    };
}