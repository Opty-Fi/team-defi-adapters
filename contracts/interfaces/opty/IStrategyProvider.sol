// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @dev Interface for strategy provider
 */
interface IStrategyProvider {
    /**
     * @dev Set the best stratetgy: _strategyHash for the _riskProfile
     *      and _tokenHash provided
     *
     * @param _riskProfile Risk profile (Eg: RP1, RP2, etc)
     * @param _tokenHash Hash of the underlying token address/addresses
     * @param _strategyHash Strategy hash to be set as best strategy
     *
     * Requirements:
     * - msg.sender should be operator.
     */
    function setBestStrategy(
        string memory _riskProfile,
        bytes32 _tokenHash,
        bytes32 _strategyHash
    ) external;

    /**
     * @dev Set the best default stratetgy: _strategyHash for the _riskProfile
     *      and _tokenHash provided
     *
     * @param _riskProfile Risk profile (Eg: RP1, RP2, etc)
     * @param _tokenHash Hash of the underlying token address/addresses
     * @param _strategyHash Strategy hash to be set as best default strategy
     *
     * Requirements:
     * - msg.sender should be operator.
     */
    function setBestDefaultStrategy(
        string memory _riskProfile,
        bytes32 _tokenHash,
        bytes32 _strategyHash
    ) external;

    /**
     * @dev Assign strategy in form of `_vaultRewardStrategy` to the `_vaultRewardTokenHash`.
     *      Emits a {LogSetVaultRewardStrategy} event.
     *
     * @param _vaultRewardTokenHash Hash of vault contract and reward token address
     * @param _vaultRewardStrategy Vault reward token's strategy to be set corresponding
     *                             _vaultRewardTokenHash provided
     * @return Returns a vaultRewardStrategy hash value indicating successful operation.
     *
     * Requirements:
     * - msg.sender should be operator.
     * - `hold` in {_vaultRewardStrategy} shoould be greater than 0 and should be in `basis` format.
     *      For eg: If hold is 50%, then it's basis will be 5000, Similarly, if it 20%, then it's basis is 2000.
     * - `convert` in {_vaultRewardStrategy} should be approved
     *      For eg: If convert is 50%, then it's basis will be 5000, Similarly, if it 20%, then it's basis is 2000.
     */
    function setVaultRewardStrategy(
        bytes32 _vaultRewardTokenHash,
        DataTypes.VaultRewardStrategy memory _vaultRewardStrategy
    ) external returns (DataTypes.VaultRewardStrategy memory);

    function setDefaultStrategyState(DataTypes.DefaultStrategyState _defaultStrategyState) external;

    function rpToTokenToBestStrategy(string memory _riskProfile, bytes32 _tokenHash) external view returns (bytes32);

    function rpToTokenToDefaultStrategy(string memory _riskProfile, bytes32 _tokenHash) external view returns (bytes32);

    function getVaultRewardTokenHashToVaultRewardTokenStrategy(bytes32 _tokensHash)
        external
        view
        returns (DataTypes.VaultRewardStrategy memory);

    function getDefaultStrategyState() external view returns (DataTypes.DefaultStrategyState);
}
