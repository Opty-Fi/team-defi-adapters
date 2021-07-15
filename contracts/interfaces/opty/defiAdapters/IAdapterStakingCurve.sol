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
 *  - lpToken: liquidity pool token
 */
interface IAdapterStakingCurve {
    /**
     * @notice Returns the balance in underlying for staked liquidityPoolToken balance of holder
     * @dev It should only be implemented in Curve adapters
     * @param _vault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool Liquidity pool's contract address where the vault has deposited and which is associated
     * to a staking pool where to stake all lpTokens
     * @return Returns the equivalent amount of underlying tokens to the staked amount of liquidityPoolToken
     */
    function getAllAmountInTokenStakeWrite(
        address payable _vault,
        address _underlyingToken,
        address _liquidityPool
    ) external returns (uint256);
}
