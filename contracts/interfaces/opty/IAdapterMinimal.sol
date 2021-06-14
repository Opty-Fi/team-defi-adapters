// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface with minimal functions to be inhertied in all defi adapters
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as a layer for adding any new function which will be used in all defi adapters
 * Conventions used:
 *  - lp: liquidityPool
 *  - lpToken: liquidityPool token
 */
interface IAdapterMinimal {
    /**
     * @notice Returns pool value in underlying token (for all adapters except Curve for which the poolValue is
     * in US dollar) for the given lp and underlyingToken
     * @dev poolValue can be in US dollar (eg. Curve etc.) and in underlyingTokens (eg. Compound etc.)
     * @param _liquidityPool lp address from where to get the pool value
     * @param _underlyingToken address of underlying token for which to get the pool value
     * @return pool value in underlying token for the given lp and underlying token
     */
    function getPoolValue(address _liquidityPool, address _underlyingToken) external view returns (uint256);

    /**
     * @dev Get batch of function calls for depositing specified amount of underlying token in the lp provided
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying tokens supported by the given lp
     * @param _liquidityPool lp address where to depsoit
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
     * @dev Get batch of function calls for depositing vault's full balance in underlying tokens in the specified lp
     * @param _optyVault Vault contract address
     * @param _underlyingTokens List of underlying tokens supported by the given lp
     * @param _liquidityPool lp address where to deposit
     * @return _codes Returns a bytes value to be executed
     */
    function getDepositAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get batch of function calls for redeeming specified amount of lpTokens held in the vault
     * @dev Redeem speicified `amount` of `liquidityPoolToken` and sends the `underlyingToken` to the caller`
     * @param _optyVault Address of vault contract
     * @param _underlyingTokens List of underlying tokens supported by the given lp
     * @param _liquidityPool lp address from where to withdraw
     * @param _amount amount of underlying token to redeem from the given lp
     * @return _codes Returns a bytes value to be executed
     */
    function getWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _amount
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get batch of function calls for redeeming full balance of lpTokens held in the vault
     * @dev Redeem full `amount` of `liquidityPoolToken` and sends the `underlyingToken` to the caller`
     * @param _optyVault Address of vault contract
     * @param _underlyingTokens List of underlying tokens supported by the given lp
     * @param _liquidityPool lp address from where to withdraw
     * @return _codes Returns a bytes value to be executed
     */
    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view returns (bytes[] memory _codes);

    /**
     * @notice Get the lp token address
     * @param _underlyingToken Underlying token address
     * @param _liquidityPool Liquidity Pool address from where to get the lpToken
     * @return Returns the lp token address
     */
    function getLiquidityPoolToken(address _underlyingToken, address _liquidityPool) external view returns (address);

    /**
     * @notice Get the underlying token addresses given the lp
     * @param _liquidityPool Liquidity Pool address from where to get the lpToken
     * @param _liquidityPoolToken lp's token address
     * @return _underlyingTokens Returns the array of underlying token addresses
     */
    function getUnderlyingTokens(address _liquidityPool, address _liquidityPoolToken)
        external
        view
        returns (address[] memory _underlyingTokens);

    /**
     * @dev Returns the market price in underlying for all the shares held in a specified lp
     * @param _optyVault Address of vault contract
     * @param _underlyingToken Underlying token address for which to get the balance
     * @param _liquidityPool lp address which holds the given underlying token
     * @return Returns the amount of underlying token balance
     */
    function getAllAmountInToken(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256);

    /**
     * @notice Get the amount of shares in the specified lp
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address supported by given lp
     * @param _liquidityPool lp address from where to get the balance of lpToken
     * @return Returns the balance of lp token (lpToken)
     */
    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view returns (uint256);

    /**
     * @notice Returns the equivalent value of underlying token for given liquidityPoolTokenAmount
     * @param _underlyingToken Underlying token address supported by given lp
     * @param _liquidityPool lp address from where to get the balance of lpToken
     * @param _liquidityPoolTokenAmount lpToken amount for which to get equivalent underlyingToken amount
     * @return Returns the equivalent amount of underlying token for given liquidityPoolTokenAmount
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) external view returns (uint256);

    /**
     * @dev Returns the equivalent value of liquidityPoolToken for given underlyingTokenAmount
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp address from where to redeem the tokens
     * @param _underlyingTokenAmount amount of underlying token to be calculated w.r.t. lpToken
     * @return Returns the calculated amount lpToken equivalent to underlyingTokenAmount
     */
    function calculateAmountInLPToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _underlyingTokenAmount
    ) external view returns (uint256);

    /**
     * @dev Returns the market value in underlying token of the shares in the specified lp
     * @param _optyVault Vault contract address
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp address from where to redeem the tokens
     * @param _redeemAmount amount of token to be redeemed
     * @return _amount Returns the market value in underlying token of the shares in the given lp
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
     * @param _underlyingToken Underlying token address for the given lp
     * @param _liquidityPool lp address from where to redeem the tokens
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
     * @notice Returns reward token address for the lp provided
     * @param _liquidityPool lp address for which to get the rewatf token address
     * @return Returns the reward token supported by given lp
     */
    function getRewardToken(address _liquidityPool) external view returns (address);

    /**
     * @notice Returns whether the protocol can stake lp token
     * @param _liquidityPool lp address for which to check if staking is enabled or not
     * @return Returns a boolean true if lp token staking is allowed else false if it not enabled
     */
    function canStake(address _liquidityPool) external view returns (bool);

    /**
     * @notice Sets the percentage of max deposit value for the given lp
     * @param _liquidityPool lp address for which to set max deposit percentage
     * @param _maxDepositPoolPct Pool's Max deposit percentage to be set for the given lp
     */
    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external;

    /**
     * @notice Sets the default percentage of max deposit pool value
     * @param _maxDepositPoolPctDefault Pool's Max deposit percentage to be set as default value
     */
    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) external;
}
