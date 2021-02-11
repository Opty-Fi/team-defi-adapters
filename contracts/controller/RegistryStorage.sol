// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

contract RegistryAdminStorage {
    /**
    * @notice Governance of optyfi's earn protocol
    */
    address public governance;
    
    /**
    * @notice Operator of optyfi's earn protocol
    */
    address public operator;
    
    /**
    * @notice Strategist for this contract
    */
    address public strategist;
    
    /**
    * @notice Minter for OPTY token
    */
    address public minter;

    /**
    * @notice Pending governance for optyfi's earn protocol
    */
    address public pendingGovernance;

    /**
    * @notice Active brains of Registry
    */
    address public registryImplementation;

    /**
    * @notice Pending brains of Registry
    */
    address public pendingRegistryImplementation;
}

contract RegistryStorage is RegistryAdminStorage {
    
    struct StrategyStep {
        address pool;
        address outputToken;
        bool isBorrow;
    }

    struct LiquidityPool {
        uint8 rating;
        bool  isLiquidityPool;
    }
    
    struct Strategy { 
        uint8          score;
        uint256        index;
        uint256        blockNumber;
        StrategyStep[] strategySteps;
    }
    
    struct Token {
        uint256   index;
        address[] tokens;
    }

    bytes32[] public strategyHashIndexes;
    bytes32[] public tokensHashIndexes;
    
    mapping(address => bool)                        public tokens;
    mapping(bytes32 => Token)                       public tokensHashToTokens;
    mapping(address => LiquidityPool)               public liquidityPools;
    mapping(address => LiquidityPool)               public creditPools;
    mapping(bytes32 => Strategy)                    public strategies;
    mapping(bytes32 => bytes32[])                   public tokenToStrategies;
    mapping(address => mapping(bytes32 => address)) public liquidityPoolToLPTokens;
    mapping(address => mapping(address => bytes32)) public liquidityPoolToTokenHashes;
    mapping(address => address)                     public liquidityPoolToCodeProvider;
}