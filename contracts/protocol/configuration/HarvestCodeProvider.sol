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
     * @notice Sushiswap router contract address
     */
    IUniswapV2Router02 public sushiswapRouter = IUniswapV2Router02(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    /**
     * @notice SUSHI token contract address
     */
    address public constant SUSHI = address(0x6B3595068778DD592e39A122f4f5a5cF09C90fE2);

    /**
     * @notice UNI token contract address
     */
    address public constant UNI = address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);

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
        if (_rewardTokenAmount > 0) {
            if (_rewardToken == SUSHI) {
                address _token0 = IUniswapV2Pair(_underlyingToken).token0();
                address _token1 = IUniswapV2Pair(_underlyingToken).token1();
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
                        abi.encodeWithSignature(
                            "approve(address,uint256)",
                            address(sushiswapRouter),
                            _rewardTokenAmount
                        )
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
            } else if (_rewardToken == UNI) {
                address _token0 = IUniswapV2Pair(_underlyingToken).token0();
                address _token1 = IUniswapV2Pair(_underlyingToken).token1();
                uint256[] memory _amounts0 =
                    uniswapV2Router02.getAmountsOut(
                        _rewardTokenAmount.div(uint256(2)),
                        _getPath(_token0, _rewardToken)
                    );
                uint256[] memory _amounts1 =
                    uniswapV2Router02.getAmountsOut(
                        _rewardTokenAmount.sub(_rewardTokenAmount.div(uint256(2))),
                        _getPath(_token1, _rewardToken)
                    );
                if (_amounts0[_amounts0.length - 1] > 0 && _amounts1[_amounts1.length - 1] > 0) {
                    _codes = new bytes[](4);
                    _codes[0] = abi.encode(
                        _rewardToken,
                        abi.encodeWithSignature("approve(address,uint256)", address(uniswapV2Router02), uint256(0))
                    );
                    _codes[1] = abi.encode(
                        _rewardToken,
                        abi.encodeWithSignature(
                            "approve(address,uint256)",
                            address(uniswapV2Router02),
                            _rewardTokenAmount
                        )
                    );
                    _codes[2] = abi.encode(
                        address(uniswapV2Router02),
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
                        address(uniswapV2Router02),
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
            } else {
                uint256[] memory _amounts =
                    uniswapV2Router02.getAmountsOut(_rewardTokenAmount, _getPath(_underlyingToken, _rewardToken));
                if (_amounts[_amounts.length - 1] > 0) {
                    _codes = new bytes[](3);
                    _codes[0] = abi.encode(
                        _rewardToken,
                        abi.encodeWithSignature("approve(address,uint256)", address(uniswapV2Router02), uint256(0))
                    );
                    _codes[1] = abi.encode(
                        _rewardToken,
                        abi.encodeWithSignature(
                            "approve(address,uint256)",
                            address(uniswapV2Router02),
                            _rewardTokenAmount
                        )
                    );
                    _codes[2] = abi.encode(
                        address(uniswapV2Router02),
                        abi.encodeWithSignature(
                            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                            _rewardTokenAmount,
                            uint256(0),
                            _getPath(_underlyingToken, _rewardToken),
                            _vault,
                            uint256(-1)
                        )
                    );
                }
            }
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getAddLiquidityCodes(
        address _router,
        address payable _vault,
        address _underlyingToken
    ) public view override returns (bytes[] memory _codes) {
        address _token0 = IUniswapV2Pair(_underlyingToken).token0();
        address _token1 = IUniswapV2Pair(_underlyingToken).token1();
        if (IERC20(_token0).balanceOf(_vault) > 0 && IERC20(_token1).balanceOf(_vault) > 0) {
            if (_router == address(sushiswapRouter)) {
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
            } else if (_router == address(uniswapV2Router02)) {
                _codes = new bytes[](5);
                _codes[0] = abi.encode(
                    _token0,
                    abi.encodeWithSignature("approve(address,uint256)", address(uniswapV2Router02), uint256(0))
                );
                _codes[1] = abi.encode(
                    _token0,
                    abi.encodeWithSignature(
                        "approve(address,uint256)",
                        address(uniswapV2Router02),
                        IERC20(_token0).balanceOf(_vault)
                    )
                );
                _codes[2] = abi.encode(
                    _token1,
                    abi.encodeWithSignature("approve(address,uint256)", address(uniswapV2Router02), uint256(0))
                );
                _codes[3] = abi.encode(
                    _token1,
                    abi.encodeWithSignature(
                        "approve(address,uint256)",
                        address(uniswapV2Router02),
                        IERC20(_token1).balanceOf(_vault)
                    )
                );
                _codes[4] = abi.encode(
                    address(uniswapV2Router02),
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
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getOptimalTokenAmount(
        address _borrowToken,
        address _underlyingToken,
        uint256 _borrowTokenAmount
    ) public view override returns (uint256) {
        if (_borrowTokenAmount > 0) {
            uint256[] memory _amounts;
            _amounts = uniswapV2Router02.getAmountsOut(_borrowTokenAmount, _getPath(_underlyingToken, _borrowToken));
            return _amounts[_amounts.length - 1];
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
        uint256[] memory _amountsA;
        if (_rewardToken == SUSHI) {
            uint256 _finalAmount;
            address _tokenA = IUniswapV2Pair(_underlyingToken).token0();
            address _tokenB = IUniswapV2Pair(_underlyingToken).token1();
            _amountsA = sushiswapRouter.getAmountsOut(_amount.div(uint256(2)), _getPath(_underlyingToken, _tokenA));
            uint256[] memory _amountsB =
                sushiswapRouter.getAmountsOut(_amount.div(uint256(2)), _getPath(_underlyingToken, _tokenB));
            (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(_underlyingToken).getReserves();
            uint256 quoteAmount = sushiswapRouter.quote(_amountsA[_amountsA.length - 1], reserve0, reserve1);
            if (quoteAmount >= _amountsB[_amountsB.length - 1]) {
                _finalAmount = _amountsB[_amountsB.length - 1].mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(
                    reserve1
                );
            } else {
                _finalAmount = quoteAmount.mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(reserve1);
            }
            return _finalAmount;
        } else if (_rewardToken == UNI) {
            uint256 _finalAmount;
            address _tokenA = IUniswapV2Pair(_underlyingToken).token0();
            address _tokenB = IUniswapV2Pair(_underlyingToken).token1();
            _amountsA = uniswapV2Router02.getAmountsOut(_amount.div(uint256(2)), _getPath(_underlyingToken, _tokenA));
            uint256[] memory _amountsB =
                uniswapV2Router02.getAmountsOut(_amount.div(uint256(2)), _getPath(_underlyingToken, _tokenB));
            (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(_underlyingToken).getReserves();
            uint256 quoteAmount = uniswapV2Router02.quote(_amountsA[_amountsA.length - 1], reserve0, reserve1);
            if (quoteAmount >= _amountsB[_amountsB.length - 1]) {
                _finalAmount = _amountsB[_amountsB.length - 1].mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(
                    reserve1
                );
            } else {
                _finalAmount = quoteAmount.mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(reserve1);
            }
            return _finalAmount;
        } else {
            _amountsA = uniswapV2Router02.getAmountsOut(_amount, _getPath(_underlyingToken, _rewardToken));
            return _amountsA[_amountsA.length - 1];
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getWETHInToken(address _underlyingToken, uint256 _amount) public view override returns (uint256) {
        address _weth = uniswapV2Router02.WETH();
        if (_underlyingToken == _weth) {
            return _amount;
        }
        uint256[] memory _amounts = uniswapV2Router02.getAmountsOut(_amount, _getPath(_underlyingToken, _weth));
        return _amounts[1];
    }

    function _getPath(address _finalToken, address _initialToken) internal view returns (address[] memory _path) {
        address _weth = uniswapV2Router02.WETH();
        if (_finalToken == _weth) {
            _path = new address[](2);
            _path[0] = _initialToken;
            _path[1] = _weth;
        }
        if (_initialToken == _weth) {
            _path = new address[](2);
            _path[0] = _weth;
            _path[1] = _finalToken;
        } else {
            _path = new address[](3);
            _path[0] = _initialToken;
            _path[1] = _weth;
            _path[2] = _finalToken;
        }
    }
}
