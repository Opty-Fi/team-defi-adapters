// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for staking feature for DeFi adapters
 * @author Opty.fi
 * @notice Interface of the DeFi protocol adapter for staking functionality
 * @dev Abstraction layer to different DeFi protocols like Harvest.finance, DForce etc.
 * It is used as a layer for adding any new staking functions being used in DeFi adapters.
 * Conventions used:
 *  - lp: liquidityPool
 *  - lpToken: liquidityPool token
 */
interface IAdapterStaking {
    /**
     * @notice Return batch of function calls for staking specified amount of lp token held in a vault
     * @param _liquidityPool lp address where the vault has deposited and which is associated to a staking pool
     * where to stake some lp tokens
     * @param _stakeAmount amount of lpToken (held in vault) to be staked
     * @return _codes Returns a bytes value to be executed
     */
    function getStakeSomeCodes(address _liquidityPool, uint256 _stakeAmount)
        external
        view
        returns (bytes[] memory _codes);

    /**
     * @notice Return batch of function calls for staking full balance of lp tokens held in a vault
     * @param _vault Vault contract address
     * @param _underlyingTokens List of underlying token addresses for the given lp
     * @param _liquidityPool lp address where the vault has deposited and which is associated to a staking pool
     * where to stake all lp tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getStakeAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Return batch of function calls for unstaking specified amount of lp tokens held in a vault
     * @param _liquidityPool lp address from where the vault has deposited and which is associated to a staking pool
     * where to unstake some lp tokens
     * @param _unstakeAmount amount of lpToken (held in a vault) to be unstaked
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeSomeCodes(address _liquidityPool, uint256 _unstakeAmount) external view returns (bytes[] memory);

    /**
     * @notice Returns the batch of function calls for unstaking whole balance of lp tokens held in a vault
     * @param _vault Vault contract address
     * @param _liquidityPool lp address from where the vault has deposited and which is associated to a staking pool
     * where to unstake all lp tokens
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeAllCodes(address payable _vault, address _liquidityPool)
        external
        view
        returns (bytes[] memory _codes);

    /**
     * @notice Returns the balance in underlying for staked liquidityPoolToken balance of vault
     * @param _vault Vault contract address
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp which is associated to a staking pool from where to get the amount of staked lpToken
     * @return Returns the underlying token amount for the staked lpToken
     */
    function getAllAmountInTokenStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256);

    /**
     * @notice Returns amount of lp tokens staked by the vault
     * @param _vault Vault contract address
     * @param _liquidityPool lp address from where to get the lpToken balance
     * @return Returns the lpToken balance that is staked by the specified vault
     */
    function getLiquidityPoolTokenBalanceStake(address payable _vault, address _liquidityPool)
        external
        view
        returns (uint256);

    /**
     * @notice Returns the equivalent amount in underlying token if the given amount of lpToken is unstaked and redeemed
     * @param _vault Vault contract address
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp address from where to get amount to redeem
     * @param _redeemAmount redeem amount of lp token for staking
     * @return _amount Returns the lpToken amount that can be redeemed
     */
    function calculateRedeemableLPTokenAmountStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (uint256 _amount);

    /**
     * @notice Checks whether the given amount of underlying token can be received for full balance of staked lpToken
     * @param _vault Vault contract address
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp address where to check the redeem amt is enough to stake
     * @param _redeemAmount amount specified underlying token that can be received for full balance of staking lpToken
     * @return Returns a boolean true if _redeemAmount is enough to stake and false if not enough
     */
    function isRedeemableAmountSufficientStake(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (bool);

    /**
     * @notice Returns the batch of function calls for unstake and redeem specified amount of shares
     * @param _vault Vault contract address
     * @param _underlyingTokens List of underlying token addresses for the given lp
     * @param _liquidityPool lp address associated to a staking pool from where to unstake and then withdraw
     * @param _redeemAmount amount of lp token to unstake and redeem
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeAndWithdrawSomeCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Returns the batch of function calls for unstake and redeem whole balance of shares held in a vault
     * @param _vault Vault contract address
     * @param _underlyingTokens List of underlying token addresses for the given lp
     * @param _liquidityPool lp address associated to a staking pool from where to unstake and then withdraw
     * @return _codes Returns a bytes value to be executed
     */
    function getUnstakeAndWithdrawAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);
}
