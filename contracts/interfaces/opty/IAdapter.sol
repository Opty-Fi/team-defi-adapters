// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { IAdapterMinimal } from "./IAdapterMinimal.sol";
import { IAdapterBorrow } from "./IAdapterBorrow.sol";
import { IAdapterReward } from "./IAdapterReward.sol";
import { IAdapterStaking } from "./IAdapterStaking.sol";

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code provider/adapter
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for any new defi protocol
 */
/* solhint-disable no-empty-blocks */
interface IAdapter is IAdapterMinimal, IAdapterBorrow, IAdapterReward, IAdapterStaking {
    // /**
    //  * @notice Returns pool value in underlying token for the given liquidity pool and underlying token
    //  * @param _liquidityPool liquidity Pool address from where to get the pool value
    //  * @param _underlyingToken address of underlying token for which to get the pool value
    //  * @return pool value in underlying token for the given liquidity pool and underlying token
    //  */
    // function getPoolValue(address _liquidityPool, address _underlyingToken) external view returns (uint256);
    // /**
    //  * @notice Get the codes for depositing some amount of underlying token in the liquidity pool provided
    //  * @dev Supply `liquidityPool` for Curve, Compound and others except Aave
    //  * @dev Supply `liquidityPoolAddressProvider` instead of `liquidityPool` for Aave
    //  * @dev `_amounts` is an array because there can be multiple underlying tokens for the given liquidityPool
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address where to depsoit
    //  * @param _amounts  List of underlying token amounts
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getDepositSomeCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool,
    //     uint256[] memory _amounts
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the codes for depositing full balance of underlying token in the liquidity pool provided
    //  * @dev Supply `liquidityPool` for Curve, Compound and others except Aave
    //  * @dev Supply `liquidityPoolAddressProvider` instead of `liquidityPool` for Aave
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address where to deposit
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getDepositAllCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the codes for borrowing the given outputToken from the liquidityPool provided
    //  * @dev Borrow full `amount` of `_outputToken` and sends the  `_outputToken` token to the caller`
    //  * @param _optyVault Address of vault contract
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address from where to borrow
    //  * @param _outputToken token address to borrow
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getBorrowAllCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool,
    //     address _outputToken
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the codes for repaying and withdrawing the given outputToken from the liquidityPool provided
    //  * @dev Repay full amount of  `_outputToken` and sends the  `_underlyingTokens` token to the caller`
    //  * @param _optyVault Address of vault contract
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPoolAddressProvider address of liquidity Pool address provider where to repay collateral
    //  * @param _outputToken token address to borrow
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getRepayAndWithdrawAllCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPoolAddressProvider,
    //     address _outputToken
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the codes for withdrawing some amount from the liquidityPool provided
    //  * @dev Redeem some `amount` of `liquidityPoolToken` token and sends the `underlyingToken` to the caller`
    //  * @param _optyVault Address of vault contract
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address from where to withdraw
    //  * @param _amount amount of underlying token to withdraw from the given liquidity pool
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getWithdrawSomeCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool,
    //     uint256 _amount
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the codes for withdrawing all balance from the liquidityPool provided
    //  * @dev Redeem full `amount` of `liquidityPoolToken` token and sends the `underlyingToken` to the caller`
    //  * @param _optyVault Address of vault contract
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address from where to withdraw
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getWithdrawAllCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the liquidity pool token address
    //  * @param _underlyingToken Underlying token address
    //  * @param _liquidityPool Liquidity Pool address from where to get the lpToken
    //  * @return Returns the liquidity pool token address
    //  */
    // function getLiquidityPoolToken(address _underlyingToken, address _liquidityPool) external view returns (address);
    // /**
    //  * @notice Get the underlying token addresses given the liquidityPool/liquidityPoolToken
    //  * @dev Returns the underlying token given the liquidityPoolToken for Aave, others & liquidity pool for Curve
    //  * @param _liquidityPool Liquidity Pool address from where to get the lpToken
    //  * @param _liquidityPoolToken liquidity pool's token address
    //  * @return _underlyingTokens Returns the array of underlying token addresses
    //  */
    // function getUnderlyingTokens(address _liquidityPool, address _liquidityPoolToken)
    //     external
    //     view
    //     returns (address[] memory _underlyingTokens);
    // /**
    //  * @notice Returns the balance in underlying for liquidityPoolToken balance of holder
    //  * @param _optyVault Address of vault contract
    //  * @param _underlyingToken Underlying token address for which to get the balance
    //  * @param _liquidityPool liquidity Pool address which holds the given underlying token
    //  * @return Returns the amount of underlying token balance
    //  */
    // function getAllAmountInToken(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool
    // ) external view returns (uint256);
    // /**
    //  * @notice Get liquidity pool token balance
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address supported by given liquidityPool
    //  * @param _liquidityPool liquidity pool address from where to get the balance of lpToken
    //  * @return Returns the balance of liquidity pool token (lpToken)
    //  */
    // function getLiquidityPoolTokenBalance(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool
    // ) external view returns (uint256);
    // /**
    //  * @notice Returns the equivalent value of underlying token for given liquidityPoolTokenAmount
    //  * @param _underlyingToken Underlying token address supported by given liquidityPool
    //  * @param _liquidityPool liquidity pool address from where to get the balance of lpToken
    //  * @param _liquidityPoolTokenAmount lpToken amount for which to get equivalent underlyingToken amount
    //  * @return Returns the equivalent amount of underlying token for given liquidityPoolTokenAmount
    //  */
    // function getSomeAmountInToken(
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _liquidityPoolTokenAmount
    // ) external view returns (uint256);
    // /**
    //  * @notice Get some amount to borrow from the given liquidity pool
    //  * @dev Returns the amount in underlying token for _liquidityPoolTokenAmount collateral if
    //  * _borrowAmount in _borrowToken is repaid.
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPoolAddressProvider liquidityPool address from where to borrow the tokens
    //  * @param _borrowToken address of token to borrow
    //  * @param _borrowAmount amount of token to be borrowed
    //  * @return Returns the amount that can be borrowed
    //  */
    // function getSomeAmountInTokenBorrow(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPoolAddressProvider,
    //     uint256 _liquidityPoolTokenAmount,
    //     address _borrowToken,
    //     uint256 _borrowAmount
    // ) external view returns (uint256);
    // /**
    //  * @notice Get the amount to borrow from the given liquidity pool
    //  * @dev Returns the amount in underlying token for whole collateral of _optyVault balance if
    //  * _borrowAmount in _borrowToken is repaid.
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPoolAddressProvider liquidityPool address from where to borrow the tokens
    //  * @param _borrowToken address of token to borrow
    //  * @param _borrowAmount amount of token to be borrowed
    //  * @return Returns the amount that can be borrowed
    //  */
    // function getAllAmountInTokenBorrow(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPoolAddressProvider,
    //     address _borrowToken,
    //     uint256 _borrowAmount
    // ) external view returns (uint256);
    // /**
    //  * @dev Returns the equivalent value of liquidityPoolToken for given underlyingTokenAmount
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to redeem the tokens
    //  * @param _underlyingTokenAmount amount of underlying token to be calculated w.r.t. lpToken
    //  * @return Returns the calculated amount lpToken equivalent to underlyingTokenAmount
    //  */
    // function calculateAmountInLPToken(
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _underlyingTokenAmount
    // ) external view returns (uint256);
    // /**
    //  * @dev Returns the equivalent amount of liquidity pool token given the share amount to be withdrawn
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to redeem the tokens
    //  * @param _redeemAmount amount of token to be redeemed
    //  * @return _amount Returns the calculated amount that can be redeemed as lpToken
    //  */
    // function calculateRedeemableLPTokenAmount(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (uint256 _amount);
    // /**
    //  * @notice Returns whether the share amount is redeemable
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to redeem the tokens
    //  * @param _redeemAmount amount of token to be redeemed
    //  * @return Returns a boolean true if redeem amount is sufficient else it returns false
    //  */
    // function isRedeemableAmountSufficient(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (bool);
    // /**
    //  * @notice Returns reward token address for the liquidity pool provided
    //  * @param _liquidityPool liquidityPool address for which to get the rewatf token address
    //  * @return Returns the reward token supported by given liquidity pool
    //  */
    // function getRewardToken(address _liquidityPool) external view returns (address);
    // /**
    //  * @notice Returns the amount of accrued reward tokens
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to unclaim reward tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnclaimedRewardTokenAmount(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (uint256 _codes);
    // /**
    //  * @notice Returns code for claiming the reward tokens (eg: COMP etc.)
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to claim reward tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getClaimRewardTokenCode(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the code for harvesting some rewards
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address where to harvest some liquidityPool tokens
    //  * @param _rewardTokenAmount amount of lpToken to be harvested
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getHarvestSomeCodes(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _rewardTokenAmount
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the code for harvesting all reward
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken List of underlying token addresses for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address where to harvest all liquidityPool tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getHarvestAllCodes(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns whether the protocol can stake
    //  * @param _liquidityPool liquidityPool address for which to check if staking is enabled or not
    //  * @return Returns a boolean true if staking is allowed else false if it not enabled
    //  */
    // function canStake(address _liquidityPool) external view returns (bool);
    // /**
    //  * @notice Returns code for staking liquidityPool token
    //  * @param _liquidityPool liquidityPool address where to stake some liquidityPool tokens
    //  * @param _stakeAmount amount of lpToken to be staked
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getStakeSomeCodes(address _liquidityPool, uint256 _stakeAmount)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns code for staking all liquidityPool tokens balance
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address where to stake all liquidityPool tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getStakeAllCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns code for unstaking some liquidityPool tokens
    //  * @param _liquidityPool liquidityPool address from where to unstake some liquidityPool tokens
    //  * @param _unstakeAmount amount of lpToken to be unstaked
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeSomeCodes(address _liquidityPool, uint256 _unstakeAmount) external view
    //  returns (bytes[] memory);
    // /**
    //  * @notice Returns codes for unstaking all liquidityPool tokens balance
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to unstake all liquidityPool tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeAllCodes(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the balance in underlying for staked liquidityPoolToken balance of holder
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to get the amount of staked lpToken
    //  * @return Returns the underlying token amount for the staked lpToken
    //  */
    // function getAllAmountInTokenStake(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool
    // ) external view returns (uint256);
    // /**
    //  * @notice Get liquidity pool token staked balance
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to get the lpToken balance
    //  * @return Returns the lpToken balance that is staked
    //  */
    // function getLiquidityPoolTokenBalanceStake(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (uint256);
    // /**
    //  * @notice Returns the equivalent amount of liquidity pool token given the share amount to be withdrawn
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to get amount to redeem
    //  * @param _redeemAmount redeem amount of liquidity pool token for staking
    //  * @return _amount Returns the lpToken amount that can be redeemed
    //  */
    // function calculateRedeemableLPTokenAmountStake(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (uint256 _amount);
    // /**
    //  * @notice Returns whether the share amount is redeemable or not
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address where to check the redeem amt is enough to stake
    //  * @param _redeemAmount redeem amount of liquidity pool token for staking
    //  * @return Returns a boolean true if _redeemAmount is enough to stake and false if not enough
    //  */
    // function isRedeemableAmountSufficientStake(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (bool);
    // /**
    //  * @notice Returns the code for unstake and withdraw of some liquidty pool tokens
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
    //  * @param _liquidityPool liquidity pool address from where to unstake and withdraw
    //  * @param _redeemAmount amount of liquidity pool token to unstake and withdraw
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeAndWithdrawSomeCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the code for unstake and withdraw of all liquidty pool tokens
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
    //  * @param _liquidityPool liquidity pool address from where to unstake and withdraw
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeAndWithdrawAllCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool
    // ) external view returns (bytes[] memory _codes);
}
