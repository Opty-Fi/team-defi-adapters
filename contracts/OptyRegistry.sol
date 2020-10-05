// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.10;

import "./utils/Modifiers.sol";
import "./libraries/Addresses.sol";

contract OptyRegistry is Modifiers {
    using Address for address;
    
    mapping(address => bool) public tokens;
    mapping(address => bool) public liquidityPools;
    mapping(address => uint) public liquidityPoolRatings;
    
    /**
     * @dev Sets the value for {owner}, {governance} and {strategist}, initializes
     * the dai, usdt, usdc, tusd, wbtc, weth defualt address.
     * 
     * All these token addresses are mutuable and can be changed afterwards only by owner,
     * governance and strategist
     */
    constructor () public Modifiers() {
        address dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
        address usdt = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
        address usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
        address tusd = address(0x0000000000085d4780B73119b644AE5ecd22b376);
        address wbtc = address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);
        address weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        enableTokens(dai);
        enableTokens(usdt);
        enableTokens(usdc);
        enableTokens(tusd);
        enableTokens(wbtc);
        enableTokens(weth);
    }
    
    /**
     * @dev Returns the status of the token's address is enabled or not after the function call.
     * 
     * Requirements:
     * 
     * - the caller should be either owner or governance or strategist
     * - `_token` cannot be a zero address`
     * - `_token` should be a contract's address and not EOA.
     */
    function enableTokens(address _token) public onlyValidAddress onlyOwner onlyGovernance onlyStrategist returns(bool) {
        require(_token != address(0), "token address is a zero address");
        require(address(_token).isContract(), "Call to non-contract address");
        require(!tokens[_token],"Pool is already enabled");
        tokens[_token] = true;
        return tokens[_token];
    }
    
    /**
     * @dev Returns the status of the token's address is disabled or not after the function call.
     * 
     * Requirements:
     * 
     * - the caller should be either owner or governance or strategist
     * - `_token` cannot be a zero address`
     * - `_token` should be a contract's address and not EOA.
     */
    function disableTokens(address _token) public onlyValidAddress onlyOwner onlyGovernance onlyStrategist returns(bool) {
        require(_token != address(0), "Token address is a zero address");
        require(address(_token).isContract(), "Call to non-contract address");
        require(tokens[_token], "Token address doesn't exist");
        tokens[_token] = false;
        return tokens[_token];
    }
    /**
     * @dev Returns the status of the liquidity pool whether it is enabled or not after the function call.
     * 
     * Requirements:
     * 
     * - the caller should be either owner
     * - `_poolToken` cannot be a zero address`
     * - `_poolToken` should be a contract's address and not EOA.
     */
    function enableLiquidityPool(address _poolToken) public onlyValidAddress onlyOwner returns(bool) {
        require(_poolToken != address(0), "poolToken address is a zero address");
        require(address(_poolToken).isContract(), "Call to non-contract address");
        require(!liquidityPools[_poolToken],"Pool is already enabled");
        liquidityPools[_poolToken] = true;
        return liquidityPools[_poolToken];
    }
    
    /**
     * @dev Returns the status of the liquidity pool whether it is enabled or not after the function call.
     * 
     * Requirements:
     * 
     * - the caller should be either owner or governance or strategist
     * - `_poolToken` cannot be a zero address`
     * - `_poolToken` should be a contract's address and not EOA.
     */
    function disableLiquidityPool(address _poolToken) public onlyValidAddress onlyOwner onlyGovernance onlyStrategist returns(bool) {
        require(_poolToken != address(0), "poolToken address is a zero address");
        require(address(_poolToken).isContract(), "Call to non-contract address");
        require(liquidityPools[_poolToken],"Pool is already disabled");
        liquidityPools[_poolToken] = false;
        return liquidityPools[_poolToken];
    }
    
    /**
     * @dev Returns the rating of the liquidity pool after the function call.
     * 
     * Requirements:
     * 
     * - the caller should be either owner or governance or strategist
     * - `_poolToken` cannot be a zero address`
     * - `_poolToken` should be a contract's address and not EOA.
     * - `_poolToken` should be enabled
     */
    function rateLiquidityPool(address _poolToken, uint _rate) public onlyValidAddress onlyGovernance returns(uint) {
        require(_poolToken != address(0), "poolToken address is a zero address");
        require(address(_poolToken).isContract(), "Call to non-contract address");
        require(liquidityPools[_poolToken],"Pool is not enabled");
        liquidityPoolRatings[_poolToken] = _rate;
        return liquidityPoolRatings[_poolToken];
    }
}
