// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../utils/Modifiers.sol";
pragma experimental ABIEncoderV2;
import "./RegistryStorage.sol";

contract StrategyProvider is Modifiers, RegistryStorage {
    mapping(string => mapping(bytes32 => bytes32)) public rpToTokenToBestStrategy;
    mapping(string => mapping(bytes32 => bytes32)) public rpToTokenToDefaultStrategy;
    mapping(bytes32 => bytes32) public vaultRewardTokenHashToVaultRewardTokenStrategyHash;

    constructor(address _registry) public Modifiers(_registry) {}

    function setBestStrategy(string memory _riskProfile, bytes32 _tokenHash, bytes32 _strategyHash) public onlyOperator {
        (,,bool _profileExists) = registryContract.riskProfiles(_riskProfile);
        require(_profileExists, "!Rp_Exists");
        rpToTokenToBestStrategy[_riskProfile][_tokenHash] = _strategyHash;
    }
    
    function setBestDefaultStrategy(string memory _riskProfile, bytes32 _tokenHash, bytes32 _strategyHash) public onlyOperator {
        (,,bool _profileExists) = registryContract.riskProfiles(_riskProfile);
        require(_profileExists, "!Rp_Exists");
        rpToTokenToDefaultStrategy[_riskProfile][_tokenHash] = _strategyHash;
    }
    
    function setVaultStrategyHash(bytes32 _vaultRewardTokenHash, bytes32 _vaultRewardTokenStrategyHash) public onlyOperator {
        require(_vaultRewardTokenHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
        require(registryContract.vaultRewardTokenHashToVaultRewardStrategyHash(_vaultRewardTokenHash) == _vaultRewardTokenStrategyHash, "!VaultRewardStrategyExists");
        vaultRewardTokenHashToVaultRewardTokenStrategyHash[_vaultRewardTokenHash] = _vaultRewardTokenStrategyHash;
    }
}