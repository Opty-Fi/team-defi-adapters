// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code provider/adapter
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for any new defi protocol
 */
interface IAdapterMinimal {
    /**
     * @notice NOT THERE IN ONLY CURVEPOOL, CURVESWAP
     * @notice Returns pool value in underlying token for the given liquidity pool and underlying token
     * @dev poolValue can be in US dollar (eg. Curve etc.) and in underlyingTokens (eg. Compound etc.)
     * @param _liquidityPool liquidity Pool address from where to get the pool value
     * @param _underlyingToken address of underlying token for which to get the pool value
     * @return pool value in underlying token for the given liquidity pool and underlying token
     */
    function getPoolValue(address _liquidityPool, address _underlyingToken) external view returns (uint256);

    /**
     * @dev Get the codes for depositing specified amount of underlying token in the liquidity pool provided
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
     * @param _liquidityPool liquidity Pool address where to depsoit
     * @param _amounts  List of underlying token amounts
     * @return _codes Returns a bytes value to be executed
     */
    function getDepositSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256[] memory _amounts
    ) external view returns (bytes[] memory _codes);

    /**
     * @dev Get codes for depositing vault's full balance in underlying tokens in the specified liquidity pool
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
     * @param _liquidityPool liquidity Pool address where to deposit
     * @return _codes Returns a bytes value to be executed
     */
    function getDepositAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get the codes for redeeming specified amount of lpTokens held in the vault
     * @dev Redeem speicified `amount` of `liquidityPoolToken` and sends the `underlyingToken` to the caller`
     * @param _optyVault Address of vault contract
     * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
     * @param _liquidityPool liquidity Pool address from where to withdraw
     * @param _amount amount of underlying token to redeem from the given liquidity pool
     * @return _codes Returns a bytes value to be executed
     */
    function getWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _amount
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get the codes for redeeming full balance of lpTokens held in the vault
     * @dev Redeem full `amount` of `liquidityPoolToken` and sends the `underlyingToken` to the caller`
     * @param _optyVault Address of vault contract
     * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
     * @param _liquidityPool liquidity Pool address from where to withdraw
     * @return _codes Returns a bytes value to be executed
     */
    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get the liquidity pool token address
     * @param _underlyingToken Underlying token address
     * @param _liquidityPool Liquidity Pool address from where to get the lpToken
     * @return Returns the liquidity pool token address
     */
    function getLiquidityPoolToken(address _underlyingToken, address _liquidityPool) external view returns (address);

    /**
     * @notice Get the underlying token addresses given the liquidityPool
     * @param _liquidityPool Liquidity Pool address from where to get the lpToken
     * @param _liquidityPoolToken liquidity pool's token address
     * @return _underlyingTokens Returns the array of underlying token addresses
     */
    function getUnderlyingTokens(address _liquidityPool, address _liquidityPoolToken)
        external
        view
        returns (address[] memory _underlyingTokens);

    /**
     * @dev Returns the market price in underlying for all the shares held in a specified liquidity pool
     * @param _optyVault Address of vault contract
     * @param _underlyingToken Underlying token address for which to get the balance
     * @param _liquidityPool liquidity Pool address which holds the given underlying token
     * @return Returns the amount of underlying token balance
     */
    function getAllAmountInToken(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256);

    /**
     * @notice Get the amount of shares in the specified liquidity pool
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address supported by given liquidityPool
     * @param _liquidityPool liquidity pool address from where to get the balance of lpToken
     * @return Returns the balance of liquidity pool token (lpToken)
     */
    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256);

    /**
     * @notice NOT THERE IN ONLY DYDX
     * @notice Returns the equivalent value of underlying token for given liquidityPoolTokenAmount
     * @param _underlyingToken Underlying token address supported by given liquidityPool
     * @param _liquidityPool liquidity pool address from where to get the balance of lpToken
     * @param _liquidityPoolTokenAmount lpToken amount for which to get equivalent underlyingToken amount
     * @return Returns the equivalent amount of underlying token for given liquidityPoolTokenAmount
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) external view returns (uint256);

    /**
     * @notice NOT THERE IN DYDX, CURVEPOOL AND CURVESWAP
     * @dev Returns the equivalent value of liquidityPoolToken for given underlyingTokenAmount
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address from where to redeem the tokens
     * @param _underlyingTokenAmount amount of underlying token to be calculated w.r.t. lpToken
     * @return Returns the calculated amount lpToken equivalent to underlyingTokenAmount
     */
    function calculateAmountInLPToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _underlyingTokenAmount
    ) external view returns (uint256);

    /**
     * @dev Returns the market value in underlying token of the shares in the specified liquidity pool
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address from where to redeem the tokens
     * @param _redeemAmount amount of token to be redeemed
     * @return _amount Returns the market value in underlying token of the shares in the given liquidity pool
     */
    function calculateRedeemableLPTokenAmount(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (uint256 _amount);

    /**
     * @notice Checks whether the vault has enough lp token (+ rewards) to redeem for the specified amount of shares
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given liquidity pool
     * @param _liquidityPool liquidityPool address from where to redeem the tokens
     * @param _redeemAmount amount of lpToken (+ rewards) enough to redeem
     * @return Returns a boolean true if lpToken (+ rewards) to redeem for given amount is enough else it returns false
     */
    function isRedeemableAmountSufficient(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view returns (bool);

    /**
     * @notice Returns reward token address for the liquidity pool provided
     * @param _liquidityPool liquidityPool address for which to get the rewatf token address
     * @return Returns the reward token supported by given liquidity pool
     */
    function getRewardToken(address _liquidityPool) external view returns (address);

    /**
     * @notice Returns whether the protocol can stake liquidityPool token
     * @param _liquidityPool liquidityPool address for which to check if staking is enabled or not
     * @return Returns a boolean true if liquidityPool token staking is allowed else false if it not enabled
     */
    function canStake(address _liquidityPool) external view returns (bool);
}
