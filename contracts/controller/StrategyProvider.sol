// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

import "../utils/Modifiers.sol";
pragma experimental ABIEncoderV2;
// import "./RegistryStorage.sol";

contract StrategyProvider is Modifiers {
    struct VaultRewardStrategy {
        uint256 hold;   //  should be in basis eg: 50% means 5000
        uint256 convert;    //  should be in basis eg: 50% means 5000
    }
    mapping(string => mapping(bytes32 => bytes32)) public rpToTokenToBestStrategy;
    mapping(string => mapping(bytes32 => bytes32)) public rpToTokenToDefaultStrategy;
    // mapping(bytes32 => bytes32) public vaultRewardTokenHashToVaultRewardTokenStrategyHash;
    mapping(bytes32 => VaultRewardStrategy) public vaultRewardTokenHashToVaultRewardTokenStrategy;

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
    
    // function setVaultStrategyHash(bytes32 _vaultRewardTokenHash, bytes32 _vaultRewardTokenStrategyHash) public onlyOperator {
    //     require(_vaultRewardTokenHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
    //     require(registryContract.vaultRewardTokenHashToVaultRewardStrategyHash(_vaultRewardTokenHash) == _vaultRewardTokenStrategyHash, "!VaultRewardStrategyExists");
    //     vaultRewardTokenHashToVaultRewardTokenStrategyHash[_vaultRewardTokenHash] = _vaultRewardTokenStrategyHash;
    // }
    
        /**
     * @dev assign strategy in form of `_vaultRewardStrategy` to the `_vaultRewardTokenHash`.
     *
     * Returns a vaultRewardStrategy hash value indicating successful operation.
     *
     * Emits a {LogSetVaultRewardStrategy} event.
     *
     * Requirements:
     *
     * - msg.sender should be operator.
     * - `hold` in {_vaultRewardStrategy} shoould be greater than 0 and should be in `basis` format.
     *      For eg: If hold is 50%, then it's basis will be 5000, Similarly, if it 20%, then it's basis is 2000.
     * - `convert` in {_vaultRewardStrategy} should be approved
     *      For eg: If convert is 50%, then it's basis will be 5000, Similarly, if it 20%, then it's basis is 2000.
     */
    function setVaultRewardStrategy(bytes32 _vaultRewardTokenHash, VaultRewardStrategy memory _vaultRewardStrategy) public onlyOperator returns (VaultRewardStrategy memory) {
        // require(vaultRewardTokenHashToVaultRewardStrategyHash[_vaultRewardTokenHash] == 0x0000000000000000000000000000000000000000000000000000000000000000, "VaultRewardStrategyAlreadyExists");
        require(_vaultRewardTokenHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
        // (address _vault, address _rewardToken) = registryContract.vaultRewardTokenHashToVaultRewardToken(_vaultRewardTokenHash);
        // require(_vault != address(0), "vault!=0x0");
        // require(_rewardToken != address(0), "rT!=0x0");
        
        if (registryContract.getTokenHashes().length == 0) {
            revert("!TokenHashesEmpty");
        }
        uint256 _index = registryContract.tokensHashToTokens(_vaultRewardTokenHash);
        require(registryContract.tokensHashIndexes(_index) == _vaultRewardTokenHash, "!VaultRewardTokenHashExists");
        // return (tokensHashIndexes[tokensHashToTokens[_hash].index] != _hash);
        
        require(_vaultRewardStrategy.hold > 0, "hold!>0");
        require(_vaultRewardStrategy.convert > 0, "convert!>0");
        
        // generating unique vaultRewardTokenStrategy hash 
        // bytes32 _vaultRewardTokenStrategyHash = keccak256(abi.encodePacked(_vaultRewardTokenHash, _vaultRewardStrategy.hold, _vaultRewardStrategy.convert));
        
        //  setting vault reward strategy
        // vaultRewardStrategies[_vaultRewardTokenStrategyHash].hold = _vaultRewardStrategy.hold;
        // vaultRewardStrategies[_vaultRewardTokenStrategyHash].convert = _vaultRewardStrategy.convert;
        
        // mapping vaultRewardToken's hash to vaultRewardStrategy's hash
        // vaultRewardTokenHashToVaultRewardStrategyHash[_vaultRewardTokenHash] = _vaultRewardTokenStrategyHash;
        vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].hold = _vaultRewardStrategy.hold;
        vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].convert = _vaultRewardStrategy.convert;
        
        // emit LogSetVaultRewardStrategy(msg.sender, _vaultRewardTokenHash, _vaultRewardTokenStrategyHash);
        return vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash];
    }

    // /**
    //  * @dev Update the existing VaultRewardStrategy.
    //  *
    //  * Returns a boolean value indicating whether the operation succeeded.
    //  *
    //  * Emits a {LogUpdateVaultRewardStrategy} event.
    //  *
    //  * Requirements:
    //  *
    //  * - msg.sender can be operator.
    //  * - `hold` in {_vaultRewardStrategy} shoould be greater than 0 and should be in `basis` format.
    //  *      For eg: If hold is 50%, then it's basis will be 5000, Similarly, if it 20%, then it's basis is 2000.
    //  * - `convert` in {_vaultRewardStrategy} should be approved
    //  *      For eg: If convert is 50%, then it's basis will be 5000, Similarly, if it 20%, then it's basis is 2000.
    //  */
    // function updateVaultRewardStrategy(bytes32 _vaultRewardTokenHash, VaultRewardStrategy memory _vaultRewardStrategy) public onlyOperator returns (bool) {
    //     require(_vaultRewardTokenHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
    //     (address _vault, address _rewardToken) = registryContract.vaultRewardTokenHashToVaultRewardToken(_vaultRewardTokenHash);
    //     require(_vault != address(0), "vault!=0x0");
    //     require(_rewardToken != address(0), "rT!=0x0");
    //     // require(_vaultRewardTokenStrategyHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
    //     // require(vaultRewardTokenHashToVaultRewardStrategyHash[_vaultRewardTokenHash] == _vaultRewardTokenStrategyHash, "!StrategyHashMapped");
    //     require(_vaultRewardStrategy.hold >= 0, "!hold>=0");
    //     require(_vaultRewardStrategy.convert >= 0, "!convert>=0");
        
    //     vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].hold = _vaultRewardStrategy.hold;
    //     vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].convert = _vaultRewardStrategy.convert;
        
    //     // emit LogUpdateVaultRewardStrategy(_vaultRewardTokenStrategyHash, vaultRewardStrategies[_vaultRewardTokenStrategyHash].hold, vaultRewardStrategies[_vaultRewardTokenStrategyHash].convert);
    //     return true;
    // }
    
    // /**
    //  * @dev Remove the existing VaultRewardStrategy.
    //  *
    //  * Returns a boolean value indicating whether the operation succeeded.
    //  *
    //  * Requirements:
    //  *
    //  * - msg.sender can be operator.
    //  * - `_vaultRewardTokenHash` should be provided
    //  *      - It will further give the vaultRewardStrategyHash linked to vaultRewardTokenHash
    //  */
    // function removeVaultRewardStrategy(bytes32 _vaultRewardTokenHash) public onlyOperator returns (bool) {
    //     require(_vaultRewardTokenHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
    //     (address _vault, address _rewardToken) = registryContract.vaultRewardTokenHashToVaultRewardToken(_vaultRewardTokenHash);
    //     require(_vault != address(0), "vault!=0x0");
    //     require(_rewardToken != address(0), "rT!=0x0");
    //     // require(_vaultRewardTokenStrategyHash != 0x0000000000000000000000000000000000000000000000000000000000000000, "!bytes32(0)");
    //     // require(vaultRewardTokenHashToVaultRewardStrategyHash[_vaultRewardTokenHash] == _vaultRewardTokenStrategyHash, "!StrategyHashMapped");

    //     // if (_vaultRewardTokenStrategyHash != 0x0000000000000000000000000000000000000000000000000000000000000000) {
    //         //  reset all values
    //         vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].hold = 0;
    //         vaultRewardTokenHashToVaultRewardTokenStrategy[_vaultRewardTokenHash].convert = 0;
    //         // vaultRewardTokenHashToVaultRewardStrategyHash[_vaultRewardTokenHash] = 0x0000000000000000000000000000000000000000000000000000000000000000;
    //     // }
    //     return true;
    // }
    
}