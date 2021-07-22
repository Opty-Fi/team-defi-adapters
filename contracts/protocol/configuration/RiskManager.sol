// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";

//  helper contracts
import { Modifiers } from "./Modifiers.sol";
import { RiskManagerStorage } from "./RiskManagerStorage.sol";
import { RiskManagerProxy } from "./RiskManagerProxy.sol";

//  interfaces
import {
    IVaultStepInvestStrategyDefinitionRegistry
} from "../../interfaces/opty/IVaultStepInvestStrategyDefinitionRegistry.sol";
import { IStrategyProvider } from "../../interfaces/opty/IStrategyProvider.sol";
import { IAPROracle } from "../../interfaces/opty/IAPROracle.sol";
import { IRiskManager } from "../../interfaces/opty/IRiskManager.sol";
import { Constants } from "../../utils/Constants.sol";

/**
 * @title RiskManager Contract
 * @author Opty.fi
 * @dev Contract contains functionality for getting the best invest and vaultRewardToken strategy
 */
contract RiskManager is IRiskManager, RiskManagerStorage, Modifiers {
    using Address for address;

    /* solhint-disable no-empty-blocks */
    constructor(address _registry) public Modifiers(_registry) {}

    /**
     * @dev Set RiskManagerProxy to act as RiskManager
     * @param _riskManagerProxy RiskManagerProxy contract address to act as RiskManager
     */
    function become(RiskManagerProxy _riskManagerProxy) external onlyGovernance {
        require(_riskManagerProxy.acceptImplementation() == 0, "!unauthorized");
    }

    /**
     * @inheritdoc IRiskManager
     */
    function getBestStrategy(string memory _profile, address[] memory _underlyingTokens)
        public
        view
        override
        returns (bytes32)
    {
        require(bytes(_profile).length > 0, "RP_Empty!");

        for (uint256 i = 0; i < _underlyingTokens.length; i++) {
            require(_underlyingTokens[i] != address(0), "!_underlyingTokens");
            require(_underlyingTokens[i].isContract(), "!_underlyingTokens");
        }
        bytes32 tokensHash = keccak256(abi.encodePacked(_underlyingTokens));
        DataTypes.StrategyConfiguration memory _strategyConfiguration = registryContract.getStrategyConfiguration();
        bytes32 _strategyHash = _getBestStrategy(_profile, tokensHash, _strategyConfiguration);
        return _strategyHash;
    }

    /**
     * @inheritdoc IRiskManager
     */
    function getVaultRewardTokenStrategy(bytes32 _vaultRewardTokenHash)
        public
        view
        override
        returns (DataTypes.VaultRewardStrategy memory _vaultRewardStrategy)
    {
        require(_vaultRewardTokenHash != Constants.ZERO_BYTES32, "vRtHash!=0x0");
        _vaultRewardStrategy = IStrategyProvider(registryContract.getStrategyProvider())
            .getVaultRewardTokenHashToVaultRewardTokenStrategy(_vaultRewardTokenHash);
    }

    function _getBestStrategy(
        string memory _riskProfile,
        bytes32 _tokensHash,
        DataTypes.StrategyConfiguration memory _strategyConfiguration
    ) internal view returns (bytes32) {
        DataTypes.RiskProfile memory _riskProfileStruct = registryContract.getRiskProfile(_riskProfile);
        require(_riskProfileStruct.exists, "!Rp_Exists");

        // getbeststrategy from strategyProvider
        bytes32 _strategyHash =
            IStrategyProvider(_strategyConfiguration.strategyProvider).rpToTokenToBestStrategy(
                _riskProfile,
                _tokensHash
            );

        // fallback to default strategy if best strategy is not available
        if (_strategyHash == Constants.ZERO_BYTES32) {
            _strategyHash = IStrategyProvider(_strategyConfiguration.strategyProvider).rpToTokenToDefaultStrategy(
                _riskProfile,
                _tokensHash
            );
            if (
                _strategyHash == Constants.ZERO_BYTES32 &&
                IStrategyProvider(_strategyConfiguration.strategyProvider).getDefaultStrategyState() ==
                DataTypes.DefaultStrategyState.Zero
            ) {
                return Constants.ZERO_BYTES32;
            } else if (
                _strategyHash == Constants.ZERO_BYTES32 &&
                IStrategyProvider(_strategyConfiguration.strategyProvider).getDefaultStrategyState() ==
                DataTypes.DefaultStrategyState.CompoundOrAave
            ) {
                _strategyHash = IAPROracle(_strategyConfiguration.aprOracle).getBestAPR(_tokensHash);
                (, DataTypes.StrategyStep[] memory _strategySteps_) =
                    IVaultStepInvestStrategyDefinitionRegistry(
                        _strategyConfiguration
                            .vaultStepInvestStrategyDefinitionRegistry
                    )
                        .getStrategy(_strategyHash);
                return _strategySteps_.length > 0 ? _strategyHash : Constants.ZERO_BYTES32;
            }
        }
        require(_strategyHash != Constants.ZERO_BYTES32, "!bestStrategyHash");

        (, DataTypes.StrategyStep[] memory _strategySteps) =
            IVaultStepInvestStrategyDefinitionRegistry(_strategyConfiguration.vaultStepInvestStrategyDefinitionRegistry)
                .getStrategy(_strategyHash);

        DataTypes.LiquidityPool memory _liquidityPool = registryContract.getLiquidityPool(_strategySteps[0].pool);

        // validate strategy profile
        bool _isStrategyInvalid =
            !_liquidityPool.isLiquidityPool ||
                !(_liquidityPool.rating >= _riskProfileStruct.poolRatingsRange.lowerLimit &&
                    _liquidityPool.rating <= _riskProfileStruct.poolRatingsRange.upperLimit);
        if (!_riskProfileStruct.canBorrow && !_isStrategyInvalid) {
            // do not allow borrow step
            _isStrategyInvalid = _isStrategyInvalid || _strategySteps[0].isBorrow;
        }
        if (_isStrategyInvalid) {
            if (
                IStrategyProvider(_strategyConfiguration.strategyProvider).rpToTokenToDefaultStrategy(
                    _riskProfile,
                    _tokensHash
                ) != Constants.ZERO_BYTES32
            ) {
                return
                    IStrategyProvider(_strategyConfiguration.strategyProvider).rpToTokenToDefaultStrategy(
                        _riskProfile,
                        _tokensHash
                    );
            } else {
                if (
                    IStrategyProvider(_strategyConfiguration.strategyProvider).getDefaultStrategyState() ==
                    DataTypes.DefaultStrategyState.CompoundOrAave
                ) {
                    _strategyHash = IAPROracle(registryContract.getAprOracle()).getBestAPR(_tokensHash);
                    (, DataTypes.StrategyStep[] memory _strategySteps_) =
                        IVaultStepInvestStrategyDefinitionRegistry(
                            _strategyConfiguration
                                .vaultStepInvestStrategyDefinitionRegistry
                        )
                            .getStrategy(_strategyHash);
                    return _strategySteps_.length > 0 ? _strategyHash : Constants.ZERO_BYTES32;
                } else {
                    return Constants.ZERO_BYTES32;
                }
            }
        }

        return _strategyHash;
    }
}
