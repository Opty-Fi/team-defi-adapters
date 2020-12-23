// SPDX-License-Identifier:MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../../interfaces/opty/ICodeProvider.sol";
import "../../interfaces/compound/ICompound.sol";
import "../../libraries/SafeERC20.sol";
import "../../libraries/Addresses.sol";
import "../../utils/Modifiers.sol";

contract CompoundCodeProvider is ICodeProvider,Modifiers {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Address for address;

    address public compoundLens = address(0xd513d22422a3062Bd342Ae374b4b9c20E0a9a074);
    address public comptroller = address(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);
    address public rewardToken = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
    
    function getDepositCodes(address , address[] memory,address _liquidityPool, address , uint[] memory _amounts) public override view returns(bytes[] memory _codes) {
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_liquidityPool,abi.encodeWithSignature("mint(uint256)",uint256(_amounts[0])));
    }
    
    function getWithdrawCodes(address ,address[] memory , address , address _liquidityPoolToken, uint _amount) public override view returns(bytes[] memory _codes) {
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_liquidityPoolToken,abi.encodeWithSignature("redeem(uint256)",uint256(_amount)));
    }

    function calculateAmountInToken(address ,address, address _liquidityPoolToken, uint _liquidityPoolTokenAmount) public override view returns(uint256) {
        if (_liquidityPoolTokenAmount > 0) {
            _liquidityPoolTokenAmount = _liquidityPoolTokenAmount.mul(ICompound(_liquidityPoolToken).exchangeRateStored()).div(1e18);
         }
         return _liquidityPoolTokenAmount;
    }

    function calculateAmountInLPToken(address, address, address _liquidityPoolToken,uint _depositAmount) public override view returns(uint256) {
        return _depositAmount.mul(1e18).div(ICompound(_liquidityPoolToken).exchangeRateStored());
    }

    function balanceInToken(address _optyPool,address,address, address _liquidityPoolToken) public override view returns(uint256) {
        // Mantisa 1e18 to decimals
        uint256 b = IERC20(_liquidityPoolToken).balanceOf(_optyPool);
        if (b > 0) {
            b = b.mul(ICompound(_liquidityPoolToken).exchangeRateStored()).div(1e18);
         }
         return b;
    }

    function balanceInTokenStaked(address , address ,address , address ) public override view returns(uint256) {
        revert("!empty");
    }
    
    function getLiquidityPoolToken(address , address _liquidityPool) public override view returns(address) {
        return _liquidityPool;
    }
    
    function getUnderlyingTokens(address _liquidityPool, address) public override view returns(address[] memory _underlyingTokens) {
        _underlyingTokens = new address[](1);
        _underlyingTokens[0] = ICompound(_liquidityPool).underlying();
    }
    
    function canStake(address , address , address , address , uint ) public override view returns(bool) {
        return false;
    }
    
    function getStakeCodes(address , address , address , address , uint ) public override view returns(bytes[] memory) {
        revert("!empty");
    }

    function getUnstakeCodes(address , address , address , address , uint ) public override view returns(bytes[] memory) {
        revert("!empty");
    }

    function getRewardToken(address , address , address , address ) public override view returns(address) {
         return rewardToken;
    }

    function getUnclaimedRewardTokenAmount(address _optyPool, address , address , address ) public override view returns(uint256) {
        return ICompound(comptroller).compAccrued(_optyPool);
    }
    
    function getClaimRewardTokenCode(address _optyPool, address , address , address ) public override view returns(bytes[] memory _codes) {
        _codes = new bytes[](1);
        _codes[0] = abi.encode(comptroller,abi.encodeWithSignature("claimComp(address)",_optyPool));
    }

    function getCompBalanceMetadata() public view returns(ICompound.CompBalanceMetadata memory) {
        ICompound.CompBalanceMetadata memory output = ICompound(compoundLens).getCompBalanceMetadata(rewardToken, msg.sender);
        return output;
    }
    
    function claimCompGetCompBalance() public returns(uint _compTokens) {
        ICompound.CompBalanceMetadataExt memory output = ICompound(compoundLens).getCompBalanceMetadataExt(rewardToken, comptroller, msg.sender);
        return output.balance;
    }
}
