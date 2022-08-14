// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

//  helper contracts
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "../earn-protocol-configuration/contracts/Modifiers.sol";

// interfaces
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IUniswapV2Pair } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import { IUniswapV2Factory } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IHarvestCodeProvider } from "./interfaces/IHarvestCodeProvider.sol";
import { IOptyFiOracle } from "../utils/optyfi-oracle/contracts/interfaces/IOptyFiOracle.sol";

/**
 * @title HarvestCodeProvider Contract
 * @author Opty.fi
 * @notice Abstraction layer to DeFi exchanges like Uniswap
 * @dev Contract for generating the codes for harvest tokens
 */
contract HarvestCodeProvider is IHarvestCodeProvider, Modifiers {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /** @notice Uniswap V2 router contract address */
    address public constant uniswapV2Router02 = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /** @notice Sushiswap router contract address */
    address public constant sushiswapRouter = address(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    /** @notice Sushiswap factory contract on Ethereum mainnet */
    IUniswapV2Factory public constant sushiswapFactory = IUniswapV2Factory(0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac);

    /** @notice WETH address */
    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    /** @notice SUSHI token contract address */
    address public constant SUSHI = address(0x6B3595068778DD592e39A122f4f5a5cF09C90fE2);

    /** @notice UNI token contract address */
    address public constant UNI = address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);

    /** @notice CRV token contract address */
    address public constant CRV = address(0xD533a949740bb3306d119CC777fa900bA034cd52);

    /** @notice COMP token contract address */
    address public constant COMP = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);

    /** @notice FARM token contract address */
    address public constant FARM = address(0xa0246c9032bC3A600820415aE600c6388619A14D);

    /** @notice CREAM token contract address */
    address public constant CREAM = address(0x2ba592F78dB6436527729929AAf6c908497cB200);

    /** @notice Sushiswap USDC-WETH liquidity pool address */
    address public constant USDC_WETH = address(0x397FF1542f962076d0BFE58eA045FfA2d347ACa0);

    /** @notice Sushiswap CRV-WETH liquidity pool address */
    address public constant CRV_WETH = address(0x58Dc5a51fE44589BEb22E8CE67720B5BC5378009);

    /** @notice Sushiswap SUSHI-WETH liquidity pool address */
    address public constant SUSHI_WETH = address(0x795065dCc9f64b5614C407a6EFDC400DA6221FB0);

    /** @notice Sushiswap COMP-WETH liquidity pool address */
    address public constant COMP_WETH = address(0x31503dcb60119A812feE820bb7042752019F2355);

    /** @notice Sushiswap CREAM-WETH liquidity pool address */
    address public constant CREAM_WETH = address(0xf169CeA51EB51774cF107c88309717ddA20be167);

    /** @notice Denominator for basis points calculations */
    uint256 public constant DENOMINATOR = 10000;

    /** @notice OptyFi Oracle contract on Ethereum mainnet */
    IOptyFiOracle public optyFiOracle;

    /** @notice Maps liquidity pool to maximum price deviation */
    mapping(address => uint256) public liquidityPoolToTolerance;

    /** @notice Maps liquidity pool to want token to slippage */
    mapping(address => mapping(address => uint256)) public liquidityPoolToWantTokenToSlippage;

    constructor(address _registry, address _optyFiOracle) public Modifiers(_registry) {
        optyFiOracle = IOptyFiOracle(_optyFiOracle);
        liquidityPoolToTolerance[USDC_WETH] = uint256(100); // 1%
        liquidityPoolToTolerance[CRV_WETH] = uint256(100); // 1%
        liquidityPoolToTolerance[SUSHI_WETH] = uint256(100); // 1%
        liquidityPoolToTolerance[COMP_WETH] = uint256(100); // 1%
        liquidityPoolToTolerance[CREAM_WETH] = uint256(100); // 1%
        liquidityPoolToWantTokenToSlippage[CRV_WETH][WETH] = uint256(100); // 1%
        liquidityPoolToWantTokenToSlippage[SUSHI_WETH][WETH] = uint256(100); // 1%
        liquidityPoolToWantTokenToSlippage[COMP_WETH][WETH] = uint256(100); // 1%
        liquidityPoolToWantTokenToSlippage[CREAM_WETH][WETH] = uint256(100); // 1%
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function setOptyFiOracle(address _optyFiOracle) external override onlyOperator {
        optyFiOracle = IOptyFiOracle(_optyFiOracle);
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function setLiquidityPoolToWantTokenToSlippage(Slippage[] calldata _slippages) external override onlyRiskOperator {
        uint256 _len = _slippages.length;
        for (uint256 i; i < _len; i++) {
            liquidityPoolToWantTokenToSlippage[_slippages[i].liquidityPool][_slippages[i].wantToken] = _slippages[i]
                .slippage;
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function setLiquidityPoolToTolerance(Tolerance[] calldata _tolerances) external override onlyRiskOperator {
        uint256 _len = _tolerances.length;
        for (uint256 i; i < _len; i++) {
            liquidityPoolToTolerance[_tolerances[i].liquidityPool] = _tolerances[i].tolerance;
        }
    }

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
            if (_rewardToken != _underlyingToken) {
                uint256[] memory amounts =
                    IUniswapV2Router02(uniswapV2Router02).getAmountsOut(
                        _rewardTokenAmount,
                        _getPath(_rewardToken, _underlyingToken)
                    );
                if (amounts[amounts.length - 1] > 0) {
                    uint256 slippage = _getSlippageCheckPoolBalanced(_rewardToken, _underlyingToken);
                    uint256 swapOutAmount = _calculateSwapOutAmount(_rewardTokenAmount, _rewardToken, _underlyingToken);
                    _codes = new bytes[](3);
                    _codes[0] = abi.encode(
                        _rewardToken,
                        abi.encodeWithSignature("approve(address,uint256)", uniswapV2Router02, uint256(0))
                    );
                    _codes[1] = abi.encode(
                        _rewardToken,
                        abi.encodeWithSignature("approve(address,uint256)", uniswapV2Router02, _rewardTokenAmount)
                    );
                    _codes[2] = abi.encode(
                        uniswapV2Router02,
                        abi.encodeWithSignature(
                            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
                            _rewardTokenAmount,
                            swapOutAmount.mul(DENOMINATOR.sub(slippage)).div(DENOMINATOR),
                            _getPath(_rewardToken, _underlyingToken),
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
            _codes = new bytes[](5);
            _codes[0] = abi.encode(_token0, abi.encodeWithSignature("approve(address,uint256)", _router, uint256(0)));
            _codes[1] = abi.encode(
                _token0,
                abi.encodeWithSignature("approve(address,uint256)", _router, IERC20(_token0).balanceOf(_vault))
            );
            _codes[2] = abi.encode(_token1, abi.encodeWithSignature("approve(address,uint256)", _router, uint256(0)));
            _codes[3] = abi.encode(
                _token1,
                abi.encodeWithSignature("approve(address,uint256)", _router, IERC20(_token1).balanceOf(_vault))
            );
            _codes[4] = abi.encode(
                _router,
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
        if (_borrowTokenAmount > 0) {
            try
                IUniswapV2Router02(uniswapV2Router02).getAmountsOut(
                    _borrowTokenAmount,
                    _getPath(_borrowToken, _underlyingToken)
                )
            returns (uint256[] memory _amounts) {
                return _amounts[_amounts.length - 1];
            } catch {
                return uint256(0);
            }
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
        if (_amount > 0) {
            if (_rewardToken == SUSHI) {
                return
                    _getRewardBalanceInUnderlyingTokensSushiOrUni(
                        _rewardToken,
                        _underlyingToken,
                        _amount,
                        sushiswapRouter
                    );
            } else if (_rewardToken == UNI) {
                return
                    _getRewardBalanceInUnderlyingTokensSushiOrUni(
                        _rewardToken,
                        _underlyingToken,
                        _amount,
                        uniswapV2Router02
                    );
            } else {
                try
                    IUniswapV2Router02(uniswapV2Router02).getAmountsOut(
                        _amount,
                        _getPath(_rewardToken, _underlyingToken)
                    )
                returns (uint256[] memory _amountsA) {
                    return _amountsA[_amountsA.length - 1];
                } catch {
                    return uint256(0);
                }
            }
        }
    }

    /**
     * @inheritdoc IHarvestCodeProvider
     */
    function getWETHInToken(address _underlyingToken, uint256 _amount) public view override returns (uint256) {
        address _weth = IUniswapV2Router02(uniswapV2Router02).WETH();
        if (_underlyingToken == _weth) {
            return _amount;
        }
        uint256[] memory _amounts =
            IUniswapV2Router02(uniswapV2Router02).getAmountsOut(_amount, _getPath(_weth, _underlyingToken));
        return _amounts[1];
    }

    function _getRewardBalanceInUnderlyingTokensSushiOrUni(
        address _rewardToken,
        address _underlyingToken,
        uint256 _amount,
        address _router
    ) internal view returns (uint256 _finalAmount) {
        address _tokenA = IUniswapV2Pair(_underlyingToken).token0();
        address _tokenB = IUniswapV2Pair(_underlyingToken).token1();

        try
            IUniswapV2Router02(_router).getAmountsOut(_amount.div(uint256(2)), _getPath(_rewardToken, _tokenA))
        returns (uint256[] memory _amountsA) {
            try
                IUniswapV2Router02(_router).getAmountsOut(_amount.div(uint256(2)), _getPath(_rewardToken, _tokenB))
            returns (uint256[] memory _amountsB) {
                try IUniswapV2Pair(_underlyingToken).getReserves() returns (
                    uint112 reserve0,
                    uint112 reserve1,
                    uint32
                ) {
                    try IUniswapV2Router02(_router).quote(_amountsA[_amountsA.length - 1], reserve0, reserve1) returns (
                        uint256 _quoteAmount
                    ) {
                        if (_quoteAmount >= _amountsB[_amountsB.length - 1]) {
                            _finalAmount = _amountsB[_amountsB.length - 1]
                                .mul(IUniswapV2Pair(_underlyingToken).totalSupply())
                                .div(reserve1);
                        } else {
                            _finalAmount = _quoteAmount.mul(IUniswapV2Pair(_underlyingToken).totalSupply()).div(
                                reserve1
                            );
                        }
                    } catch {}
                } catch {}
            } catch {}
        } catch {}
    }

    function _getPath(address _initialToken, address _finalToken) internal pure returns (address[] memory _path) {
        address _weth = IUniswapV2Router02(uniswapV2Router02).WETH();
        if (_finalToken == _weth) {
            _path = new address[](2);
            _path[0] = _initialToken;
            _path[1] = _weth;
        } else if (_initialToken == _weth) {
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

    /**
     * @dev Get the expected amount to receive of _token1 after swapping _token0
     * @param _swapInAmount Amount of _token0 to be swapped for _token1
     * @param _token0 Contract address of one of the liquidity pool's underlying tokens
     * @param _token1 Contract address of one of the liquidity pool's underlying tokens
     */
    function _calculateSwapOutAmount(
        uint256 _swapInAmount,
        address _token0,
        address _token1
    ) internal view returns (uint256 _swapOutAmount) {
        uint256 price = optyFiOracle.getTokenPrice(_token0, _token1);
        require(price > uint256(0), "!price");
        uint256 decimals0 = uint256(ERC20(_token0).decimals());
        uint256 decimals1 = uint256(ERC20(_token1).decimals());
        _swapOutAmount = ((_swapInAmount * price * 10**decimals1) / 10**(18 + decimals0));
    }

    /**
     * @dev Check whether the pool is balanced or not according to OptyFi Oracle's prices
     * @param _token0 Contract address of one of the liquidity pool's underlying tokens
     * @param _token1 Contract address of one of the liquidity pool's underlying tokens
     * @param _reserve0 Liquidity pool's reserve for _token0
     * @param _reserve1 Liquidity pool's reserve for _token1
     * @param _liquidityPool Liquidity pool's contract address
     */
    function _isPoolBalanced(
        address _token0,
        address _token1,
        uint256 _reserve0,
        uint256 _reserve1,
        address _liquidityPool
    ) internal view {
        uint256 price = optyFiOracle.getTokenPrice(_token0, _token1);
        require(price > uint256(0), "!price");
        uint256 decimals0 = uint256(ERC20(_token0).decimals());
        uint256 decimals1 = uint256(ERC20(_token1).decimals());
        uint256 uniswapPrice = (_reserve1 * 10**(36 - decimals1)) / (_reserve0 * 10**(18 - decimals0));
        uint256 upperLimit = (price * (DENOMINATOR + liquidityPoolToTolerance[_liquidityPool])) / DENOMINATOR;
        uint256 lowerLimit = (price * (DENOMINATOR - liquidityPoolToTolerance[_liquidityPool])) / DENOMINATOR;
        require((uniswapPrice < upperLimit) && (uniswapPrice > lowerLimit), "!imbalanced pool");
    }

    /**
     * @dev Check whether the pools to get the underlying token are balanced or not according
     * to OptyFi Oracle's prices and return the allowed slippage
     * @param _rewardToken Contract address of one of the liquidity pool's underlying tokens
     * @param _underlyingToken Contract address of one of the liquidity pool's underlying tokens
     * @return the allowed slippage for the pair
     */
    function _getSlippageCheckPoolBalanced(address _rewardToken, address _underlyingToken)
        internal
        view
        returns (uint256)
    {
        address[] memory path = _getPath(_rewardToken, _underlyingToken);
        address liquidityPool;
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 slippage;
        for (uint256 i; i < path.length.sub(uint256(1)); i++) {
            liquidityPool = sushiswapFactory.getPair(path[i], path[i.add(uint256(1))]);
            if (slippage < liquidityPoolToWantTokenToSlippage[liquidityPool][path[i.add(uint256(1))]]) {
                slippage = liquidityPoolToWantTokenToSlippage[liquidityPool][path[i.add(uint256(1))]];
            }
            if (liquidityPool != address(0)) {
                token0 = IUniswapV2Pair(liquidityPool).token0();
                token1 = IUniswapV2Pair(liquidityPool).token1();
                (reserve0, reserve1, ) = IUniswapV2Pair(liquidityPool).getReserves();
                (token0 != _underlyingToken && token0 != WETH)
                    ? _isPoolBalanced(token0, token1, reserve0, reserve1, liquidityPool)
                    : _isPoolBalanced(token1, token0, reserve1, reserve0, liquidityPool);
            }
        }
        return slippage;
    }
}
