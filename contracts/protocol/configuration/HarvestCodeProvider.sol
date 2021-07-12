// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

//  helper contracts
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "./Modifiers.sol";

// interfaces
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IUniswapV2Pair } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IHarvestCodeProvider } from "../../interfaces/opty/IHarvestCodeProvider.sol";

/**
 * @title HarvestCodeProvider Contract
 * @author Opty.fi
 * @notice Abstraction layer to DeFi exchanges like Uniswap
 * @dev Contract for generating the codes for harvest tokens
 */
contract HarvestCodeProvider is IHarvestCodeProvider, Modifiers {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /**
     * @notice Uniswap V2 router contract address
     */
    IUniswapV2Router02 public uniswapV2Router02 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /**
     * @notice Uniswap V2 router contract address
     */
    IUniswapV2Router02 public sushiswapRouter = IUniswapV2Router02(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    /* solhint-disable no-empty-blocks */
    constructor(address _registry) public Modifiers(_registry) {}

    /* solhint-disable no-empty-blocks */

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getHarvestCodes(
        address payable _vault,
        address _rewardToken,
        address _underlyingToken,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
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
                        _vault,
                        uint256(-1)
                    )
                );
            }
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getHarvestLPTokenSushiCodes(
        address payable _vault,
        address _rewardToken,
        address _underlyingToken,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        address _token0 = IUniswapV2Pair(_underlyingToken).token0();
        address _token1 = IUniswapV2Pair(_underlyingToken).token1();
        if (_rewardTokenAmount > 0) {
            uint256[] memory _amounts0 =
                sushiswapRouter.getAmountsOut(_rewardTokenAmount.div(uint256(2)), _getPath(_token0, _rewardToken));
            uint256[] memory _amounts1 =
                sushiswapRouter.getAmountsOut(
                    _rewardTokenAmount.sub(_rewardTokenAmount.div(uint256(2))),
                    _getPath(_token1, _rewardToken)
                );
            if (_amounts0[_amounts0.length - 1] > 0 && _amounts1[_amounts1.length - 1] > 0) {
                _codes = new bytes[](4);
                _codes[0] = abi.encode(
                    _rewardToken,
                    abi.encodeWithSignature("approve(address,uint256)", address(sushiswapRouter), uint256(0))
                );
                _codes[1] = abi.encode(
                    _rewardToken,
                    abi.encodeWithSignature("approve(address,uint256)", address(sushiswapRouter), _rewardTokenAmount)
                );
                _codes[2] = abi.encode(
                    address(sushiswapRouter),
                    abi.encodeWithSignature(
                        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                        _rewardTokenAmount.div(uint256(2)),
                        uint256(0),
                        _getPath(_token0, _rewardToken),
                        _vault,
                        uint256(-1)
                    )
                );
                _codes[3] = abi.encode(
                    address(sushiswapRouter),
                    abi.encodeWithSignature(
                        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                        _rewardTokenAmount.sub(_rewardTokenAmount.div(uint256(2))),
                        uint256(0),
                        _getPath(_token1, _rewardToken),
                        _vault,
                        uint256(-1)
                    )
                );
            }
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getAddLiquiditySushiCodes(address payable _vault, address _underlyingToken)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        address _token0 = IUniswapV2Pair(_underlyingToken).token0();
        address _token1 = IUniswapV2Pair(_underlyingToken).token1();
        if (IERC20(_token0).balanceOf(_vault) > 0 && IERC20(_token1).balanceOf(_vault) > 0) {
            _codes = new bytes[](5);
            _codes[0] = abi.encode(
                _token0,
                abi.encodeWithSignature("approve(address,uint256)", address(sushiswapRouter), uint256(0))
            );
            _codes[1] = abi.encode(
                _token0,
                abi.encodeWithSignature(
                    "approve(address,uint256)",
                    address(sushiswapRouter),
                    IERC20(_token0).balanceOf(_vault)
                )
            );
            _codes[2] = abi.encode(
                _token1,
                abi.encodeWithSignature("approve(address,uint256)", address(sushiswapRouter), uint256(0))
            );
            _codes[3] = abi.encode(
                _token1,
                abi.encodeWithSignature(
                    "approve(address,uint256)",
                    address(sushiswapRouter),
                    IERC20(_token1).balanceOf(_vault)
                )
            );
            _codes[4] = abi.encode(
                address(sushiswapRouter),
                abi.encodeWithSignature(
                    "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
                    _token0,
                    _token1,
                    IERC20(_token0).balanceOf(_vault),
                    IERC20(_token1).balanceOf(_vault),
                    uint256(0),
                    uint256(0),
                    _vault,
                    uint256(-1)
                )
            );
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getOptimalTokenAmount(
        address _borrowToken,
        address _underlyingToken,
        uint256 _borrowTokenAmount
    ) public view override returns (uint256) {
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
     * @inheritdoc IHarvestCodeProvider
     */
    function rewardBalanceInUnderlyingTokens(
        address _rewardToken,
        address _underlyingToken,
        uint256 _amount
    ) public view override returns (uint256) {
        address _weth = uniswapV2Router02.WETH();
        uint256[] memory amounts = new uint256[](3);
        address[] memory path = new address[](3);
        path[0] = _rewardToken;
        path[1] = _weth;
        path[2] = _underlyingToken;
        amounts = uniswapV2Router02.getAmountsOut(_amount, path);
        return amounts[2];
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function rewardBalanceInLPTokensSushi(
        address _rewardToken,
        address _underlyingToken,
        uint256 _amount
    ) public view override returns (uint256) {
        address _weth = sushiswapRouter.WETH();
        uint256 amount;
        uint256[] memory amountsA = new uint256[](3);
        uint256[] memory amountsB = new uint256[](3);
        address[] memory path = new address[](3);
        address tokenA = IUniswapV2Pair(_underlyingToken).token0();
        address tokenB = IUniswapV2Pair(_underlyingToken).token1();
        path[0] = _rewardToken;
        path[1] = _weth;
        path[2] = tokenA;
        amountsA = sushiswapRouter.getAmountsOut(_amount.div(uint256(2)), path);
        path[2] = tokenB;
        amountsB = sushiswapRouter.getAmountsOut(_amount.div(uint256(2)), path);
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(_underlyingToken).getReserves();
        uint256 quoteAmount = sushiswapRouter.quote(amountsA[2], reserve0, reserve1);
        if (quoteAmount >= amountsB[2]) {
            amount = amountsB[2].mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(reserve1);
        } else {
            amount = quoteAmount.mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(reserve1);
        }
        return amount;
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getWETHInToken(address _underlyingToken, uint256 _amount) public view override returns (uint256) {
        address _weth = uniswapV2Router02.WETH();
        if (_underlyingToken == _weth) {
            return _amount;
        }
        address[] memory _path = new address[](2);
        _path[0] = _weth;
        _path[1] = _underlyingToken;
        uint256[] memory _amounts = uniswapV2Router02.getAmountsOut(_amount, _path);
        return _amounts[1];
    }

    function _getPath(address _underlyingToken, address _rewardToken) internal view returns (address[] memory _path) {
        address _weth = uniswapV2Router02.WETH();
        if (_underlyingToken == _weth) {
            _path = new address[](2);
            _path[0] = _rewardToken;
            _path[1] = _weth;
        } else {
            _path = new address[](3);
            _path[0] = _rewardToken;
            _path[1] = _weth;
            _path[2] = _underlyingToken;
        }
    }
}
