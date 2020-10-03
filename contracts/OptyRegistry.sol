// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.10;

library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }

}

/**
 * @dev Contract used to keep all the modifiers at one place
 */
contract Modifiers {
    
    address public owner;
    address public governance;
    address public strategist;
    
    /**
     * @dev Sets the owner, governance and strategist while deploying the contract
     */
    constructor () internal {
        owner = msg.sender;
        governance = msg.sender;
        strategist = msg.sender;
    }
    
    /**
     * @dev Modifier to check if the address is zero address or not
     */
    modifier onlyValidAddress(){
        require(msg.sender != address(0), "caller is zero address");
        _;
    }
    
    /**
     * @dev Modifier to check caller is owner or not
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "caller is not owner");
        _;
    }
    
    /**
     * @dev Modifier to check caller is governance or not
     */
    modifier onlyGovernance() {
        require(msg.sender == governance, "caller is not having governance");
        _;
    }
    
    /**
     * @dev Modifier to check caller is strategist or not
     */
    modifier onlyStrategist() {
        require(msg.sender == strategist, "Caller is not strategist");
        _;
    }
}

/**
 * @dev Contract for Opty Strategy Registry
 */
contract OptyRegistry is Modifiers {
    using Address for address;
    
    mapping(address => bool) public tokens;
    
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
        require(!address(_token).isContract(), "Call to non-contract address");
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
        require(!address(_token).isContract(), "Call to non-contract address");
        require(tokens[_token], "Token address doesn't exist");
        tokens[_token] = false;
        return tokens[_token];
    }
}
