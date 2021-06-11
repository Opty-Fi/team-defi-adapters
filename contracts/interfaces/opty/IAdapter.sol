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
interface IAdapter {
    // /**
    //  * @notice Returns pool value in underlying token for the given liquidity pool and underlying token
    //  * @dev poolValue can be in US dollar (eg. Curve etc.) and in underlyingTokens (eg. Compound etc.)
    //  * @param _liquidityPool liquidity Pool address from where to get the pool value
    //  * @param _underlyingToken address of underlying token for which to get the pool value
    //  * @return pool value in underlying token for the given liquidity pool and underlying token
    //  */
    // function getPoolValue(address _liquidityPool, address _underlyingToken) external view returns (uint256);
    // /**
    //  * @dev Get the codes for depositing specified amount of underlying token in the liquidity pool provided
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
    //  * @dev Get codes for depositing vault's full balance in underlying tokens in the specified liquidity pool
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
    //  * @dev Get codes for token amount that can be borrowed safely against the underlying token
    //  when kept as collateral
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
    //  * @dev Return codes require to reapy the debt, unlock collateral and redeem shares from the given liquidity pool
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
    //  * @notice Get the codes for redeeming specified amount of lpTokens held in the vault
    //  * @dev Redeem speicified `amount` of `liquidityPoolToken` and sends the `underlyingToken` to the caller`
    //  * @param _optyVault Address of vault contract
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address from where to withdraw
    //  * @param _amount amount of underlying token to redeem from the given liquidity pool
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getWithdrawSomeCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool,
    //     uint256 _amount
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Get the codes for redeeming full balance of lpTokens held in the vault
    //  * @dev Redeem full `amount` of `liquidityPoolToken` and sends the `underlyingToken` to the caller`
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
    //  * @notice Get the underlying token addresses given the liquidityPool
    //  * @param _liquidityPool Liquidity Pool address from where to get the lpToken
    //  * @param _liquidityPoolToken liquidity pool's token address
    //  * @return _underlyingTokens Returns the array of underlying token addresses
    //  */
    // function getUnderlyingTokens(address _liquidityPool, address _liquidityPoolToken)
    //     external
    //     view
    //     returns (address[] memory _underlyingTokens);
    // /**
    //  * @dev Returns the market price in underlying for all the shares held in a specified liquidity pool
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
    //  * @notice Get the amount of shares in the specified liquidity pool
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
    //  * @notice Get the amount in underlying token that you'll receive if borrowed token is repaid
    //  * @dev Returns the amount in underlying token for _liquidityPoolTokenAmount collateral if
    //  * _borrowAmount in _borrowToken is repaid.
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPoolAddressProvider liquidityPool address from where to borrow the tokens
    //  * @param _borrowToken address of token to borrow
    //  * @param _borrowAmount amount of token to be borrowed
    //  * @return Returns the amount in underlying token that can be received if borrowed token is repaid
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
    //  * @notice Get the amount in underlying token that you'll receive if whole balance of vault
    //  borrowed token is repaid
    //  * @dev Returns the amount in underlying token for whole collateral of _optyVault balance if
    //  * _borrowAmount in _borrowToken is repaid.
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPoolAddressProvider liquidityPool address from where to borrow the tokens
    //  * @param _borrowToken address of token to borrow
    //  * @param _borrowAmount amount of token to be borrowed
    //  * @return Returns the amount in underlying token that you'll receive if whole bal of vault
    //  borrowed token is repaid
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
    //  * @dev Returns the market value in underlying token of the shares in the specified liquidity pool
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to redeem the tokens
    //  * @param _redeemAmount amount of token to be redeemed
    //  * @return _amount Returns the market value in underlying token of the shares in the given liquidity pool
    //  */
    // function calculateRedeemableLPTokenAmount(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (uint256 _amount);
    // /**
    //  * @notice Checks whether the vault has enough lp token (+ rewards) to redeem for the specified amount of shares
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address from where to redeem the tokens
    //  * @param _redeemAmount amount of lpToken (+ rewards) enough to redeem
    //  * @return Returns a boolean true if lpToken (+ rewards) to redeem for given amount is enough
    //  else it returns false
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
    //  * @notice Return codes for claiming the reward tokens (eg: COMP etc.)
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to claim reward tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getClaimRewardTokenCode(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @dev Return codes for swapping specified amount of rewards in vault to underlying tokens via DEX like Uniswap
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address where to harvest some liquidityPool tokens
    //  * @param _rewardTokenAmount amount of reward token to be harvested to underlyingTokens via DEX
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getHarvestSomeCodes(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _rewardTokenAmount
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @dev Return codes for swapping full balance of rewards in vault to underlying tokens via DEX like Uniswap
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
    //  * @notice Returns whether the protocol can stake liquidityPool token
    //  * @param _liquidityPool liquidityPool address for which to check if staking is enabled or not
    //  * @return Returns a boolean true if liquidityPool token staking is allowed else false if it not enabled
    //  */
    // function canStake(address _liquidityPool) external view returns (bool);
    // /**
    //  * @notice Return codes for staking specified amount of liquidityPool token held in a vault
    //  * @param _liquidityPool liquidityPool address where to stake some liquidityPool tokens
    //  * @param _stakeAmount amount of lpToken (held in vault) to be staked
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getStakeSomeCodes(address _liquidityPool, uint256 _stakeAmount)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @notice Return codes for staking full balance of liquidityPool tokens held in a vault
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
    //  * @notice Return codes for unstaking specified amount of liquidityPool tokens held in a vault
    //  * @param _liquidityPool liquidityPool address from where to unstake some liquidityPool tokens
    //  * @param _unstakeAmount amount of lpToken (held in a vault) to be unstaked
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeSomeCodes(address _liquidityPool, uint256 _unstakeAmount)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the batch of function calls for unstaking whole balance of liquidityPool tokens
    //  held in a vault
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to unstake all liquidityPool tokens
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeAllCodes(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the balance in underlying for staked liquidityPoolToken balance of vault
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
    //  * @notice Returns amount of liquidity pool tokens staked by the vault
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidityPool address from where to get the lpToken balance
    //  * @return Returns the lpToken balance that is staked by the specified vault
    //  */
    // function getLiquidityPoolTokenBalanceStake(address payable _optyVault, address _liquidityPool)
    //     external
    //     view
    //     returns (uint256);
    // /**
    //  * @notice Returns the equivalent amount in underlying token if the given amount of lpToken is unstaked
    //  and redeemed
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
    //  * @notice Checks whether the amount specified underlying token can be received for full balance
    //  of staked lpToken
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingToken Underlying token address for the given liquidity pool
    //  * @param _liquidityPool liquidityPool address where to check the redeem amt is enough to stake
    //  * @param _redeemAmount amount specified underlying token that can be received for full balance of
    //  staking lpToken
    //  * @return Returns a boolean true if _redeemAmount is enough to stake and false if not enough
    //  */
    // function isRedeemableAmountSufficientStake(
    //     address payable _optyVault,
    //     address _underlyingToken,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (bool);
    // /**
    //  * @notice Returns the batch of function calls for unstake and redeem specified amount of shares
    //  * @param _optyVault Vault contract address
    //  * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
    //  * @param _liquidityPool liquidity pool address from where to unstake and withdraw
    //  * @param _redeemAmount amount of liquidity pool token to unstake and redeem
    //  * @return _codes Returns a bytes value to be executed
    //  */
    // function getUnstakeAndWithdrawSomeCodes(
    //     address payable _optyVault,
    //     address[] memory _underlyingTokens,
    //     address _liquidityPool,
    //     uint256 _redeemAmount
    // ) external view returns (bytes[] memory _codes);
    // /**
    //  * @notice Returns the batch of function calls for unstake and redeem whole balance of shares held in a vault
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
