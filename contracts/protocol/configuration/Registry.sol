// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ModifiersController } from "./ModifiersController.sol";
import { RegistryProxy } from "./RegistryProxy.sol";
import { IVault } from "../../interfaces/opty/IVault.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @title Registry
 *
 * @author Opty.fi
 *
 * @dev Contract to persit status of tokens,lpTokens,lp/cp and Vaults
 */
contract Registry is ModifiersController {
    using Address for address;

    /**
     * @dev Set RegistryProxy to act as Registry
     *
     * @param _registryProxy RegistryProxy Contract address to act as Registry
     *
     * Requirements:
     *
     * - `msg.sender` should be onlyGovernance and same as RegistryProxy
     */
    function become(RegistryProxy _registryProxy) public {
        require(msg.sender == _registryProxy.governance(), "!governance");
        require(_registryProxy.acceptImplementation() == 0, "!unauthorized");
    }

    /**
     * @dev Transfers treasury to a new account (`_treasury`)
     *
     * @param _treasury Treasury account address to hold treasury
     *
     * @return Status of set treasury operation
     *
     * Requirements:
     *
     * - `msg.sender` Can only be governance
     * - `_treasury` can not be address(0)
     */
    function setTreasury(address _treasury) external onlyGovernance returns (bool) {
        require(_treasury != address(0), "!address(0)");
        treasury = _treasury;
        return true;
    }

    /**
     * @dev set the VaultStepInvestStrategyDefinitionRegistry contract address.
     *
     * @param `_vaultStepInvestStrategyDefinitionRegistry` VaultStepInvestStrategyDefinitionRegistry contract address
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` Can only be governance.
     * - `_vaultStepInvestStrategyDefinitionRegistry` can not be address(0)
     */
    function setVaultStepInvestStrategyDefinitionRegistry(address _vaultStepInvestStrategyDefinitionRegistry)
        external
        onlyGovernance
        returns (bool)
    {
        require(_vaultStepInvestStrategyDefinitionRegistry != address(0), "!address(0)");
        vaultStepInvestStrategyDefinitionRegistry = _vaultStepInvestStrategyDefinitionRegistry;
        return true;
    }

    /**
     * @dev set the StrategyProvider contract address.
     *
     * @param _strategyProvider Address of StrategyProvider Contract
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` Can only be governance.
     * - `_strategyProvider` can not be address(0)
     */
    function setStrategyProvider(address _strategyProvider) external onlyGovernance returns (bool) {
        require(_strategyProvider != address(0), "!address(0)");
        strategyProvider = _strategyProvider;
        return true;
    }

    /**
     * @dev Sets multiple `_tokens` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _tokens List of tokens to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_token` cannot be the zero address or an EOA.
     * - `_token` should not be approved
     */
    function approveToken(address[] memory _tokens) external onlyGovernance returns (bool) {
        for (uint8 _i = 0; _i < uint8(_tokens.length); _i++) {
            _approveToken(_tokens[_i]);
        }
        return true;
    }

    /**
     * @dev Sets `_token` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _token token to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `_token` cannot be the zero address or an EOA.
     * - `msg.sender` should be governance.
     * - `_token` should not be approved
     */
    function approveToken(address _token) external onlyGovernance returns (bool) {
        _approveToken(_token);
        return true;
    }

    /**
     * @dev Revokes multiple `_tokens` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _tokens List of tokens to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_token` cannot be the zero address or an EOA.
     * - `_token` should not be approved
     */
    function revokeToken(address[] memory _tokens) external onlyGovernance returns (bool) {
        for (uint8 _i = 0; _i < uint8(_tokens.length); _i++) {
            _revokeToken(_tokens[_i]);
        }
        return true;
    }

    /**
     * @dev Revokes `_token` from the {tokens} mapping.
     *      Emits a {LogToken} event.
     *
     * @param _token token to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_token` cannot be the zero address or an EOA.
     * - `_token` should be approved
     */
    function revokeToken(address _token) external onlyGovernance returns (bool) {
        _revokeToken(_token);
    }

    /**
     * @dev Sets multiple `_pools` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pools list of pools (act as liquidity/credit pools) to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pools` cannot be the zero address or an EOA.
     * - `_pools` should not be approved
     */
    function approveLiquidityPool(address[] memory _pools) external onlyGovernance returns (bool) {
        for (uint8 _i = 0; _i < uint8(_pools.length); _i++) {
            _approveLiquidityPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @dev Sets `_pool` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pool pools (act as liquidity/credit pools) to approve
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Emits a {LogLiquidityPool} event.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pools` cannot be the zero address or an EOA.
     * - `_pools` should not be approved
     */
    function approveLiquidityPool(address _pool) external onlyGovernance returns (bool) {
        _approveLiquidityPool(_pool);
        return true;
    }

    /**
     * @dev Revokes multiple `_pools` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pools list of pools (act as liquidity/credit pools) to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pools` cannot be the zero address or an EOA.
     * - `_pools` should not be approved
     */
    function revokeLiquidityPool(address[] memory _pools) external onlyGovernance returns (bool) {
        for (uint8 _i = 0; _i < uint8(_pools.length); _i++) {
            _revokeLiquidityPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @dev Revokes `_pool` from the {liquidityPools} mapping.
     *      Emit event {LogLiquidityPool}
     *
     * @param _pool pools (act as liquidity/credit pools) to revoke
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Emits a {LogLiquidityPool} event.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function revokeLiquidityPool(address _pool) external onlyGovernance returns (bool) {
        _revokeLiquidityPool(_pool);
        return true;
    }

    /**
     * @dev Provide [`_pool`,`_rate`] from the {liquidityPools} mapping.
     *      Emit event {LogRateLiquidityPool}
     *
     * @param _poolRates List of pool rates (format: [_pool, _rate]) to set for liquidityPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateLiquidityPool(DataTypes.PoolRate[] memory _poolRates) external onlyOperator returns (bool) {
        for (uint8 _i = 0; _i < _poolRates.length; _i++) {
            _rateLiquidityPool(_poolRates[_i].pool, _poolRates[_i].rate);
        }
        return true;
    }

    /**
     * @dev Provide `_rate` to `_pool` from the {liquidityPools} mapping.
     *      Emit event {LogRateLiquidityPool}
     *
     * @param _pool liquidityPool to map with its rating
     * @param _rate rate for the liquidityPool provided
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Emits a {LogRateLiquidityPool} event.
     *
     * Requirements:
     *
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateLiquidityPool(address _pool, uint8 _rate) external onlyOperator returns (bool) {
        _rateLiquidityPool(_pool, _rate);
        return true;
    }

    /**
     * @dev Sets multiple `_pools` from the {creditPools} mapping.
     *      Emits a {LogCreditPool} event.
     *
     * @param _pools List of pools for approval to be considered as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function approveCreditPool(address[] memory _pools) external onlyGovernance returns (bool) {
        for (uint8 _i = 0; _i < uint8(_pools.length); _i++) {
            _approveCreditPool(_pools[_i]);
        }
        return true;
    }

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
    function approveCreditPool(address _pool) external onlyGovernance returns (bool) {
        _approveCreditPool(_pool);
        return true;
    }

    /**
     * @dev Revokes multiple `_pool` from the {revokeCreditPools} mapping.
     *      Emit event {LogCreditPool}
     *
     * @param _pools List of pools for revoking from being used as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function revokeCreditPool(address[] memory _pools) external onlyGovernance returns (bool) {
        for (uint8 _i = 0; _i < uint8(_pools.length); _i++) {
            _revokeCreditPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @dev Revokes `_pool` from the {creditPools} mapping.
     *      Emits a {LogCreditPool} event.
     *
     * @param _pool pool for revoking from being used as creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should not be approved
     */
    function revokeCreditPool(address _pool) external onlyGovernance returns (bool) {
        _revokeCreditPool(_pool);
        return true;
    }

    /**
     * @dev Provide [`_pool`,`_rate`] from the {creditPools} mapping.
     *      Emits a {LogRateCreditPool} event.
     *
     * @param _poolRates List of pool rates (format: [_pool, _rate]) to set for creditPool
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateCreditPool(DataTypes.PoolRate[] memory _poolRates) external onlyOperator returns (bool) {
        for (uint8 _i = 0; _i < _poolRates.length; _i++) {
            _rateCreditPool(_poolRates[_i].pool, _poolRates[_i].rate);
        }
        return true;
    }

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
     *
     * - `msg.sender` should be operator.
     * - `_pool` cannot be the zero address or an EOA.
     * - `_pool` should be approved
     */
    function rateCreditPool(address _pool, uint8 _rate) external onlyOperator returns (bool) {
        _rateCreditPool(_pool, _rate);
        return true;
    }

    /**
     * @dev Maps liquidity `_pool` to the protocol adapter `_adapter` using {liquidityPoolToAdapter}.
     *      Emits a {LogLiquidityPoolToDepositToken} event.
     *
     * @param _poolAdapters List of `[_pool, _adapter]` pairs to set
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be governance.
     * - `_pool`should be approved.
     * - `_adapter` should be contract
     */
    function setLiquidityPoolToAdapter(DataTypes.PoolAdapter[] memory _poolAdapters)
        external
        onlyOperator
        returns (bool)
    {
        for (uint8 _i = 0; _i < _poolAdapters.length; _i++) {
            _setLiquidityPoolToAdapter(_poolAdapters[_i].pool, _poolAdapters[_i].adapter);
        }
        return true;
    }

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
     *
     * - `msg.sender` should be governance.
     * - `_pool`should be approved.
     * - `_adapter` should be contract
     */
    function setLiquidityPoolToAdapter(address _pool, address _adapter) external onlyOperator returns (bool) {
        _setLiquidityPoolToAdapter(_pool, _adapter);
        return true;
    }

    /**
     * @dev Sets multiple `_tokens` to keccak256 hash the {tokensHashToTokens} mapping.
     *      Emits a {LogSetTokensHashToTokens} event.
     *
     * @param _setOfTokens List of mulitple token addresses to map with their (paired tokens) hashes
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be operator.
     * - `_tokens` should be approved
     */
    function setTokensHashToTokens(address[][] memory _setOfTokens) external onlyOperator returns (bool) {
        for (uint8 _i = 0; _i < uint8(_setOfTokens.length); _i++) {
            _setTokensHashToTokens(_setOfTokens[_i]);
        }
        return true;
    }

    /**
     * @dev Sets `_tokens` to keccak256 hash the {tokensHashToTokens} mapping.
     *      Emits a {LogSetTokensHashToTokens} event.
     *
     * @param _tokens List of token addresses to map with their hashes
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` should be operator.
     * - `_tokens` should be approved
     */
    function setTokensHashToTokens(address[] memory _tokens) external onlyOperator returns (bool) {
        _setTokensHashToTokens(_tokens);
        return true;
    }

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
     *
     * - `msg.sender` (caller) should be operator
     * - `_underlyingAssets` cannot be empty
     * - `_vault` cannot be the zero address or EOA
     */
    function setUnderlyingAssetHashToRPToVaults(
        address[] memory _underlyingAssets,
        string memory _riskProfile,
        address _vault
    ) external onlyOperator returns (bool) {
        _setUnderlyingAssetHashToRPToVaults(keccak256(abi.encodePacked(_underlyingAssets)), _riskProfile, _vault);
        return true;
    }

    /**
     * @dev Sets bunch of `Vaults`/`LP_vaults` contract for the corresponding `_underlyingAssets`
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
     *
     * - `msg.sender` (caller) should be operator
     * - `_underlyingAssets` cannot be empty
     * - `_vault` cannot be the zero address or EOA
     */
    function setUnderlyingAssetHashToRPToVaults(
        address[][] memory _underlyingAssets,
        string[] memory _riskProfiles,
        address[][] memory _vaults
    ) public onlyOperator returns (bool) {
        require(uint8(_riskProfiles.length) == uint8(_vaults.length), "!Profileslength");
        for (uint8 _i = 0; _i < uint8(_vaults.length); _i++) {
            require(uint8(_vaults[_i].length) == uint8(_underlyingAssets.length), "!VaultsLength");
            for (uint8 _j = 0; _j < _vaults[_i].length; _j++) {
                _setUnderlyingAssetHashToRPToVaults(
                    keccak256(abi.encodePacked(_underlyingAssets[_j])),
                    _riskProfiles[_i],
                    _vaults[_i][_j]
                );
            }
        }
        return true;
    }

    /**
     * @dev Discontinue the Vault contract from use permanently
     *      Emits a {LogDiscontinueVault} event
     *
     * @param _vault Vault address to discontinue
     * @return A boolean value indicating whether operation is succeeded
     *
     * Requirements:
     *
     * - `_vault` cannot be a zero address
     * - `msg.sender` (caller) should be governance
     *
     * Note: Once Vault contract is disconitnued, then it CAN NOT be re-activated for usage.
     */
    function discontinue(address _vault) external onlyGovernance returns (bool) {
        _discontinue(_vault);
        return true;
    }

    /**
     * @dev Pause tha Vault contract for use temporarily during any emergency
     *      Emits a {LogPauseVault} event
     *
     * @param _vault Vault contract address to pause
     * @param _paused A boolean value `true` to pause vault contract and `false` for un-pause vault contract
     *
     * @return A boolean value indicating whether pause is set to true or false
     *
     * Requirements:
     *
     * - `_vault` cannot be a zero address
     * - `msg.sender` (caller) should be governance
     */
    function setPause(address _vault, bool _paused) external onlyGovernance returns (bool) {
        _setPause(_vault, _paused);
        return true;
    }

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
     *
     * - `msg.sender` can only be operator
     * - `_riskProfile` can not be empty
     * - `_riskProfile` should not already exists
     */
    function addRiskProfile(
        string memory _riskProfile,
        uint8 _noOfSteps,
        DataTypes.PoolRatingsRange memory _poolRatingRange
    ) external onlyOperator returns (bool) {
        _addRiskProfile(_riskProfile, _noOfSteps, _poolRatingRange);
        return true;
    }

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
     *
     * - `msg.sender` can only be operator
     * - `_riskProfile` can not be empty
     * - `_riskProfile` should not already exists
     */
    function addRiskProfile(
        string[] memory _riskProfiles,
        uint8[] memory _noOfSteps,
        DataTypes.PoolRatingsRange[] memory _poolRatingRanges
    ) external onlyOperator returns (bool) {
        require(_riskProfiles.length > 0, "!length>0");
        require(_riskProfiles.length == _noOfSteps.length, "!Stepslength");
        require(_riskProfiles.length == _poolRatingRanges.length, "!PoolRatingsLength");

        for (uint8 _i = 0; _i < _riskProfiles.length; _i++) {
            _addRiskProfile(_riskProfiles[_i], _noOfSteps[_i], _poolRatingRanges[_i]);
        }
        return true;
    }

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
     *
     * - `msg.sender` can only be operator
     * - `_riskProfile` should exists
     */
    function updateRiskProfileSteps(string memory _riskProfile, uint8 _noOfSteps) external onlyOperator returns (bool) {
        _updateRiskProfileSteps(_riskProfile, _noOfSteps);
        return true;
    }

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
     *
     * - `msg.sender` can only be operator
     * - `_riskProfile` should exists
     */
    function updateRPPoolRatings(string memory _riskProfile, DataTypes.PoolRatingsRange memory _poolRatingRange)
        external
        onlyOperator
        returns (bool)
    {
        _updateRPPoolRatings(_riskProfile, _poolRatingRange);
        return true;
    }

    /**
     * @dev Remove the existing risk profile in Registry contract Storage
     *      Emit event {LogRiskProfile}
     *
     * @param _index Index of risk profile to be removed
     *
     * @return A boolean value indicating whether the operation succeeded.
     *
     * Requirements:
     *
     * - `msg.sender` can only be operator
     * - `_riskProfile` can not be empty
     * - `_riskProfile` should not already exists
     */
    function removeRiskProfile(uint256 _index) external onlyOperator returns (bool) {
        _removeRiskProfile(_index);
        return true;
    }

    /**
     * @dev Get the list of tokensHash
     *
     * @return Returns the list of tokensHash.
     */
    function getTokenHashes() public view returns (bytes32[] memory) {
        return tokensHashIndexes;
    }

    /**
     * @dev Get list of token given the `_tokensHash`.
     *
     * @return Returns the list of tokens corresponding to `_tokensHash`.
     */
    function getTokensHashToTokens(bytes32 _tokensHash) public view returns (address[] memory) {
        return tokensHashToTokens[_tokensHash].tokens;
    }

    /**
     * @dev Get the list of all the riskProfiles
     *
     * @return Returns the list of all riskProfiles stored in Registry Storage
     */
    function getRiskProfiles() public view returns (string[] memory) {
        return riskProfilesArray;
    }

    function _approveToken(address _token) internal returns (bool) {
        require(_token != address(0), "!address(0)");
        require(address(_token).isContract(), "!isContract");
        require(!tokens[_token], "!tokens");
        tokens[_token] = true;
        emit LogToken(_token, tokens[_token], msg.sender);
        return true;
    }

    function _revokeToken(address _token) internal returns (bool) {
        require(tokens[_token], "!tokens");
        tokens[_token] = false;
        emit LogToken(_token, tokens[_token], msg.sender);
        return true;
    }

    function _approveLiquidityPool(address _pool) internal returns (bool) {
        require(_pool != address(0), "!address(0)");
        require(address(_pool).isContract(), "!isContract");
        require(!liquidityPools[_pool].isLiquidityPool, "!liquidityPools");
        liquidityPools[_pool].isLiquidityPool = true;
        emit LogLiquidityPool(_pool, liquidityPools[_pool].isLiquidityPool, msg.sender);
        return true;
    }

    function _revokeLiquidityPool(address _pool) internal returns (bool) {
        require(liquidityPools[_pool].isLiquidityPool, "!liquidityPools");
        liquidityPools[_pool].isLiquidityPool = false;
        emit LogLiquidityPool(_pool, liquidityPools[_pool].isLiquidityPool, msg.sender);
        return true;
    }

    function _rateLiquidityPool(address _pool, uint8 _rate) internal returns (bool) {
        require(liquidityPools[_pool].isLiquidityPool, "!liquidityPools");
        liquidityPools[_pool].rating = _rate;
        emit LogRateLiquidityPool(_pool, liquidityPools[_pool].rating, msg.sender);
        return true;
    }

    function _approveCreditPool(address _pool) internal returns (bool) {
        require(_pool != address(0), "!address(0)");
        require(address(_pool).isContract(), "!isContract");
        require(!creditPools[_pool].isLiquidityPool, "!creditPools");
        creditPools[_pool].isLiquidityPool = true;
        emit LogCreditPool(_pool, creditPools[_pool].isLiquidityPool, msg.sender);
        return true;
    }

    function _revokeCreditPool(address _pool) internal returns (bool) {
        require(creditPools[_pool].isLiquidityPool, "!creditPools");
        creditPools[_pool].isLiquidityPool = false;
        emit LogCreditPool(_pool, creditPools[_pool].isLiquidityPool, msg.sender);
        return true;
    }

    function _rateCreditPool(address _pool, uint8 _rate) internal returns (bool) {
        require(creditPools[_pool].isLiquidityPool, "!liquidityPools");
        creditPools[_pool].rating = _rate;
        emit LogRateCreditPool(_pool, creditPools[_pool].rating, msg.sender);
        return true;
    }

    function _setLiquidityPoolToAdapter(address _pool, address _adapter) internal returns (bool) {
        require(_adapter.isContract(), "!_adapter.isContract()");
        require(liquidityPools[_pool].isLiquidityPool || creditPools[_pool].isLiquidityPool, "!liquidityPools");
        liquidityPoolToAdapter[_pool] = _adapter;
        emit LogLiquidityPoolToDepositToken(_pool, _adapter, msg.sender);
        return true;
    }

    function _setTokensHashToTokens(address[] memory _tokens) internal returns (bool) {
        for (uint8 _i = 0; _i < uint8(_tokens.length); _i++) {
            require(tokens[_tokens[_i]], "!tokens");
        }
        bytes32 _tokensHash = keccak256(abi.encodePacked(_tokens));
        require(_isNewTokensHash(_tokensHash), "!_isNewTokensHash");
        tokensHashIndexes.push(_tokensHash);
        tokensHashToTokens[_tokensHash].index = tokensHashIndexes.length - 1;
        for (uint8 _i = 0; _i < uint8(_tokens.length); _i++) {
            tokensHashToTokens[_tokensHash].tokens.push(_tokens[_i]);
        }
        emit LogTokensToTokensHash(_tokensHash, msg.sender);
        return true;
    }

    function _setUnderlyingAssetHashToRPToVaults(
        bytes32 _underlyingAssetHash,
        string memory _riskProfile,
        address _vault
    ) internal returns (bool) {
        require(
            _underlyingAssetHash != 0x0000000000000000000000000000000000000000000000000000000000000000,
            "!underlyingAssetHash"
        );
        require(bytes(_riskProfile).length > 0, "RP_empty.");
        require(_vault != address(0), "!address(0)");
        require(address(_vault).isContract(), "!isContract");
        underlyingAssetHashToRPToVaults[_underlyingAssetHash][_riskProfile] = _vault;
        emit LogUnderlyingAssetHashToRPToVaults(_underlyingAssetHash, _riskProfile, _vault, msg.sender);
        return true;
    }

    function _addRiskProfile(
        string memory _riskProfile,
        uint8 _noOfSteps,
        DataTypes.PoolRatingsRange memory _poolRatingRange
    ) internal returns (bool) {
        require(bytes(_riskProfile).length > 0, "RP_Empty!");
        require(!riskProfiles[_riskProfile].exists, "RP_already_exists");

        riskProfilesArray.push(_riskProfile);
        riskProfiles[_riskProfile].steps = _noOfSteps;
        riskProfiles[_riskProfile].lowerLimit = _poolRatingRange.lowerLimit;
        riskProfiles[_riskProfile].upperLimit = _poolRatingRange.upperLimit;
        riskProfiles[_riskProfile].index = riskProfilesArray.length - 1;
        riskProfiles[_riskProfile].exists = true;

        emit LogRiskProfile(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].exists,
            riskProfiles[_riskProfile].steps,
            msg.sender
        );
        emit LogRPPoolRatings(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].lowerLimit,
            riskProfiles[_riskProfile].upperLimit,
            msg.sender
        );
        return true;
    }

    function _discontinue(address _vault) internal returns (bool) {
        require(_vault != address(0), "!address(0)");
        vaultToDiscontinued[_vault] = true;
        IVault(_vault).discontinue();
        emit LogDiscontinueVault(_vault, vaultToDiscontinued[_vault], msg.sender);
        return true;
    }

    function _setPause(address _vault, bool _paused) internal returns (bool) {
        require(_vault != address(0), "!address(0)");
        vaultToPaused[_vault] = _paused;
        IVault(_vault).setPaused(vaultToPaused[_vault]);
        emit LogPauseVault(_vault, vaultToPaused[_vault], msg.sender);
        return true;
    }

    function _updateRiskProfileSteps(string memory _riskProfile, uint8 _noOfSteps) internal returns (bool) {
        require(riskProfiles[_riskProfile].exists, "!Rp_Exists");
        riskProfiles[_riskProfile].steps = _noOfSteps;
        emit LogRiskProfile(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].exists,
            riskProfiles[_riskProfile].steps,
            msg.sender
        );
        return true;
    }

    function _updateRPPoolRatings(string memory _riskProfile, DataTypes.PoolRatingsRange memory _poolRatingRange)
        internal
        returns (bool)
    {
        require(riskProfiles[_riskProfile].exists, "!Rp_Exists");
        riskProfiles[_riskProfile].lowerLimit = _poolRatingRange.lowerLimit;
        riskProfiles[_riskProfile].upperLimit = _poolRatingRange.upperLimit;
        emit LogRPPoolRatings(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].lowerLimit,
            riskProfiles[_riskProfile].upperLimit,
            msg.sender
        );
        return true;
    }

    function _removeRiskProfile(uint256 _index) internal returns (bool) {
        require(_index <= riskProfilesArray.length, "Invalid_Rp_index");
        string memory _riskProfile = riskProfilesArray[_index];
        require(riskProfiles[_riskProfile].exists, "!Rp_Exists");
        riskProfiles[_riskProfile].exists = false;
        emit LogRiskProfile(_index, riskProfiles[_riskProfile].exists, riskProfiles[_riskProfile].steps, msg.sender);
        return true;
    }

    /**
     * @dev Check duplicate `_hash` tokensHash from the {tokensHashIndexes} mapping.
     *
     * @param _hash Hash of the token address/addresses
     *
     * @return A boolean value indicating whether duplicate `_hash` exists or not.
     *
     * Requirements:
     *
     * - {tokensHashIndexes} length should be more than zero.
     */
    function _isNewTokensHash(bytes32 _hash) internal view returns (bool) {
        if (tokensHashIndexes.length == 0) {
            return true;
        }
        return (tokensHashIndexes[tokensHashToTokens[_hash].index] != _hash);
    }
}
