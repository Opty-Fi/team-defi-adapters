// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import { Registry } from "./Registry.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Modifiers } from "./Modifiers.sol";
import { RiskManagerStorage } from "./RiskManagerStorage.sol";
import { RiskManagerProxy } from "./RiskManagerProxy.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";
import {
    IVaultStepInvestStrategyDefinitionRegistry
} from "../../interfaces/opty/IVaultStepInvestStrategyDefinitionRegistry.sol";
import { IStrategyProvider } from "../../interfaces/opty/IStrategyProvider.sol";

/**
 * @title RiskManager
 *
 * @author Opty.fi
 *
 * @dev An extra protection for the best strategy of the opty-fi vault's
 *      underlying token
 */
contract RiskManager is RiskManagerStorage, Modifiers {
    using Address for address;

    /* solhint-disable no-empty-blocks */
    /**
     * @dev Constructor to set the registry contract address
     */
    constructor(address _registry) public Modifiers(_registry) {}

    /**
     * @dev Get the best strategy for respective RiskProfiles
     *
     * @param _profile risk profile corresponding to which get the best strategy
     * @param _underlyingTokens array of underlying token addresses
     *
     * @return Returns the hash of the best strategy corresponding to the riskProfile provided
     *
     * Requirements:
     *
     * - `_profile` can be among these values ["RP1"/"RP2"/"RP3"] or as decided by governance
     *      - Can not be empty
     * - `_underlyingTokens` is an array of underlying tokens like dai, usdc and so forth
     *      - Can not have length 0
     */
    function getBestStrategy(string memory _profile, address[] memory _underlyingTokens)
        external
        view
        returns (bytes32)
    {
        require(bytes(_profile).length > 0, "RP_Empty!");

        for (uint8 i = 0; i < _underlyingTokens.length; i++) {
            require(_underlyingTokens[i] != address(0), "!_underlyingTokens");
            require(_underlyingTokens[i].isContract(), "!_underlyingTokens");
        }
        bytes32 tokensHash = keccak256(abi.encodePacked(_underlyingTokens));

        bytes32 _strategyHash = _getBestStrategy(_profile, tokensHash);
        return _strategyHash;
    }

    /**
     * @dev Get the VaultRewardToken strategy for respective VaultRewardToken hash
     *
     * @param _vaultRewardTokenHash Hash of vault contract and reward token address
     *
     * @return Returns the hash of the VaultRewardToken strategy corresponding to the
     *         `_vaultRewardTokenHash` provided
     *
     * Requirements:
     *
     * - `_vaultRewardTokenHash` is the hash of Vault and RewardToken addresses
     *      - Can not be empty
     */
    function getVaultRewardTokenStrategy(bytes32 _vaultRewardTokenHash)
        external
        view
        returns (DataTypes.VaultRewardStrategy memory _vaultRewardStrategy)
    {
        require(_vaultRewardTokenHash != ZERO_BYTES32, "vRtHash!=0x0");
        IStrategyProvider _strategyProvider = IStrategyProvider(registryContract.strategyProvider());
        _vaultRewardStrategy = _strategyProvider.vaultRewardTokenHashToVaultRewardTokenStrategy(_vaultRewardTokenHash);
    }

    /**
     * @dev Set RiskManagerProxy to act as RiskManager
     *
     * @param _riskManagerProxy RiskManagerProxy contract address to act as RiskManager
     *
     *  Requirements:
     * - `msg.sender` can only be Governance
     */
    function become(RiskManagerProxy _riskManagerProxy) public onlyGovernance {
        require(_riskManagerProxy.acceptImplementation() == 0, "!unauthorized");
    }

    function _getBestStrategy(string memory _riskProfile, bytes32 _tokensHash) internal view returns (bytes32) {
        (, uint8 _permittedSteps, uint8 _lowerLimit, uint8 _upperLimit, bool _profileExists) =
            registryContract.riskProfiles(_riskProfile);
        require(_profileExists, "!Rp_Exists");

        IStrategyProvider _strategyProvider = IStrategyProvider(registryContract.strategyProvider());
        IVaultStepInvestStrategyDefinitionRegistry _vaultStepInvestStrategyDefinitionRegistry =
            IVaultStepInvestStrategyDefinitionRegistry(registryContract.vaultStepInvestStrategyDefinitionRegistry());

        // getbeststrategy from strategyProvider
        bytes32 _strategyHash = _strategyProvider.rpToTokenToBestStrategy(_riskProfile, _tokensHash);

        // fallback to default strategy if best strategy is not available
        if (_strategyHash == ZERO_BYTES32) {
            _strategyHash = _strategyProvider.rpToTokenToDefaultStrategy(_riskProfile, _tokensHash);
            if (_strategyHash == ZERO_BYTES32) {
                return ZERO_BYTES32;
            }
        }
        require(_strategyHash != ZERO_BYTES32, "!bestStrategyHash");

        (, DataTypes.StrategyStep[] memory _strategySteps) =
            _vaultStepInvestStrategyDefinitionRegistry.getStrategy(_strategyHash);

        (uint8 _rating, bool _isLiquidityPool) = registryContract.liquidityPools(_strategySteps[0].pool);
        // validate strategy profile
        if (
            uint8(_strategySteps.length) > _permittedSteps ||
            !_isLiquidityPool ||
            !(_rating >= _lowerLimit && _rating <= _upperLimit)
        ) {
            return _strategyProvider.rpToTokenToDefaultStrategy(_riskProfile, _tokensHash);
        }

        return _strategyHash;
    }
}
