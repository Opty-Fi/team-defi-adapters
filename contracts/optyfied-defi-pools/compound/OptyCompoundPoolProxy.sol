// SPDX-License-Identifier:MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../../interfaces/opty/IOptyLiquidityPoolProxy.sol";
import "../../interfaces/compound/ICompound.sol";
import "../../libraries/SafeERC20.sol";
import "../../libraries/Addresses.sol";

contract OptyCompoundPoolProxy is IOptyLiquidityPoolProxy {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Address for address;

    function deploy(address _underlyingToken,address _lendingPool,address _lendingPoolToken, uint _amount) public override returns(bool){
        IERC20(_underlyingToken).safeApprove(_lendingPool, uint(0));
        IERC20(_underlyingToken).safeApprove(_lendingPool, uint(_amount));
        uint result = ICompound(_lendingPool).mint(_amount);
        require(result == 0);
        IERC20(_lendingPoolToken).safeTransfer(msg.sender, balance(_lendingPoolToken,address(this)));
        return true;
    }
    
    function recall(address _underlyingToken, address _lendingPoolToken, uint _amount) public override returns(bool) {
        uint result = ICompound(_lendingPoolToken).redeem(_amount);
        require(result == 0);
        IERC20(_underlyingToken).safeTransfer(msg.sender, balance(_underlyingToken,address(this)));
        return true;
    }

    function balanceInToken(address _lendingPoolToken, address _holder) public override view returns(uint256){
        // Mantisa 1e18 to decimals
        uint256 b = balance(_lendingPoolToken,_holder);
        if (b > 0) {
            b = b.mul(ICompound(_lendingPoolToken).exchangeRateStored()).div(1e18);
         }
         return b;
    }
    
    function balance(address _token,address _holder) public override view returns (uint256) {
         return IERC20(_token).balanceOf(_holder);
    } 
    
    function claimRewardTokens() public returns(uint256 _compTokens) {
        address comptroller = address(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);
        address comp = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
        require(comptroller != address(0), "!address(0)");
        require(comp != address(0), "!address(0)");
        require(address(comptroller).isContract(), "!isContract");
        require(address(comp).isContract(), "!isContract");
        ICompound(comptroller).claimComp(msg.sender);
        _compTokens = IERC20(comp).balanceOf(msg.sender);
        return _compTokens;
    }
    
    function claimCompAllMarket() public returns(uint _compTokens) {
        address comptroller = address(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);
        address comp = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
        address[] memory allMarkets = new address[](1);
        allMarkets[0] = address(0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643);
        
        ICompound(comptroller).claimComp(msg.sender, allMarkets);
        _compTokens = IERC20(comp).balanceOf(msg.sender);
        
    }
    
    // struct CompBalanceMetadata {
    //     uint balance;
    //     uint votes;
    //     address delegate;
    // }
    
    function getCompBalanceMetadata() public view returns(ICompound.CompBalanceMetadata memory) {
        address compoundLens = address(0xd513d22422a3062Bd342Ae374b4b9c20E0a9a074);
        address comp = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
        ICompound.CompBalanceMetadata memory output = ICompound(compoundLens).getCompBalanceMetadata(comp, msg.sender);
        return output;
    }
    
    function claimCompGetCompBalance() public returns(uint, uint) {
        address compoundLens = address(0xd513d22422a3062Bd342Ae374b4b9c20E0a9a074);
        address comptroller = address(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);
        address comp = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
        ICompound.CompBalanceMetadataExt memory output = ICompound(compoundLens).getCompBalanceMetadataExt(comp, comptroller, address(this));
        return (output.balance, output.votes) ;
    }
    function borrow(address _underlyingToken,address _lendingPoolAddressProvider, address _borrowToken) public override returns(bool success) {
        revert("not implemented");
    }
    
    function repay(address _lendingPoolAddressProvider, address _borrowToken,address _lendingPoolToken) public override returns(bool success) {
        revert("not implemented");    }
    
}

// dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F
// cdai = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643

// _comp = 0xc00e94Cb662C3520282E6f5717214004A7f26888
// _comptroller = 0x7b5e3521a049C8fF88e6349f33044c6Cc33c113c
// _unitroller = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B
// 0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b

