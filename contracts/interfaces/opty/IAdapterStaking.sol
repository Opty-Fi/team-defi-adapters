// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code provider/adapter for borrow functionality
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for any new defi protocol if it includes borrow
 * functionality
 */
interface IAdapterStaking {
    /**
     * @notice ONLY THERE IN HARVEST,DFORCE,CURVESWAP,CURVEPOOL
     * @notice Return codes for staking specified amount of liquidityPool token held in a vault
     * @param _liquidityPool liquidityPool address where to stake some liquidityPool tokens
     * @param _stakeAmount amount of lpToken (held in vault) to be staked
     * @return _codes Returns a bytes value to be executed
     */
    function getStakeSomeCodes(address _liquidityPool, uint256 _stakeAmount)
        external
        view
        returns (bytes[] memory _codes);

    /**
     * @notice ONLY THERE IN HARVEST,DFORCE,CURVESWAP,CURVEPOOL
     * @notice Return codes for staking full balance of liquidityPool tokens held in a vault
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
     * @param _liquidityPool liquidityPool address where to stake all liquidityPool tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getStakeAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice ONLY THERE IN HARVEST,DFORCE,CURVESWAP,CURVEPOOL
     * @notice Return codes for unstaking specified amount of liquidityPool tokens held in a vault
     * @param _liquidityPool liquidityPool address from where to unstake some liquidityPool tokens
     * @param _unstakeAmount amount of lpToken (held in a vault) to be unstaked
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeSomeCodes(address _liquidityPool, uint256 _unstakeAmount) external view returns (bytes[] memory);

    /**
     * @notice Returns the batch of function calls for unstaking whole balance of liquidityPool tokens held in a vault
     * @param _optyVault Vault contract address
     * @param _liquidityPool liquidityPool address from where to unstake all liquidityPool tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeAllCodes(address payable _optyVault, address _liquidityPool)
        external
        view
        returns (bytes[] memory _codes);

    /**
     * @notice Returns the balance in underlying for staked liquidityPoolToken balance of vault
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address from where to get the amount of staked lpToken
     * @return Returns the underlying token amount for the staked lpToken
     */
    function getAllAmountInTokenStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256);

    /**
     * @notice Returns amount of liquidity pool tokens staked by the vault
     * @param _optyVault Vault contract address
     * @param _liquidityPool liquidityPool address from where to get the lpToken balance
     * @return Returns the lpToken balance that is staked by the specified vault
     */
    function getLiquidityPoolTokenBalanceStake(address payable _optyVault, address _liquidityPool)
        external
        view
        returns (uint256);

    /**
     * @notice Returns the equivalent amount in underlying token if the given amount of lpToken is unstaked and redeemed
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address from where to get amount to redeem
     * @param _redeemAmount redeem amount of liquidity pool token for staking
     * @return _amount Returns the lpToken amount that can be redeemed
     */
    function calculateRedeemableLPTokenAmountStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (uint256 _amount);

    /**
     * @notice Checks whether the amount specified underlying token can be received for full balance of staked lpToken
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address where to check the redeem amt is enough to stake
     * @param _redeemAmount amount specified underlying token that can be received for full balance of staking lpToken
     * @return Returns a boolean true if _redeemAmount is enough to stake and false if not enough
     */
    function isRedeemableAmountSufficientStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (bool);

    /**
     * @notice Returns the batch of function calls for unstake and redeem specified amount of shares
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
     * @param _liquidityPool liquidity pool address from where to unstake and withdraw
     * @param _redeemAmount amount of liquidity pool token to unstake and redeem
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeAndWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Returns the batch of function calls for unstake and redeem whole balance of shares held in a vault
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying token addresses for the given liquidity pool
     * @param _liquidityPool liquidity pool address from where to unstake and withdraw
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeAndWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);
}
