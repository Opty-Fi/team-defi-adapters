// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { SafeERC20, IERC20, SafeMath } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "./Modifiers.sol";
import { IHarvestCodeProvider } from "../../interfaces/opty/IHarvestCodeProvider.sol";

/**
 * @title HarvestCodeProvider
 *
 * @author Opty.fi
 *
 * @dev Abstraction layer to DeFi exchanges like Uniswap
 */
contract HarvestCodeProvider is IHarvestCodeProvider, Modifiers {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
     * @notice Uniswap V2 router contract address
     */
    IUniswapV2Router02 public uniswapV2Router02 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /* solhint-disable no-empty-blocks */
    constructor(address _registry) public Modifiers(_registry) {}

    /* solhint-disable no-empty-blocks */
    /**
     * @dev Get the codes for harvesting the tokens using uniswap router
     *
     * @param _optyVault Address of Vault Contract
     * @param _rewardToken Reward token address
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _rewardTokenAmount reward token amount to harvest
     *
     * @return _codes Array of harvest codes which can be executed to complete the execution of
     *         harvesting of reward token
     *
     * Requirements:
     *
     * - `_rewardTokenAmount` should be greater than 0.
     */
    function getHarvestCodes(
        address payable _optyVault,
        address _rewardToken,
        address _underlyingToken,
        uint256 _rewardTokenAmount
    ) external view override returns (bytes[] memory _codes) {
        address _weth = uniswapV2Router02.WETH();
        if (_rewardTokenAmount > 0) {
            address[] memory _path;
            uint256[] memory _amounts;
            if (_underlyingToken == _weth) {
                _path = new address[](2);
                _path[0] = _rewardToken;
                _path[1] = _weth;
                _amounts = uniswapV2Router02.getAmountsOut(_rewardTokenAmount, _path);
            } else {
                _path = new address[](3);
                _path[0] = _rewardToken;
                _path[1] = _weth;
                _path[2] = _underlyingToken;
                _amounts = uniswapV2Router02.getAmountsOut(_rewardTokenAmount, _path);
            }
            if (_amounts[_path.length - 1] > 0) {
                _codes = new bytes[](3);
                _codes[0] = abi.encode(
                    _rewardToken,
                    abi.encodeWithSignature("approve(address,uint256)", address(uniswapV2Router02), uint256(0))
                );
                _codes[1] = abi.encode(
                    _rewardToken,
                    abi.encodeWithSignature("approve(address,uint256)", address(uniswapV2Router02), _rewardTokenAmount)
                );
                _codes[2] = abi.encode(
                    address(uniswapV2Router02),
                    abi.encodeWithSignature(
                        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                        _rewardTokenAmount,
                        uint256(0),
                        _path,
                        _optyVault,
                        uint256(-1)
                    )
                );
            }
        }
    }

    /**
     * @dev Get the optimal amount for the token
     *
     * @param _borrowToken Address of token which has to be borrowed
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _borrowTokenAmount amount of token to borrow
     *
     * @return borrow token's optimal amount
     */
    function getOptimalTokenAmount(
        address _borrowToken,
        address _underlyingToken,
        uint256 _borrowTokenAmount
    ) external view override returns (uint256) {
        address _weth = uniswapV2Router02.WETH();
        if (_borrowTokenAmount > 0) {
            address[] memory _path;
            uint256[] memory _amounts;
            if (_underlyingToken == _weth) {
                _path = new address[](2);
                _path[0] = _borrowToken;
                _path[1] = _weth;
                _amounts = uniswapV2Router02.getAmountsOut(_borrowTokenAmount, _path);
            } else if (_borrowToken == _weth) {
                _path = new address[](2);
                _path[0] = _weth;
                _path[1] = _underlyingToken;
                _amounts = uniswapV2Router02.getAmountsOut(_borrowTokenAmount, _path);
            } else {
                _path = new address[](3);
                _path[0] = _borrowToken;
                _path[1] = _weth;
                _path[2] = _underlyingToken;
                _amounts = uniswapV2Router02.getAmountsOut(_borrowTokenAmount, _path);
            }
            return _amounts[_path.length - 1];
        }
        return uint256(0);
    }

    /**
     * @dev Get the underlying token amount equivalent to reward token amount
     *
     * @param _rewardToken Reward token address
     * @param _underlyingToken Token address acting as underlying Asset for the vault contract
     * @param _amount reward token balance amount
     *
     * @return equivalent reward token balance in Underlying token value
     */
    function rewardBalanceInUnderlyingTokens(
        address _rewardToken,
        address _underlyingToken,
        uint256 _amount
    ) external view override returns (uint256) {
        address _weth = uniswapV2Router02.WETH();
        uint256[] memory amounts = new uint256[](3);
        address[] memory path = new address[](3);
        path[0] = _rewardToken;
        path[1] = _weth;
        path[2] = _underlyingToken;
        amounts = uniswapV2Router02.getAmountsOut(_amount, path);
        return amounts[2];
    }
}
