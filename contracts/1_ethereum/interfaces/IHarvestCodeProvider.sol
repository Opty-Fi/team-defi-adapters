// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for HarvestCodeProvider Contract
 * @author Opty.fi
 * @notice Abstraction layer to DeFi exchanges like Uniswap
 * @dev Interface for facilitating the logic for harvest reward token codes
 */
interface IHarvestCodeProvider {
    struct Tolerance {
        address liquidityPool;
        uint256 tolerance;
    }

    struct Slippage {
        address liquidityPool;
        address wantToken;
        uint256 slippage;
    }

    /**
     * @dev Get the codes for harvesting the tokens using uniswap router
     * @param _vault Vault contract address
     * @param _rewardToken Reward token address
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _rewardTokenAmount reward token amount to harvest
     * @return _codes List of harvest codes for harvesting reward tokens
     */
    function getHarvestCodes(
        address payable _vault,
        address _rewardToken,
        address _underlyingToken,
        uint256 _rewardTokenAmount
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get the codes for adding liquidity using Sushiswap or Uniswap router
     * @param _router Address of Router Contract
     * @param _vault Address of Vault Contract
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @return _codes List of codes for adding liquidity on Uniswap or Sushiswap
     */
    function getAddLiquidityCodes(
        address _router,
        address payable _vault,
        address _underlyingToken
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get the optimal amount for the token while borrow
     * @param _borrowToken Address of token which has to be borrowed
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _borrowTokenAmount amount of token to borrow
     * @return borrow token's optimal amount
     */
    function getOptimalTokenAmount(
        address _borrowToken,
        address _underlyingToken,
        uint256 _borrowTokenAmount
    ) external view returns (uint256);

    /**
     * @dev Get the underlying token amount equivalent to reward token amount
     * @param _rewardToken Reward token address
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _amount reward token balance amount
     * @return equivalent reward token balance in Underlying token value
     */
    function rewardBalanceInUnderlyingTokens(
        address _rewardToken,
        address _underlyingToken,
        uint256 _amount
    ) external view returns (uint256);

    /**
     * @dev Get the no. of tokens equivalent to the amount provided
     * @param _underlyingToken Underlying token address
     * @param _amount amount in weth
     * @return equivalent WETH token balance in Underlying token value
     */
    function getWETHInToken(address _underlyingToken, uint256 _amount) external view returns (uint256);

    /**
     * @dev Sets the OptyFi Oracle contract
     * @param _optyFiOracle OptyFi Oracle contract address
     */
    function setOptyFiOracle(address _optyFiOracle) external;

    /**
     * @notice Sets slippage per want token of pair contract
     * @param _slippages array of Slippage structs that links liquidity pools to slippage per want token
     */
    function setLiquidityPoolToWantTokenToSlippage(Slippage[] calldata _slippages) external;

    /**
     * @notice Sets the price deviation tolerance for a set of liquidity pools
     * @param _tolerances array of Tolerance structs that links liquidity pools to tolerances
     */
    function setLiquidityPoolToTolerance(Tolerance[] calldata _tolerances) external;
}
