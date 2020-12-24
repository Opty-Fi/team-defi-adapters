// SPDX-License-Identifier:MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../../interfaces/opty/ICodeProvider.sol";
import "../../interfaces/harvest.finance/IHarvestDeposit.sol";
import "../../interfaces/harvest.finance/IHarvestFarm.sol";
import "../../libraries/SafeERC20.sol";
import "../../utils/Modifiers.sol";
import "../../Gatherer.sol";

contract HarvestCodeProvider is ICodeProvider, Modifiers {

    using SafeERC20 for IERC20;
    using SafeMath for uint;
    
    Gatherer gathererContract;
    
    address public rewardToken;
    
    mapping(address => address) public liquidityPoolToStakingPool;
    
    
    constructor(address _registry, address _gatherer) public Modifiers(_registry) {
        setGathererContract(_gatherer);
        setRewardToken(address(0xa0246c9032bC3A600820415aE600c6388619A14D));
        setLiquidityPoolToStakingPool(address(0x640704D106E79e105FDA424f05467F005418F1B5), address(0x017eC1772A45d2cf68c429A820eF374f0662C57c));
        setLiquidityPoolToStakingPool(address(0x71B9eC42bB3CB40F017D8AD8011BE8e384a95fa5), address(0x27F12d1a08454402175b9F0b53769783578Be7d9));
        setLiquidityPoolToStakingPool(address(0x0FE4283e0216F94f5f9750a7a11AC54D3c9C38F3), address(0x6D1b6Ea108AA03c6993d8010690264BA96D349A8));
        setLiquidityPoolToStakingPool(address(0xab7FA2B2985BCcfC13c6D86b1D5A17486ab1e04C), address(0x15d3A64B2d5ab9E152F16593Cdebc4bB165B5B4A));
        setLiquidityPoolToStakingPool(address(0xf0358e8c3CD5Fa238a29301d0bEa3D63A17bEdBE), address(0x4F7c28cCb0F1Dbd1388209C67eEc234273C878Bd));
        setLiquidityPoolToStakingPool(address(0x053c80eA73Dc6941F518a68E2FC52Ac45BDE7c9C), address(0x6ac4a7AB91E6fD098E13B7d347c6d4d1494994a2));
        setLiquidityPoolToStakingPool(address(0x7674622c63Bee7F46E86a4A5A18976693D54441b), address(0xeC56a21CF0D7FeB93C25587C12bFfe094aa0eCdA));
        setLiquidityPoolToStakingPool(address(0x9aA8F427A17d6B0d91B6262989EdC7D45d6aEdf8), address(0xA3Cf8D1CEe996253FAD1F8e3d68BDCba7B3A3Db5));
        setLiquidityPoolToStakingPool(address(0x5d9d25c7C457dD82fc8668FFC6B9746b674d4EcB), address(0x917d6480Ec60cBddd6CbD0C8EA317Bcc709EA77B));
        setLiquidityPoolToStakingPool(address(0xC391d1b08c1403313B0c28D47202DFDA015633C4), address(0x7b8Ff8884590f44e10Ea8105730fe637Ce0cb4F6));
        setLiquidityPoolToStakingPool(address(0xFE09e53A81Fe2808bc493ea64319109B5bAa573e), address(0x3DA9D911301f8144bdF5c3c67886e5373DCdff8e));
        setLiquidityPoolToStakingPool(address(0x998cEb152A42a3EaC1f555B1E911642BeBf00faD), address(0xC0f51a979e762202e9BeF0f62b07F600d0697DE1));
        setLiquidityPoolToStakingPool(address(0x683E683fBE6Cf9b635539712c999f3B3EdCB8664), address(0xef4Da1CE3f487DA2Ed0BE23173F76274E0D47579));
        setLiquidityPoolToStakingPool(address(0x4b1cBD6F6D8676AcE5E412C78B7a59b4A1bbb68a), address(0x093C2ae5E6F3D2A897459aa24551289D462449AD));
    }

    function getDepositCodes(address, address[] memory, address _liquidityPool, address , uint[] memory _amounts) public override view returns(bytes[] memory _codes) {
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_liquidityPool,abi.encodeWithSignature("deposit(uint256)",_amounts[0]));
    }

    function getWithdrawCodes(address, address[] memory, address , address _liquidityPoolToken, uint _shares) public override view returns(bytes[] memory _codes) {
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_liquidityPoolToken,abi.encodeWithSignature("withdraw(uint256)",_shares));
    }

    function calculateAmountInToken(address ,address, address _liquidityPoolToken, uint _liquidityPoolTokenAmount) public override view returns(uint256) {
        if (_liquidityPoolTokenAmount > 0) {
            _liquidityPoolTokenAmount = _liquidityPoolTokenAmount.mul(IHarvestDeposit(_liquidityPoolToken).getPricePerFullShare()).div(10**(IHarvestDeposit(_liquidityPoolToken).decimals()));
         }
         return _liquidityPoolTokenAmount;
    }
    
    function calculateAmountInLPToken(address, address, address _liquidityPoolToken,uint _depositAmount) public override view returns(uint256) {
        return _depositAmount.mul(10**(IHarvestDeposit(_liquidityPoolToken).decimals())).div(IHarvestDeposit(_liquidityPoolToken).getPricePerFullShare());
    }

    function balanceInToken(address _optyPool, address, address _liquidityPool, address) public override view returns(uint) {
        uint b = IERC20(_liquidityPool).balanceOf(_optyPool);
        if (b > 0) {
            b = b.mul(IHarvestDeposit(_liquidityPool).getPricePerFullShare()).div(10**(IHarvestDeposit(_liquidityPool).decimals()));
        }
        return b;
    }
    
    function balanceInTokenStaked(address _optyPool, address, address _liquidityPool, address) public override view returns(uint) {
        address _stakingPool = liquidityPoolToStakingPool[_liquidityPool];
        uint b = IHarvestFarm(_stakingPool).balanceOf(_optyPool);
        address[] memory _underlyingToken = getUnderlyingTokens(_liquidityPool, _liquidityPool);
        if (b > 0) {
            b = b.mul(IHarvestDeposit(_liquidityPool).getPricePerFullShare()).div(10**(IHarvestDeposit(_liquidityPool).decimals()));
            if (IHarvestFarm(liquidityPoolToStakingPool[_liquidityPool]).earned(_optyPool)>0){
                b = b.add(gathererContract.rewardBalanceInUnderlyingTokens(rewardToken, _underlyingToken[0], IHarvestFarm(liquidityPoolToStakingPool[_liquidityPool]).earned(_optyPool)));
            }
        }
        return b;
    }
    
    function getLiquidityPoolToken(address, address _liquidityPool) public override view returns(address) {
        return _liquidityPool;
    }
    
    function getUnderlyingTokens(address _liquidityPool, address) public override view returns(address[] memory _underlyingTokens) {
        _underlyingTokens = new address[](1);
        _underlyingTokens[0] = IHarvestDeposit(_liquidityPool).underlying();
    }

    function canStake(address , address , address , address , uint ) public override view returns(bool) {
        return true;
    }
        
    /** 
    * @dev Deposits _amount of _vaultToken in _vaultFarm to generate FARM rewards
    * 
    * @param _liquidityPoolToken Address of the token that represents users' holdings in the pool
    * @param _shares Quantity of _vaultToken to deposit in the farm
    */
    function getStakeCodes(address, address, address, address _liquidityPoolToken, uint _shares) public override view returns(bytes[] memory _codes){
        address _stakingPool = liquidityPoolToStakingPool[_liquidityPoolToken];
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_stakingPool,abi.encodeWithSignature("stake(uint256)",_shares));
    }
    
    /** 
    * @dev Withdraws _amount of _liquidityPoolToken from the corresponding farm contract
    * 
    * @param _liquidityPoolToken Address of the LPtoken associated to the pool
    * @param _shares Quantity of _liquidityPoolToken to unstake from the farm
    */
    function getUnstakeCodes(address, address, address, address _liquidityPoolToken, uint _shares) public override view returns(bytes[] memory _codes){
        address _stakingPool = liquidityPoolToStakingPool[_liquidityPoolToken];
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_stakingPool,abi.encodeWithSignature("withdraw(uint256)",_shares));
    }
        
    function getRewardToken(address , address , address , address ) public override view returns(address) {
        return rewardToken;
    }
     
    function getUnclaimedRewardTokenAmount(address _optyPool, address , address _liquidityPool, address ) public override view returns(uint256) {
        return IHarvestFarm(liquidityPoolToStakingPool[_liquidityPool]).earned(_optyPool);
    }
     
    function getClaimRewardTokenCode(address , address , address _liquidityPool, address ) public override view returns(bytes[] memory _codes) {
        address _stakingPool = liquidityPoolToStakingPool[_liquidityPool];
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_stakingPool,abi.encodeWithSignature("getReward()"));
    }

    function setRewardToken(address _rewardToken) public onlyOperator {
        rewardToken = _rewardToken;
    }
    
    function setLiquidityPoolToStakingPool(address _liquidityPool, address _stakingPool) public onlyOperator {
        require(liquidityPoolToStakingPool[_liquidityPool] != _stakingPool, "liquidityPoolToStakingPool already set");
        liquidityPoolToStakingPool[_liquidityPool] = _stakingPool;
    }
    
    function setGathererContract(address _gatherer) public onlyOperator {
        gathererContract = Gatherer(_gatherer);
    }
    
}

// Harvest DAI vault and token = 0xab7FA2B2985BCcfC13c6D86b1D5A17486ab1e04C
// underlyingToken = ["0x6B175474E89094C44Da98b954EedeAC495271d0F"]
// amounts = ["15000000000000000000"]
// Harvest DAI farm = 0x15d3A64B2d5ab9E152F16593Cdebc4bB165B5B4A