// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAdapterFull } from "../../interfaces/opty/defiAdapters/IAdapterFull.sol";
import { MultiCall } from "../../utils/MultiCall.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IUniswapV2Pair } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

contract FundTestDeFiAdapter is MultiCall {

    address public constant uniswapV2Router02 = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    address public constant sushiswapRouter = address(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    function curveDepositSomeCodesAndTransfer(
        address _underlyingToken,
        uint256 _amount,
        address _liquidityPool,
        address _adapter,
        address _recipient
    ) external {
        address[] memory _underlyingTokens = new address[](1);
        uint256[] memory _amounts = new uint256[](1);
        _underlyingTokens[0] = _underlyingToken;
        _amounts[0] = _amount;
        executeCodes(
            IAdapterFull(_adapter).getDepositSomeCodes(
                payable(address(this)),
                _underlyingTokens,
                _liquidityPool,
                _amounts
            ),
            "depositSome"
        );
        address _lpToken = IAdapterFull(_adapter).getLiquidityPoolToken(_underlyingToken, _liquidityPool);
        uint256 balance = IAdapterFull(_adapter).getLiquidityPoolTokenBalance(payable(address(this)),_lpToken,_liquidityPool);
        IERC20(_lpToken).transfer(_recipient, balance);
    }

    function uniDepositSomeCodesAndTransfer(
        address _underlyingToken,
        uint256 _amount,
        address _recipient
    ) external {
        address _token0 = IUniswapV2Pair(_underlyingToken).token0();
        address _token1 = IUniswapV2Pair(_underlyingToken).token1();
        if (IERC20(_token0).balanceOf(address(this)) > 0 && IERC20(_token1).balanceOf(address(this)) > 0) {
            IERC20(_token0).approve(uniswapV2Router02,uint256(0));
            IERC20(_token0).approve(uniswapV2Router02,IERC20(_token0).balanceOf(address(this)));
            IERC20(_token1).approve(uniswapV2Router02,uint256(0));
            IERC20(_token1).approve(uniswapV2Router02,IERC20(_token1).balanceOf(address(this)));
            IUniswapV2Router02(uniswapV2Router02).addLiquidity(_token0,
                _token1,
                IERC20(_token0).balanceOf(address(this)),
                IERC20(_token1).balanceOf(address(this)),
                uint256(0),
                uint256(0),
                address(this),
                uint256(-1)
            );
            IERC20(_underlyingToken).transfer(_recipient, _amount);
        }
    }

    function sushiDepositSomeCodesAndTransfer(
        address _underlyingToken,
        uint256 _amount,
        address _recipient
    ) external {
        address _token0 = IUniswapV2Pair(_underlyingToken).token0();
        address _token1 = IUniswapV2Pair(_underlyingToken).token1();
        if (IERC20(_token0).balanceOf(address(this)) > 0 && IERC20(_token1).balanceOf(address(this)) > 0) {
            IERC20(_token0).approve(sushiswapRouter,uint256(0));
            IERC20(_token0).approve(sushiswapRouter,IERC20(_token0).balanceOf(address(this)));
            IERC20(_token1).approve(sushiswapRouter,uint256(0));
            IERC20(_token1).approve(sushiswapRouter,IERC20(_token1).balanceOf(address(this)));
            IUniswapV2Router02(sushiswapRouter).addLiquidity(_token0,
                _token1,
                IERC20(_token0).balanceOf(address(this)),
                IERC20(_token1).balanceOf(address(this)),
                uint256(0),
                uint256(0),
                address(this),
                uint256(-1)
            );
            IERC20(_underlyingToken).transfer(_recipient, _amount);
        }
    }
}