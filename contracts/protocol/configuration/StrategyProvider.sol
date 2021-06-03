// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { Modifiers } from "./Modifiers.sol";
import { DataTypes } from "../../libraries/types/DataTypes.sol";
import { SafeMath } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IStrategyProvider } from "../../interfaces/opty/IStrategyProvider.sol";

/**
 * @dev Serves as an oracle service of opty-fi's earn protocol
 *      for best strategy
 */
contract StrategyProvider is IStrategyProvider, Modifiers {
    using SafeMath for uint256;

    /**
     * @notice Mapping of RiskProfile (eg: RP1, RP2, etc) to tokensHash (hash of underlying token address/addresses)
     *         to the best strategy hash
     */
    mapping(string => mapping(bytes32 => bytes32)) public override rpToTokenToBestStrategy;

    /**
     * @notice Mapping of RiskProfile (eg: RP1, RP2, etc) to tokensHash (hash of underlying token address/addresses)
     *         to the best default strategy hash
     */
    mapping(string => mapping(bytes32 => bytes32)) public override rpToTokenToDefaultStrategy;

    /**
     * @notice Mapping of hash (vault and reward token address hash) to vault reward token strategy
     */
    mapping(bytes32 => DataTypes.VaultRewardStrategy) public vaultRewardTokenHashToVaultRewardTokenStrategy;

    /** Zero value contract for bytes32 datatype */
    bytes32 public constant ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;

    /** Stores the default strategy state (zero or compound or aave) */
    DataTypes.DefaultStrategyState public defaultStrategyState;

    /* solhint-disable no-empty-blocks */
    constructor(address _registry) public Modifiers(_registry) {
        setDefaultStrategyState(DataTypes.DefaultStrategyState.CompoundOrAave);
    }

    /* solhint-disable no-empty-blocks */

    /**
     * @inheritdoc IStrategyProvider
     */
    function setBestStrategy(
        string memory _riskProfile,
        bytes32 _tokenHash,
        bytes32 _strategyHash
    ) external override onlyOperator {
        DataTypes.RiskProfile memory _riskProfileStruct = registryContract.getRiskProfile(_riskProfile);
        require(_riskProfileStruct.exists, "!Rp_Exists");
        uint256 _index = registryContract.getTokensHashIndexByHash(_tokenHash);
        require(registryContract.getTokensHashByIndex(_index) == _tokenHash, "!TokenHashExists");
        rpToTokenToBestStrategy[_riskProfile][_tokenHash] = _strategyHash;
    }

    /**
     * @inheritdoc IStrategyProvider
     */
    function setBestDefaultStrategy(
        string memory _riskProfile,
        bytes32 _tokenHash,
        bytes32 _strategyHash
    ) external override onlyOperator {
        DataTypes.RiskProfile memory _riskProfileStruct = registryContract.getRiskProfile(_riskProfile);
        require(_riskProfileStruct.exists, "!Rp_Exists");
        uint256 _index = registryContract.getTokensHashIndexByHash(_tokenHash);
        require(registryContract.getTokensHashByIndex(_index) == _tokenHash, "!TokenHashExists");
        rpToTokenToDefaultStrategy[_riskProfile][_tokenHash] = _strategyHash;
    }

    /**
     * @inheritdoc IStrategyProvider
     */
    function setVaultRewardStrategy(
        bytes32 _vaultRewardTokenHash,
        DataTypes.VaultRewardStrategy memory _vaultRewardStrategy
    ) external override onlyOperator returns (DataTypes.VaultRewardStrategy memory) {
        require(_vaultRewardTokenHash != ZERO_BYTES32, "!bytes32(0)");
        uint256 _index = registryContract.getTokensHashIndexByHash(_vaultRewardTokenHash);
        require(registryContract.getTokensHashByIndex(_index) == _vaultRewardTokenHash, "!VaultRewardTokenHashExists");
        require(
            (_vaultRewardStrategy.hold.add(_vaultRewardStrategy.convert) == uint256(10000)) ||
                (_vaultRewardStrategy.hold.add(_vaultRewardStrategy.convert) == uint256(0)),
            "!HoldConvertBasisRange"
        );

        vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].hold = _vaultRewardStrategy.hold;
        vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].convert = _vaultRewardStrategy.convert;
        return vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash];
    }

    /**
     * @inheritdoc IStrategyProvider
     */
    function getDefaultStrategyState() external view override returns (DataTypes.DefaultStrategyState) {
        return defaultStrategyState;
    }

    /**
     * @inheritdoc IStrategyProvider
     */
    function getVaultRewardTokenHashToVaultRewardTokenStrategy(bytes32 _tokensHash)
        external
        view
        override
        returns (DataTypes.VaultRewardStrategy memory)
    {
        return vaultRewardTokenHashToVaultRewardTokenStrategy[_tokensHash];
    }

    /**
     * @inheritdoc IStrategyProvider
     */
    function setDefaultStrategyState(DataTypes.DefaultStrategyState _defaultStrategyState)
        public
        override
        onlyGovernance
    {
        defaultStrategyState = _defaultStrategyState;
    }
}
