// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { DataTypes } from "@optyfi/defi-legos/libraries/types/DataTypes.sol";

//  helper contracts
import { ModifiersController } from "./ModifiersController.sol";
import { RegistryProxy } from "./RegistryProxy.sol";

//  interfaces
import { IVault } from "@optyfi/defi-legos/interfaces/opty/contracts/IVault.sol";
import { IRegistry } from "@optyfi/defi-legos/interfaces/opty/contracts/IRegistry.sol";
import { Constants } from "../../utils/Constants.sol";

/**
 * @title Registry Contract
 * @author Opty.fi
 * @dev Contract to persit status of tokens,lpTokens,lp/cp and Vaults
 */
contract Registry is IRegistry, ModifiersController {
    using Address for address;
    using SafeMath for uint256;

    /**
     * @dev Set RegistryProxy to act as Registry
     * @param _registryProxy RegistryProxy Contract address to act as Registry
     */
    function become(RegistryProxy _registryProxy) external {
        require(msg.sender == _registryProxy.governance(), "!governance");
        require(_registryProxy.acceptImplementation() == 0, "!unauthorized");
    }

    /**
     * @inheritdoc IRegistry
     */
    function setTreasury(address _treasury) external override onlyGovernance returns (bool) {
        require(_treasury != address(0), "!address(0)");
        treasury = _treasury;
        emit TransferTreasury(treasury, msg.sender);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setInvestStrategyRegistry(address _investStrategyRegistry) external override onlyOperator returns (bool) {
        require(_investStrategyRegistry != address(0), "!address(0)");
        require(_investStrategyRegistry.isContract(), "!isContract");
        investStrategyRegistry = _investStrategyRegistry;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setAPROracle(address _aprOracle) external override onlyOperator returns (bool) {
        require(_aprOracle != address(0), "!address(0)");
        require(_aprOracle.isContract(), "!isContract");
        aprOracle = _aprOracle;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setStrategyProvider(address _strategyProvider) external override onlyOperator returns (bool) {
        require(_strategyProvider != address(0), "!address(0)");
        require(_strategyProvider.isContract(), "!isContract");
        strategyProvider = _strategyProvider;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setRiskManager(address _riskManager) external override onlyOperator returns (bool) {
        require(_riskManager != address(0), "!address(0)");
        require(_riskManager.isContract(), "!isContract");
        riskManager = _riskManager;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) external override onlyOperator returns (bool) {
        require(_harvestCodeProvider != address(0), "!address(0)");
        require(_harvestCodeProvider.isContract(), "!isContract");
        harvestCodeProvider = _harvestCodeProvider;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setStrategyManager(address _strategyManager) external override onlyOperator returns (bool) {
        require(_strategyManager != address(0), "!address(0)");
        require(_strategyManager.isContract(), "!isContract");
        strategyManager = _strategyManager;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setOPTY(address _opty) external override onlyOperator returns (bool) {
        require(_opty != address(0), "!address(0)");
        require(_opty.isContract(), "!isContract");
        opty = _opty;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setPriceOracle(address _priceOracle) external override onlyOperator returns (bool) {
        require(_priceOracle != address(0), "!address(0)");
        require(_priceOracle.isContract(), "!isContract");
        priceOracle = _priceOracle;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setOPTYStakingRateBalancer(address _optyStakingRateBalancer)
        external
        override
        onlyOperator
        returns (bool)
    {
        require(_optyStakingRateBalancer != address(0), "!address(0)");
        require(_optyStakingRateBalancer.isContract(), "!isContract");
        optyStakingRateBalancer = _optyStakingRateBalancer;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setODEFIVaultBooster(address _odefiVaultBooster) external override onlyOperator returns (bool) {
        require(_odefiVaultBooster != address(0), "!address(0)");
        require(_odefiVaultBooster.isContract(), "!isContract");
        odefiVaultBooster = _odefiVaultBooster;
        return true;
    }

    ///@TODO Add staking pool contract addresses

    /**
     * @inheritdoc IRegistry
     */
    function approveToken(address[] memory _tokens) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _tokens.length; _i++) {
            _approveToken(_tokens[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function approveToken(address _token) external override onlyOperator returns (bool) {
        _approveToken(_token);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function revokeToken(address[] memory _tokens) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _tokens.length; _i++) {
            _revokeToken(_tokens[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function revokeToken(address _token) external override onlyOperator returns (bool) {
        _revokeToken(_token);
    }

    /**
     * @inheritdoc IRegistry
     */
    function approveLiquidityPool(address[] memory _pools) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _pools.length; _i++) {
            _approveLiquidityPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function approveLiquidityPool(address _pool) external override onlyOperator returns (bool) {
        _approveLiquidityPool(_pool);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function revokeLiquidityPool(address[] memory _pools) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _pools.length; _i++) {
            _revokeLiquidityPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function revokeLiquidityPool(address _pool) external override onlyOperator returns (bool) {
        _revokeLiquidityPool(_pool);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function rateLiquidityPool(DataTypes.PoolRate[] memory _poolRates)
        external
        override
        onlyRiskOperator
        returns (bool)
    {
        for (uint256 _i = 0; _i < _poolRates.length; _i++) {
            _rateLiquidityPool(_poolRates[_i].pool, _poolRates[_i].rate);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function rateLiquidityPool(address _pool, uint8 _rate) external override onlyRiskOperator returns (bool) {
        _rateLiquidityPool(_pool, _rate);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function approveCreditPool(address[] memory _pools) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _pools.length; _i++) {
            _approveCreditPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function approveCreditPool(address _pool) external override onlyOperator returns (bool) {
        _approveCreditPool(_pool);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function revokeCreditPool(address[] memory _pools) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _pools.length; _i++) {
            _revokeCreditPool(_pools[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function revokeCreditPool(address _pool) external override onlyOperator returns (bool) {
        _revokeCreditPool(_pool);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function rateCreditPool(DataTypes.PoolRate[] memory _poolRates) external override onlyRiskOperator returns (bool) {
        for (uint256 _i = 0; _i < _poolRates.length; _i++) {
            _rateCreditPool(_poolRates[_i].pool, _poolRates[_i].rate);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function rateCreditPool(address _pool, uint8 _rate) external override onlyRiskOperator returns (bool) {
        _rateCreditPool(_pool, _rate);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setLiquidityPoolToAdapter(DataTypes.PoolAdapter[] memory _poolAdapters)
        external
        override
        onlyOperator
        returns (bool)
    {
        for (uint256 _i = 0; _i < _poolAdapters.length; _i++) {
            _setLiquidityPoolToAdapter(_poolAdapters[_i].pool, _poolAdapters[_i].adapter);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setLiquidityPoolToAdapter(address _pool, address _adapter) external override onlyOperator returns (bool) {
        _setLiquidityPoolToAdapter(_pool, _adapter);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setTokensHashToTokens(address[][] memory _setOfTokens) external override onlyOperator returns (bool) {
        for (uint256 _i = 0; _i < _setOfTokens.length; _i++) {
            _setTokensHashToTokens(_setOfTokens[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setTokensHashToTokens(address[] memory _tokens) external override onlyOperator returns (bool) {
        _setTokensHashToTokens(_tokens);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setUnderlyingAssetHashToRPToVaults(
        address[] memory _underlyingAssets,
        string memory _riskProfile,
        address _vault
    ) external override onlyOperator returns (bool) {
        _setUnderlyingAssetHashToRPToVaults(keccak256(abi.encodePacked(_underlyingAssets)), _riskProfile, _vault);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setWithdrawalFee(address _vault, uint256 _withdrawalFee)
        external
        override
        onlyFinanceOperator
        returns (bool)
    {
        require(_vault != address(0), "!address(0)");
        require(_vault.isContract(), "!isContract");
        require(
            _withdrawalFee >= withdrawalFeeRange.lowerLimit && _withdrawalFee <= withdrawalFeeRange.upperLimit,
            "!BasisRange"
        );
        vaultToVaultConfiguration[_vault].withdrawalFee = _withdrawalFee;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setWithdrawalFeeRange(DataTypes.WithdrawalFeeRange memory _withdrawalFeeRange)
        external
        override
        onlyFinanceOperator
        returns (bool)
    {
        require(
            _withdrawalFeeRange.lowerLimit >= 0 &&
                _withdrawalFeeRange.lowerLimit < _withdrawalFeeRange.upperLimit &&
                _withdrawalFeeRange.upperLimit <= 10000,
            "!BasisRange"
        );
        withdrawalFeeRange = _withdrawalFeeRange;
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setTreasuryShares(address _vault, DataTypes.TreasuryShare[] memory _treasuryShares)
        external
        override
        onlyFinanceOperator
        returns (bool)
    {
        require(_vault != address(0), "!address(0)");
        require(_vault.isContract(), "!isContract");
        require(_treasuryShares.length > 0, "length!>0");
        uint256 _sharesSum = 0;
        for (uint256 _i = 0; _i < _treasuryShares.length; _i++) {
            require(_treasuryShares[_i].treasury != address(0), "!address(0)");
            _sharesSum = _sharesSum.add(_treasuryShares[_i].share);
        }
        require(_sharesSum == vaultToVaultConfiguration[_vault].withdrawalFee, "FeeShares!=WithdrawalFee");

        //  delete the existing the treasury accounts if any to reset them
        if (vaultToVaultConfiguration[_vault].treasuryShares.length > 0) {
            delete vaultToVaultConfiguration[_vault].treasuryShares;
        }
        for (uint256 _i = 0; _i < _treasuryShares.length; _i++) {
            vaultToVaultConfiguration[_vault].treasuryShares.push(_treasuryShares[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function setUnderlyingAssetHashToRPToVaults(
        address[][] memory _underlyingAssets,
        string[] memory _riskProfiles,
        address[][] memory _vaults
    ) external override onlyOperator returns (bool) {
        require(_riskProfiles.length == _vaults.length, "!Profileslength");
        for (uint256 _i = 0; _i < _vaults.length; _i++) {
            require(_vaults[_i].length == _underlyingAssets.length, "!VaultsLength");
            for (uint256 _j = 0; _j < _vaults[_i].length; _j++) {
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
     * @inheritdoc IRegistry
     */
    function discontinue(address _vault) external override onlyOperator returns (bool) {
        require(_vault != address(0), "!address(0)");
        require(_vault.isContract(), "!isContract");
        vaultToVaultConfiguration[_vault].discontinued = true;
        IVault(_vault).discontinue();
        emit LogDiscontinueVault(_vault, vaultToVaultConfiguration[_vault].discontinued, msg.sender);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function unpauseVaultContract(address _vault, bool _unpaused) external override onlyOperator returns (bool) {
        require(_vault != address(0), "!address(0)");
        require(_vault.isContract(), "!isContract");
        vaultToVaultConfiguration[_vault].unpaused = _unpaused;
        IVault(_vault).setUnpaused(vaultToVaultConfiguration[_vault].unpaused);
        emit LogUnpauseVault(_vault, vaultToVaultConfiguration[_vault].unpaused, msg.sender);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function updateRiskProfileBorrow(string memory _riskProfile, bool _canBorrow)
        external
        override
        onlyRiskOperator
        returns (bool)
    {
        _updateRiskProfileBorrow(_riskProfile, _canBorrow);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function addRiskProfile(
        string memory _riskProfile,
        bool _canBorrow,
        DataTypes.PoolRatingsRange memory _poolRatingRange
    ) external override onlyRiskOperator returns (bool) {
        _addRiskProfile(_riskProfile, _canBorrow, _poolRatingRange);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function addRiskProfile(
        string[] memory _riskProfiles,
        bool[] memory _canBorrow,
        DataTypes.PoolRatingsRange[] memory _poolRatingRanges
    ) external override onlyRiskOperator returns (bool) {
        require(_riskProfiles.length > 0, "!length>0");
        require(_riskProfiles.length == _poolRatingRanges.length, "!PoolRatingsLength");

        for (uint256 _i = 0; _i < _riskProfiles.length; _i++) {
            _addRiskProfile(_riskProfiles[_i], _canBorrow[_i], _poolRatingRanges[_i]);
        }
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function updateRPPoolRatings(string memory _riskProfile, DataTypes.PoolRatingsRange memory _poolRatingRange)
        external
        override
        onlyRiskOperator
        returns (bool)
    {
        _updateRPPoolRatings(_riskProfile, _poolRatingRange);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function removeRiskProfile(uint256 _index) external override onlyRiskOperator returns (bool) {
        _removeRiskProfile(_index);
        return true;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getTokenHashes() public view override returns (bytes32[] memory) {
        return tokensHashIndexes;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getTokensHashToTokenList(bytes32 _tokensHash) public view override returns (address[] memory) {
        return tokensHashToTokens[_tokensHash].tokens;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getRiskProfileList() public view override returns (string[] memory) {
        return riskProfilesArray;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getVaultConfiguration(address _vault) public view override returns (DataTypes.VaultConfiguration memory) {
        return vaultToVaultConfiguration[_vault];
    }

    /**
     * @inheritdoc IRegistry
     */
    function getInvestStrategyRegistry() public view override returns (address) {
        return investStrategyRegistry;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getTokensHashIndexByHash(bytes32 _tokensHash) public view override returns (uint256) {
        return tokensHashToTokens[_tokensHash].index;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getTokensHashByIndex(uint256 _index) public view override returns (bytes32) {
        return tokensHashIndexes[_index];
    }

    /**
     * @inheritdoc IRegistry
     */
    function isApprovedToken(address _token) public view override returns (bool) {
        return tokens[_token];
    }

    /**
     * @inheritdoc IRegistry
     */
    function getStrategyProvider() public view override returns (address) {
        return strategyProvider;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getStrategyManager() public view override returns (address) {
        return strategyManager;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getAprOracle() public view override returns (address) {
        return aprOracle;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getRiskProfile(string memory _riskProfileName)
        public
        view
        override
        returns (DataTypes.RiskProfile memory)
    {
        return riskProfiles[_riskProfileName];
    }

    /**
     * @inheritdoc IRegistry
     */
    function getRiskManager() public view override returns (address) {
        return riskManager;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getOPTYDistributor() public view override returns (address) {
        return optyDistributor;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getODEFIVaultBooster() external view override returns (address) {
        return odefiVaultBooster;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getGovernance() public view override returns (address) {
        return governance;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getFinanceOperator() public view override returns (address) {
        return financeOperator;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getRiskOperator() public view override returns (address) {
        return riskOperator;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getStrategyOperator() public view override returns (address) {
        return strategyOperator;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getOperator() public view override returns (address) {
        return operator;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getHarvestCodeProvider() public view override returns (address) {
        return harvestCodeProvider;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getOPTYStakingRateBalancer() public view override returns (address) {
        return optyStakingRateBalancer;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getLiquidityPool(address _pool) public view override returns (DataTypes.LiquidityPool memory) {
        return liquidityPools[_pool];
    }

    /**
     * @inheritdoc IRegistry
     */
    function getStrategyConfiguration()
        public
        view
        override
        returns (DataTypes.StrategyConfiguration memory _strategyConfiguration)
    {
        _strategyConfiguration.investStrategyRegistry = investStrategyRegistry;
        _strategyConfiguration.strategyProvider = strategyProvider;
        _strategyConfiguration.aprOracle = aprOracle;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getVaultStrategyConfiguration()
        public
        view
        override
        returns (DataTypes.VaultStrategyConfiguration memory _vaultStrategyConfiguration)
    {
        _vaultStrategyConfiguration.strategyManager = strategyManager;
        _vaultStrategyConfiguration.riskManager = riskManager;
        _vaultStrategyConfiguration.optyDistributor = optyDistributor;
        _vaultStrategyConfiguration.odefiVaultBooster = odefiVaultBooster;
        _vaultStrategyConfiguration.operator = operator;
    }

    /**
     * @inheritdoc IRegistry
     */
    function getLiquidityPoolToAdapter(address _pool) public view override returns (address) {
        return liquidityPoolToAdapter[_pool];
    }

    /**
     * @inheritdoc IRegistry
     */
    function getTreasuryShares(address _vault) public view override returns (DataTypes.TreasuryShare[] memory) {
        return vaultToVaultConfiguration[_vault].treasuryShares;
    }

    function _approveToken(address _token) internal returns (bool) {
        require(_token != address(0), "!address(0)");
        require(_token.isContract(), "!isContract");
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
        require(_pool.isContract(), "!isContract");
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
        require(_pool.isContract(), "!isContract");
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
        emit LogLiquidityPoolToAdapter(_pool, _adapter, msg.sender);
        return true;
    }

    function _setTokensHashToTokens(address[] memory _tokens) internal returns (bool) {
        for (uint256 _i = 0; _i < _tokens.length; _i++) {
            require(tokens[_tokens[_i]], "!tokens");
        }
        bytes32 _tokensHash = keccak256(abi.encodePacked(_tokens));
        require(_isNewTokensHash(_tokensHash), "!_isNewTokensHash");
        tokensHashIndexes.push(_tokensHash);
        tokensHashToTokens[_tokensHash].index = tokensHashIndexes.length - 1;
        for (uint256 _i = 0; _i < _tokens.length; _i++) {
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
        require(_underlyingAssetHash != Constants.ZERO_BYTES32, "!underlyingAssetHash");
        require(bytes(_riskProfile).length > 0, "RP_empty.");
        require(_vault != address(0), "!address(0)");
        require(_vault.isContract(), "!isContract");
        require(riskProfiles[_riskProfile].exists, "!RP");
        underlyingAssetHashToRPToVaults[_underlyingAssetHash][_riskProfile] = _vault;
        emit LogUnderlyingAssetHashToRPToVaults(_underlyingAssetHash, _riskProfile, _vault, msg.sender);
        return true;
    }

    function _addRiskProfile(
        string memory _riskProfile,
        bool _canBorrow,
        DataTypes.PoolRatingsRange memory _poolRatingRange
    ) internal returns (bool) {
        require(bytes(_riskProfile).length > 0, "RP_Empty!");
        require(!riskProfiles[_riskProfile].exists, "RP_already_exists");
        riskProfilesArray.push(_riskProfile);
        riskProfiles[_riskProfile].canBorrow = _canBorrow;
        riskProfiles[_riskProfile].poolRatingsRange.lowerLimit = _poolRatingRange.lowerLimit;
        riskProfiles[_riskProfile].poolRatingsRange.upperLimit = _poolRatingRange.upperLimit;
        riskProfiles[_riskProfile].index = riskProfilesArray.length - 1;
        riskProfiles[_riskProfile].exists = true;

        emit LogRiskProfile(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].exists,
            riskProfiles[_riskProfile].canBorrow,
            msg.sender
        );
        emit LogRPPoolRatings(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].poolRatingsRange.lowerLimit,
            riskProfiles[_riskProfile].poolRatingsRange.upperLimit,
            msg.sender
        );
        return true;
    }

    function _updateRiskProfileBorrow(string memory _riskProfile, bool _canBorrow) internal returns (bool) {
        require(riskProfiles[_riskProfile].exists, "!Rp_Exists");
        riskProfiles[_riskProfile].canBorrow = _canBorrow;
        emit LogRiskProfile(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].exists,
            riskProfiles[_riskProfile].canBorrow,
            msg.sender
        );
        return true;
    }

    function _updateRPPoolRatings(string memory _riskProfile, DataTypes.PoolRatingsRange memory _poolRatingRange)
        internal
        returns (bool)
    {
        require(riskProfiles[_riskProfile].exists, "!Rp_Exists");
        riskProfiles[_riskProfile].poolRatingsRange.lowerLimit = _poolRatingRange.lowerLimit;
        riskProfiles[_riskProfile].poolRatingsRange.upperLimit = _poolRatingRange.upperLimit;
        emit LogRPPoolRatings(
            riskProfiles[_riskProfile].index,
            riskProfiles[_riskProfile].poolRatingsRange.lowerLimit,
            riskProfiles[_riskProfile].poolRatingsRange.upperLimit,
            msg.sender
        );
        return true;
    }

    function _removeRiskProfile(uint256 _index) internal returns (bool) {
        require(_index <= riskProfilesArray.length, "Invalid_Rp_index");
        string memory _riskProfile = riskProfilesArray[_index];
        require(riskProfiles[_riskProfile].exists, "!Rp_Exists");
        riskProfiles[_riskProfile].exists = false;
        emit LogRiskProfile(
            _index,
            riskProfiles[_riskProfile].exists,
            riskProfiles[_riskProfile].canBorrow,
            msg.sender
        );
        return true;
    }

    /**
     * @dev Checks duplicate tokensHash
     * @param _hash Hash of the token address/addresses
     * @return A boolean value indicating whether duplicate _hash exists or not
     */
    function _isNewTokensHash(bytes32 _hash) internal view returns (bool) {
        if (tokensHashIndexes.length == 0) {
            return true;
        }
        return (tokensHashIndexes[tokensHashToTokens[_hash].index] != _hash);
    }
}
