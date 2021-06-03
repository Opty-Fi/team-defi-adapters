// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @dev Interface of the opty.fi's protocol reegistry
 */
interface IRegistry {
    /**
     * @dev Set the treasury accounts along with  their fee shares corresponding to vault contract.
     *
     * @param _vault Vault contract address
     * @param _treasuryShares Array of treasuries and their fee shares
     *
     * @return Returns a boolean value indicating whether the operation succeeded
     *
     * Requirements:
     *  - `msg.sender` Can only be current governance.
     */
    function setTreasuryShares(address _vault, DataTypes.TreasuryShare[] memory _treasuryShares)
        external
        returns (bool);

    /**
     * @dev set the VaultStepInvestStrategyDefinitionRegistry contract address.
     *
     * @param `_vaultStepInvestStrategyDefinitionRegistry` VaultStepInvestStrategyDefinitionRegistry contract address
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_vaultStepInvestStrategyDefinitionRegistry` can not be address(0)
     */
    function setVaultStepInvestStrategyDefinitionRegistry(address _vaultStepInvestStrategyDefinitionRegistry)
        external
        returns (bool);

    /**
     * @dev set the APROracle contract address.
     *
     * @param _aprOracle Address of APR Pracle contract to be set
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     */
    function setAPROracle(address _aprOracle) external returns (bool);

    /**
     * @dev set the StrategyProvider contract address.
     *
     * @param _strategyProvider Address of StrategyProvider Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_strategyProvider` can not be address(0)
     */
    function setStrategyProvider(address _strategyProvider) external returns (bool);

    /**
     * @dev set the RiskManager's contract address.
     *
     * @param _riskManager Address of RiskManager Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_riskManager` can not be address(0)
     */
    function setRiskManager(address _riskManager) external returns (bool);

    /**
     * @dev set the HarvestCodeProvider contract address.
     *
     * @param _harvestCodeProvider Address of HarvestCodeProvider Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_harvestCodeProvider` can not be address(0)
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) external returns (bool);

    /**
     * @dev set the StrategyManager contract address.
     *
     * @param _strategyManager Address of StrategyManager Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_strategyManager` can not be address(0)
     */
    function setStrategyManager(address _strategyManager) external returns (bool);

    /**
     * @dev set the $OPTY token's contract address.
     *
     * @param _opty Address of Opty Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_opty` can not be address(0)
     */
    function setOPTY(address _opty) external returns (bool);

    /**
     * @dev set the PriceOracle contract address.
     *
     * @param _priceOracle Address of PriceOracle Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_priceOracle` can not be address(0)
     */
    function setPriceOracle(address _priceOracle) external returns (bool);

    /**
     * @dev set the OPTYStakingRateBalancer contract address.
     *
     * @param _optyStakingRateBalancer Address of OptyStakingRateBalancer Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` Can only be governance.
     * - `_optyStakingRateBalancer` can not be address(0)
     */
    function setOPTYStakingRateBalancer(address _optyStakingRateBalancer) external returns (bool);

    /**
     * @dev Sets multiple `_tokens` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _tokens List of tokens to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_token` cannot be the zero address or an EOA.
     * - `_token` should not be approved
     */
    function approveToken(address[] memory _tokens) external returns (bool);

    /**
     * @dev Sets `_token` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _token token to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:\
     * - `_token` cannot be the zero address or an EOA.
     * - `msg.sender` should be governance.
     * - `_token` should not be approved
     */
    function approveToken(address _token) external returns (bool);

    /**
     * @dev Revokes multiple `_tokens` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _tokens List of tokens to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_tokens` cannot be the zero address or an EOA.
     * - `_tokens` should not be approved
     */
    function revokeToken(address[] memory _tokens) external returns (bool);

    /**
     * @dev Revokes `_token` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _token token to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_token` cannot be the zero address or an EOA.
     * - `_token` should be approved
     */
    function revokeToken(address _token) external returns (bool);

    /**
     * @dev Sets multiple `_pools` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pools list of pools (act as liquidity/credit pools) to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pools` cannot be the zero address or an EOA.
     * - `_pools` should not be approved
     */
    function approveLiquidityPool(address[] memory _pools) external returns (bool);

    /**
     * @dev Sets `_pool` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pool pools (act as liquidity/credit pools) to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pools` cannot be the zero address or an EOA.
     * - `_pools` should not be approved
     */
    function approveLiquidityPool(address _pool) external returns (bool);

    /**
     * @dev Revokes multiple `_pools` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pools list of pools (act as liquidity/credit pools) to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pools` cannot be the zero address or an EOA.
     * - `_pools` should not be approved
     */
    function revokeLiquidityPool(address[] memory _pools) external returns (bool);

    /**
     * @dev Revokes `_pool` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pool pools (act as liquidity/credit pools) to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function revokeLiquidityPool(address _pool) external returns (bool);

    /**
     * @dev Provide [`_pool`,`_rate`] from the {liquidityPools} mapping.
     *      Emit event {LogRateLiquidityPool}
     *
     * @param _poolRates List of pool rates (format: [_pool, _rate]) to set for liquidityPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateLiquidityPool(DataTypes.PoolRate[] memory _poolRates) external returns (bool);

    /**
     * @dev Provide `_rate` to `_pool` from the {liquidityPools} mapping.
     *      Emit event {LogRateLiquidityPool}
     *
     * @param _pool liquidityPool to map with its rating
     * @param _rate rate for the liquidityPool provided
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateLiquidityPool(address _pool, uint8 _rate) external returns (bool);

    /**
     * @dev Sets multiple `_pools` from the {creditPools} mapping.
     *      Emits a {LogCreditPool} event.
     *
     * @param _pools List of pools for approval to be considered as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function approveCreditPool(address[] memory _pools) external returns (bool);

    /**
     * @dev Sets `_pool` from the {creditPools} mapping.
     *      Emits a {LogCreditPool} event.
     *
     * @param _pool pool for approval to be considered as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function approveCreditPool(address _pool) external returns (bool);

    /**
     * @dev Revokes multiple `_pool` from the {revokeCreditPools} mapping.
     *      Emit event {LogCreditPool}
     *
     * @param _pools List of pools for revoking from being used as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function revokeCreditPool(address[] memory _pools) external returns (bool);

    /**
     * @dev Revokes `_pool` from the {creditPools} mapping.
     *      Emits a {LogCreditPool} event.
     *
     * @param _pool pool for revoking from being used as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function revokeCreditPool(address _pool) external returns (bool);

    /**
     * @dev Provide [`_pool`,`_rate`] from the {creditPools} mapping.
     *      Emits a {LogRateCreditPool} event.
     *
     * @param _poolRates List of pool rates (format: [_pool, _rate]) to set for creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateCreditPool(DataTypes.PoolRate[] memory _poolRates) external returns (bool);

    /**
     * @dev Provide `_rate` to `_pool` from the {creditPools} mapping.
     *      Emits a {LogRateCreditPool} event.
     *
     * @param _pool creditPool to map with its rating
     * @param _rate rate for the creaditPool provided
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateCreditPool(address _pool, uint8 _rate) external returns (bool);

    /**
     * @dev Maps liquidity `_pool` to the protocol adapter `_adapter` using {liquidityPoolToAdapter}.
     *      Emits a {LogLiquidityPoolToDepositToken} event.
     *
     * @param _poolAdapters List of `[_pool, _adapter]` pairs to set
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pool`should be approved.
     * - `_adapter` should be contract
     */
    function setLiquidityPoolToAdapter(DataTypes.PoolAdapter[] memory _poolAdapters) external returns (bool);

    /**
     * @dev Sets liquidity `_pool` to the protocol adapter `_adapter` from the {liquidityPoolToAdapter} mapping.
     *      Emits a {LogLiquidityPoolToDepositToken} event.
     *
     * @param _pool liquidityPool to map with its adapter
     * @param _adapter adapter for the liquidityPool provided
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be governance.
     * - `_pool`should be approved.
     * - `_adapter` should be contract
     */
    function setLiquidityPoolToAdapter(address _pool, address _adapter) external returns (bool);

    /**
     * @dev Sets multiple `_tokens` to keccak256 hash the {tokensHashToTokens} mapping.
     *      Emits a {LogSetTokensHashToTokens} event.
     *
     * @param _setOfTokens List of mulitple token addresses to map with their (paired tokens) hashes
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be operator.
     * - `_tokens` should be approved
     */
    function setTokensHashToTokens(address[][] memory _setOfTokens) external returns (bool);

    /**
     * @dev Sets `_tokens` to keccak256 hash the {tokensHashToTokens} mapping.
     *      Emits a {LogSetTokensHashToTokens} event.
     *
     * @param _tokens List of token addresses to map with their hashes
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` should be operator.
     * - `_tokens` should be approved
     */
    function setTokensHashToTokens(address[] memory _tokens) external returns (bool);

    /**
     * @dev Sets `Vault`/`LM_vault` contract for the corresponding `_underlyingAsset` and `_riskProfile`
     *      Emits a {LogUnderlyingAssetHashToRPToVaults} event
     *
     * @param _vault Vault contract address
     * @param _riskProfile Risk profile mapped to the vault contract
     * @param _underlyingAssets List of token addresses to map with the riskProfile and Vault contract
     *
     * @return A boolean value indicating whether the operation succeeded
     *
     * Requirements:
     * - `msg.sender` (caller) should be operator
     * - `_underlyingAssets` cannot be empty
     * - `_vault` cannot be the zero address or EOA
     */
    function setUnderlyingAssetHashToRPToVaults(
        address[] memory _underlyingAssets,
        string memory _riskProfile,
        address _vault
    ) external returns (bool);

    /**
     * @dev Set the withdrawal fee for the vault contract.
     *
     * @param _vault Vault contract address
     * @param _withdrawalFee Withdrawal fee to be set for vault contract
     *
     * @return _success Returns a boolean value indicating whether the operation succeeded
     *
     * Requirements:
     *  - `msg.sender` Can only be current governance.
     */
    function setWithdrawalFee(address _vault, uint256 _withdrawalFee) external returns (bool _success);

    /**
     * @dev Sets bunch of `Vaults`/`LP_vaults` contract for the corresponding `_underlyingTokens`
     *      and `_riskProfiles`in one transaction
     *      Emits a {LogUnderlyingAssetHashToRPToVaults} event
     *
     * @param _vaults List of Vault contract address
     * @param _riskProfiles List of Risk profile mapped to the vault contract
     * @param _underlyingAssets List of paired token addresses to map with the riskProfile and Vault contract
     *
     * @return A boolean value indicating whether the operation succeeded
     *
     * Requirements:
     * - `msg.sender` (caller) should be operator
     * - `_underlyingAssets` cannot be empty
     * - `_vault` cannot be the zero address or EOA
     */
    function setUnderlyingAssetHashToRPToVaults(
        address[][] memory _underlyingAssets,
        string[] memory _riskProfiles,
        address[][] memory _vaults
    ) external returns (bool);

    /**
     * @dev Discontinue the Vault contract from use permanently
     *      Emits a {LogDiscontinueVault} event
     *
     * @param _vault Vault address to discontinue
     * @return A boolean value indicating whether operation is succeeded
     *
     * Requirements:
     * - `_vault` cannot be a zero address
     * - `msg.sender` (caller) should be governance
     *
     * Note: Once Vault contract is disconitnued, then it CAN NOT be re-activated for usage.
     */
    function discontinue(address _vault) external returns (bool);

    /**
     * @dev Pause tha Vault contract for use temporarily during any emergency
     *      Emits a {LogUnpauseVault} event
     *
     * @param _vault Vault contract address to pause
     * @param _unpaused A boolean value `true` to pause vault contract and `false` for un-pause vault contract
     *
     * Requirements:
     * - `_vault` cannot be a zero address
     * - `msg.sender` (caller) should be governance
     */
    function unpauseVaultContract(address _vault, bool _unpaused) external returns (bool);

    /**
     * @dev Add the risk profile in Registry contract Storage
     *      Emit events {LogRiskProfile} and {LogRPPoolRatings}
     *
     * @param _riskProfile Risk Profile to add in Registry Storage
     * @param _noOfSteps No. of permitted corresponding to risk profile provided
     * @param _poolRatingRange pool rating range ([lowerLimit, upperLimit]) supported by given risk profile
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` can only be operator
     * - `_riskProfile` can not be empty
     * - `_riskProfile` should not already exists
     */
    function addRiskProfile(
        string memory _riskProfile,
        uint8 _noOfSteps,
        DataTypes.PoolRatingsRange memory _poolRatingRange
    ) external returns (bool);

    /**
     * @dev Add list of the risk profiles in Registry contract Storage in 1 txn.
     *      Emit events {LogRiskProfile} and {LogRPPoolRatings}
     *
     * @param _riskProfiles List of Risk Profiles to add in Registry Storage
     * @param _noOfSteps List of No. of permitted corresponding to list of risk profile provided
     * @param _poolRatingRanges List of pool rating range ([lowerLimit, upperLimit]) supported by
     *        given list of risk profiles
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` can only be operator
     * - `_riskProfile` can not be empty
     * - `_riskProfile` should not already exists
     */
    function addRiskProfile(
        string[] memory _riskProfiles,
        uint8[] memory _noOfSteps,
        DataTypes.PoolRatingsRange[] memory _poolRatingRanges
    ) external returns (bool);

    /**
     * @dev Update the no. of steps for existing risk profile
     *      Emit event {LogRiskProfile}
     *
     * @param _riskProfile Risk Profile to update with steps
     * @param _noOfSteps No. of steps for a given risk profile
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` can only be operator
     * - `_riskProfile` should exists
     */
    function updateRiskProfileSteps(string memory _riskProfile, uint8 _noOfSteps) external returns (bool);

    /**
     * @dev Update the pool ratings for existing risk profile
     *      Emit event {LogRPPoolRatings}
     *
     * @param _riskProfile Risk profile to update with pool rating range
     * @param _poolRatingRange pool rating range ([lowerLimit, upperLimit])
     *        to update for given risk profile
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` can only be operator
     * - `_riskProfile` should exists
     */
    function updateRPPoolRatings(string memory _riskProfile, DataTypes.PoolRatingsRange memory _poolRatingRange)
        external
        returns (bool);

    /**
     * @dev Remove the existing risk profile in Registry contract Storage
     *      Emit event {LogRiskProfile}
     *
     * @param _index Index of risk profile to be removed
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     * - `msg.sender` can only be operator
     * - `_riskProfile` can not be empty
     * - `_riskProfile` should not already exists
     */
    function removeRiskProfile(uint256 _index) external returns (bool);

    /**
     * @dev Get the list of tokensHash
     *
     * @return Returns the list of tokensHash.
     */
    function getTokenHashes() external view returns (bytes32[] memory);

    /**
     * @dev Get list of token given the `_tokensHash`.
     *
     * @return Returns the list of tokens corresponding to `_tokensHash`.
     */
    function getTokensHashToTokenList(bytes32 _tokensHash) external view returns (address[] memory);

    /**
     * @dev Get the list of all the riskProfiles
     *
     * @return Returns the list of all riskProfiles stored in Registry Storage
     */
    function getRiskProfileList() external view returns (string[] memory);

    /**
     * @dev Get the StrategyManager contract address
     *
     * @return Returns the StrategyManager contract address
     */
    function getStrategyManager() external view returns (address);

    /**
     * @dev Get the StrategyProvider contract address
     *
     * @return Returns the StrategyProvider contract address
     */
    function getStrategyProvider() external view returns (address);

    /**
     * @dev Get the VaultStepInvestStrategyDefinitionRegistry contract address
     *
     * @return Returns the VaultStepInvestStrategyDefinitionRegistry contract address
     */
    function getVaultStepInvestStrategyDefinitionRegistry() external view returns (address);

    /**
     * @dev Get the RiskManager contract address
     *
     * @return Returns the RiskManager contract address
     */
    function getRiskManager() external view returns (address);

    /**
     * @dev Get the OptyMinter contract address
     *
     * @return Returns the OptyMinter contract address
     */
    function getOptyMinter() external view returns (address);

    /**
     * @dev Get the Governance address
     *
     * @return Returns the Governance address
     */
    function getGovernance() external view returns (address);

    /**
     * @dev Get the Operator address
     *
     * @return Returns the Operator address
     */
    function getOperator() external view returns (address);

    /**
     * @dev Get the Strategist address
     *
     * @return Returns the Strategist address
     */
    function getStrategist() external view returns (address);

    /**
     * @dev Get the HarvestCodeProvider contract address
     *
     * @return Returns the HarvestCodeProvider contract address
     */
    function getHarvestCodeProvider() external view returns (address);

    /**
     * @dev Get the AprOracle contract address
     *
     * @return Returns the AprOracle contract address
     */
    function getAprOracle() external view returns (address);

    /**
     * @dev Get the OPTYStakingRateBalancer contract address
     *
     * @return Returns the OPTYStakingRateBalancer contract address
     */
    function getOPTYStakingRateBalancer() external view returns (address);

    /**
     * @dev Get the configuration of vault contract
     *
     * @return _vaultConfiguration Returns the configuration of vault contract
     */
    function getVaultConfiguration(address _vault)
        external
        view
        returns (DataTypes.VaultConfiguration memory _vaultConfiguration);

    /**
     * @dev Get the properties corresponding to riskProfile provided
     *
     * @return _riskProfile Returns the properties corresponding to riskProfile provided
     */
    function getRiskProfile(string memory) external view returns (DataTypes.RiskProfile memory _riskProfile);

    /**
     * @dev Get the index corresponding to tokensHash provided
     *
     * @param _tokensHash Hash of token address/addresses
     * @return _index Returns the index corresponding to tokensHash provided
     */
    function getTokensHashIndexByHash(bytes32 _tokensHash) external view returns (uint256 _index);

    /**
     * @dev Get the tokensHash available at the index provided
     *
     * @param _index Index at which you want to get the tokensHash
     * @return _tokensHash Returns the tokensHash available at the index provided
     */
    function getTokensHashByIndex(uint256 _index) external view returns (bytes32 _tokensHash);

    /**
     * @dev Get the rating and Is pool a liquidity pool for the _pool provided
     *
     * @param _pool Liquidity Pool (like cDAI etc.) address
     * @return _liquidityPool Returns the rating and Is pool a liquidity pool for the _pool provided
     */
    function getLiquidityPool(address _pool) external view returns (DataTypes.LiquidityPool memory _liquidityPool);

    /**
     * @dev Get the configuration related to Strategy contracts
     *
     * @return _strategyConfiguration Returns the configuration related to Strategy contracts
     */
    function getStrategyConfiguration()
        external
        view
        returns (DataTypes.StrategyConfiguration memory _strategyConfiguration);

    /**
     * @dev Get the contract address required as part of strategy by vault contract
     *
     * @return _vaultStrategyConfiguration Returns the configuration related to Strategy for Vault contracts
     */
    function getVaultStrategyConfiguration()
        external
        view
        returns (DataTypes.VaultStrategyConfiguration memory _vaultStrategyConfiguration);

    /**
     * @dev Get the adapter address mapped to the _pool provided
     *
     * @param _pool Liquidity Pool (like cDAI etc.) address
     * @return _adapter Returns the adapter address mapped to the _pool provided
     */
    function getLiquidityPoolToAdapter(address _pool) external view returns (address _adapter);

    /**
     * @dev Set the treasury accounts along with  their fee shares corresponding to vault contract.
     *
     * @param _vault Vault contract address
     * @return Returns Treasuries along with their fee shares
     */
    function getTreasuryShares(address _vault) external view returns (DataTypes.TreasuryShare[] memory);

    /**
     * @dev Check if the token is approved or not
     *
     * @param _token Token address for which to check if it is approved or not
     * @return _isTokenApproved Returns a boolean for token approved or not
     */
    function isApprovedToken(address _token) external view returns (bool _isTokenApproved);
}
