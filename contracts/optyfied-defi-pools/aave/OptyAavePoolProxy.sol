// SPDX-License-Identifier:MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../../interfaces/opty/IOptyLiquidityPoolProxy.sol";
import "../../interfaces/aave/IAave.sol";
import "../../interfaces/aave/IPriceOracle.sol";
import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../libraries/SafeERC20.sol";

contract OptyAavePoolProxy is IOptyLiquidityPoolProxy {
    
    using SafeERC20 for IERC20;
    using SafeERC20 for IAToken;
    using SafeMath for uint;

    function deploy(address _underlyingToken,address _lendingPoolAddressProvider,address _lendingPoolToken, uint _amount) public override returns(bool){
        address lendingPoolCore = getLendingPoolCore(_lendingPoolAddressProvider);
        address lendingPool = getLendingPool(_lendingPoolAddressProvider);
        IERC20(_underlyingToken).safeApprove(lendingPoolCore, uint(0));
        IERC20(_underlyingToken).safeApprove(lendingPoolCore, uint(_amount));
        IAave(lendingPool).deposit(_underlyingToken,_amount,0);
        require(isTransferAllowed(_lendingPoolToken,_amount,address(this)),"!transferAllowed");
        IAToken(_lendingPoolToken).safeTransfer(msg.sender, balance(_lendingPoolToken,address(this)));
        return true;
    }
    
    function recall(address _underlyingToken, address _lendingPoolToken, uint _amount) public override returns(bool) {
        require(isTransferAllowed(_lendingPoolToken,_amount,address(this)),"!transferAllowed");
        IAToken(_lendingPoolToken).redeem(_amount);
        IERC20(_underlyingToken).safeTransfer(msg.sender, balance(_underlyingToken,address(this)));
        return true;
    }
    
    function isTransferAllowed(address _lendingPoolToken, uint _amount, address _sender) public returns(bool transferAllowed) {
        (transferAllowed) = IAToken(_lendingPoolToken).isTransferAllowed(_sender, _amount);
    }

    function getLendingPoolCore(address _lendingPoolAddressProvider) public view returns (address) {
        return ILendingPoolAddressesProvider(_lendingPoolAddressProvider).getLendingPoolCore();
    }
    
    function getLendingPool(address _lendingPoolAddressProvider) public view returns (address) {
        return ILendingPoolAddressesProvider(_lendingPoolAddressProvider).getLendingPool();
    }
    
    function getPriceOracle(address _lendingPoolAddressProvider) public view returns (address) {
        return ILendingPoolAddressesProvider(_lendingPoolAddressProvider).getPriceOracle();
    }

    function balanceInToken(address _lendingPoolToken, address _holder) public override view returns(uint256){
         return balance(_lendingPoolToken,_holder);
    }
    
    function balance(address _token,address _holder) public override view returns (uint256) {
         return IERC20(_token).balanceOf(_holder);
    } 
    
    function borrow(address _underlyingToken,address _lendingPoolAddressProvider, address _reserve) public override returns(uint _borrowAmount) {
        address _lendingPool = getLendingPool(_lendingPoolAddressProvider);
        address _priceOracle = getPriceOracle(_lendingPoolAddressProvider);
        IAave(_lendingPool).setUserUseReserveAsCollateral(_underlyingToken,true);
        IAave.UserReserveData memory _userReserveData = IAave(_lendingPool).getUserReserveData(_underlyingToken, address(this));
        require(_userReserveData.enabled,"!_userReserveData.enabled");
        IAave.UserAccountData memory _userAccountData = IAave(_lendingPool).getUserAccountData(address(this));
        uint _reservePriceInWei = IPriceOracle(_priceOracle).getAssetPrice(_reserve);
        uint _reserveDecimals = 10 ** uint((IERC20(_reserve).decimals()));
        _borrowAmount = (_reserveDecimals.mul(_userAccountData.availableBorrowsETH)).div(_reservePriceInWei);
        IAave(_lendingPool).borrow(_reserve, _borrowAmount, 2,  0);
        IERC20(_reserve).transfer(msg.sender,_borrowAmount);
    }
}
