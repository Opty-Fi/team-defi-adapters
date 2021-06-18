// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { IAdapter } from "../../../interfaces/opty/IAdapter.sol";
import { ICurveDeposit } from "../../../interfaces/curve/ICurveDeposit.sol";
import { ICurveSwap } from "../../../interfaces/curve/ICurveSwap.sol";
import { ICurveGauge } from "../../../interfaces/curve/ICurveGauge.sol";
import { IERC20, SafeMath } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "../../configuration/Modifiers.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";

/**
 * @dev Abstraction layer to Curve's swap pools
 */

contract CurveSwapAdapter is IAdapter, Modifiers {
    using SafeMath for uint256;

    mapping(address => address[]) public swapPoolToUnderlyingTokens;
    mapping(address => address) public swapPoolToLiquidityPoolToken;
    mapping(address => address) public swapPoolToGauges;
    mapping(address => bool) public noRemoveLiquidityOneCoin;
    mapping(address => uint256) public maxDepositPoolPct; // basis points
    mapping(address => uint256[]) public maxDepositAmount;

    address public constant HBTC = address(0x0316EB71485b0Ab14103307bf65a021042c6d380);
    HarvestCodeProvider public harvestCodeProviderContract;
    address public rewardToken; // reward token
    DataTypes.MaxExposure public maxExposureType;
    uint256 public maxDepositPoolPctDefault; // basis points
    uint256[4] public maxDepositAmountDefault;

    /**
     * @dev mapp coins and tokens to curve deposit pool
     */
    constructor(address _registry, address _harvestCodeProvider) public Modifiers(_registry) {
        setHarvestCodeProvider(_harvestCodeProvider);
        // reward token
        setRewardToken(address(0xD533a949740bb3306d119CC777fa900bA034cd52));
        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
        setMaxDepositPoolType(DataTypes.MaxExposure.Pct);
    }

    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external onlyGovernance {
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
    }

    function setMaxDepositAmountDefault(uint256[4] memory _maxDepositAmountDefault) external onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    function setMaxDepositAmount(address _liquidityPool, uint256[] memory _maxDepositAmount) external onlyGovernance {
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
    }

    function getDepositAllCodes(
        address payable _optyVault,
        address[] memory,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 nCoins = _underlyingTokens.length;
        uint256[] memory _amounts = new uint256[](nCoins);
        for (uint256 i = 0; i < nCoins; i++) {
            _amounts[i] = IERC20(_underlyingTokens[i]).balanceOf(_optyVault);
        }
        return getDepositSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _amounts);
    }

    function getBorrowAllCodes(
        address payable,
        address[] memory,
        address,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    function getRepayAndWithdrawAllCodes(
        address payable,
        address[] memory,
        address,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _amount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _amount);
    }

    function getUnderlyingTokens(address _liquidityPool, address)
        external
        view
        override
        returns (address[] memory _underlyingTokens)
    {
        _underlyingTokens = swapPoolToUnderlyingTokens[_liquidityPool];
    }

    function getSomeAmountInTokenBorrow(
        address payable,
        address,
        address,
        uint256,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    function getAllAmountInTokenBorrow(
        address payable,
        address,
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken
     */
    function calculateAmountInLPToken(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("not-implemented");
    }

    function calculateRedeemableLPTokenAmount(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (uint256 _amount) {
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalance(_optyVault, _underlyingToken, _liquidityPool);
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInToken).add(1);
    }

    function isRedeemableAmountSufficient(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    function getClaimRewardTokenCode(address payable, address _liquidityPool)
        external
        view
        override
        returns (bytes[] memory _codes)
    {
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                getMinter(swapPoolToGauges[_liquidityPool]),
                abi.encodeWithSignature("mint(address)", swapPoolToGauges[_liquidityPool])
            );
        }
    }

    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(_liquidityPool)).balanceOf(_optyVault);
        return getHarvestSomeCodes(_optyVault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    function canStake(address _liquidityPool) external view override returns (bool) {
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            return true;
        }
        return false;
    }

    function getStakeAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _stakeAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getStakeSomeCodes(_liquidityPool, _stakeAmount);
    }

    function getUnstakeAllCodes(address payable _optyVault, address _liquidityPool)
        external
        view
        override
        returns (bytes[] memory _codes)
    {
        uint256 _unstakeAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        return getUnstakeSomeCodes(_liquidityPool, _unstakeAmount);
    }

    function calculateRedeemableLPTokenAmountStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (uint256 _amount) {
        uint256 _stakedLiquidityPoolTokenBalance = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        uint256 _balanceInTokenStaked = getAllAmountInTokenStake(_optyVault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_stakedLiquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInTokenStaked).add(1);
    }

    function isRedeemableAmountSufficientStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInTokenStaked = getAllAmountInTokenStake(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInTokenStaked >= _redeemAmount;
    }

    function getUnstakeAndWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        return getUnstakeAndWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
    }

    function setRewardToken(address _rewardToken) public onlyOperator {
        rewardToken = _rewardToken;
    }

    function setLiquidityPoolToken(address _swapPool, address _liquidityPoolToken) public onlyOperator {
        swapPoolToLiquidityPoolToken[_swapPool] = _liquidityPoolToken;
    }

    function setSwapPoolToUnderlyingTokens(address _lendingPool, address[] memory _tokens) public onlyOperator {
        swapPoolToUnderlyingTokens[_lendingPool] = _tokens;
    }

    function setSwapPoolToGauges(address _pool, address _gauge) public onlyOperator {
        swapPoolToGauges[_pool] = _gauge;
    }

    function toggleNoRemoveLiquidityOneCoin(address _pool) public onlyOperator {
        if (!noRemoveLiquidityOneCoin[_pool]) {
            noRemoveLiquidityOneCoin[_pool] = true;
        } else {
            noRemoveLiquidityOneCoin[_pool] = false;
        }
    }

    function setHarvestCodeProvider(address _harvestCodeProvider) public onlyOperator {
        harvestCodeProviderContract = HarvestCodeProvider(_harvestCodeProvider);
    }

    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    function setMaxDepositPoolType(DataTypes.MaxExposure _type) public onlyGovernance {
        maxExposureType = _type;
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @param _liquidityPool Address of the pool deposit (or swap, in some cases) contract
     * @param _amounts Quantity of _underlyingToken to deposit
     *
     * @return _codes Returns the codes for deposit tokens in the liquidityPool provided
     */
    function getDepositSomeCodes(
        address payable,
        address[] memory,
        address _liquidityPool,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 nCoins = _underlyingTokens.length;
        require(_amounts.length == nCoins, "!_amounts.length");
        uint256 _codeLength = 1;
        for (uint256 i = 0; i < nCoins; i++) {
            if (_amounts[i] > 0) {
                if (_underlyingTokens[i] == HBTC) {
                    _codeLength++;
                } else {
                    _codeLength += 2;
                }
            }
        }

        if (_codeLength > 1) {
            _amounts = _getDepositAmounts(_liquidityPool, _amounts);
            _codes = new bytes[](_codeLength);
            uint256 _j = 0;
            for (uint256 i = 0; i < nCoins; i++) {
                if (_amounts[i] > 0) {
                    if (_underlyingTokens[i] == HBTC) {
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[i],
                            abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amounts[i])
                        );
                    } else {
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[i],
                            abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
                        );
                        _codes[_j++] = abi.encode(
                            _underlyingTokens[i],
                            abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amounts[i])
                        );
                    }
                }
            }
            if (nCoins == uint256(2)) {
                uint256[2] memory _depositAmounts = [_amounts[0], _amounts[1]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[2],uint256)", _depositAmounts, uint256(0))
                );
            } else if (nCoins == uint256(3)) {
                uint256[3] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[3],uint256)", _depositAmounts, uint256(0))
                );
            } else if (nCoins == uint256(4)) {
                uint256[4] memory _depositAmounts = [_amounts[0], _amounts[1], _amounts[2], _amounts[3]];
                _codes[_j] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature("add_liquidity(uint256[4],uint256)", _depositAmounts, uint256(0))
                );
            }
        }
    }

    /**
     * @dev Swaps _amount of _liquidityPoolToken for _underlyingToken
     *
     * @param _liquidityPool Address of the token that represents users' holdings in the pool
     * @param _amount Quantity of _liquidityPoolToken to swap for _underlyingToken
     */
    function getWithdrawSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _amount
    ) public view override returns (bytes[] memory _codes) {
        if (_amount > 0) {
            address[] memory tokens = _getUnderlyingTokens(_liquidityPool);
            uint256 nCoins = tokens.length;
            address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);

            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
            );
            _codes[1] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _amount)
            );

            if (_underlyingTokens.length == 1) {
                uint256 i = 0;
                for (uint256 j = 0; j < nCoins; j++) {
                    if (tokens[j] == _underlyingTokens[0]) {
                        i = j;
                    }
                }
                _codes[2] = abi.encode(
                    _liquidityPool,
                    abi.encodeWithSignature(
                        "remove_liquidity_one_coin(uint256,int128,uint256,bool)",
                        _amount,
                        i,
                        uint256(0),
                        true
                    )
                );
            } else {
                if (nCoins == uint256(2)) {
                    uint256[2] memory _minAmountOut = [uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[2])", _amount, _minAmountOut)
                    );
                } else if (nCoins == uint256(3)) {
                    uint256[3] memory _minAmountOut = [uint256(0), uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[3])", _amount, _minAmountOut)
                    );
                } else if (nCoins == uint256(4)) {
                    uint256[4] memory _minAmountOut = [uint256(0), uint256(0), uint256(0), uint256(0)];
                    _codes[2] = abi.encode(
                        _liquidityPool,
                        abi.encodeWithSignature("remove_liquidity(uint256,uint256[4])", _amount, _minAmountOut)
                    );
                }
            }
        }
    }

    function getPoolValue(address, address) public view override returns (uint256) {
        revert("!empty");
    }

    function getLiquidityPoolToken(address, address _liquidityPool) public view override returns (address) {
        return swapPoolToLiquidityPoolToken[_liquidityPool];
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken
     */
    function getAllAmountInToken(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        uint256 _liquidityPoolTokenAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingToken, _liquidityPool);
        return getSomeAmountInToken(_underlyingToken, _liquidityPool, _liquidityPoolTokenAmount);
    }

    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        return IERC20(getLiquidityPoolToken(_underlyingToken, _liquidityPool)).balanceOf(_optyVault);
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken
     */
    function getSomeAmountInToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) public view override returns (uint256) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _underlyingTokens.length; i++) {
            if (_underlyingTokens[i] == _underlyingToken) {
                tokenIndex = i;
            }
        }
        if (_liquidityPoolTokenAmount > 0) {
            return ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        return 0;
    }

    function getRewardToken(address _liquidityPool) public view override returns (address) {
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            return rewardToken;
        }
        return address(0);
    }

    function getUnclaimedRewardTokenAmount(address payable, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        /* solhint-disable no-empty-blocks */
        if (swapPoolToGauges[_liquidityPool] != address(0)) {
            // TODO : get the amount of unclaimed CRV tokens
        }
        /* solhint-disable no-empty-blocks */
        return uint256(0);
    }

    function getHarvestSomeCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory _codes) {
        return
            harvestCodeProviderContract.getHarvestCodes(
                _optyVault,
                getRewardToken(_liquidityPool),
                _underlyingToken,
                _rewardTokenAmount
            );
    }

    function getStakeSomeCodes(address _liquidityPool, uint256 _stakeAmount)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        address _gauge = swapPoolToGauges[_liquidityPool];
        address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);
        _codes = new bytes[](3);
        _codes[0] = abi.encode(
            _liquidityPoolToken,
            abi.encodeWithSignature("approve(address,uint256)", _gauge, uint256(0))
        );
        _codes[1] = abi.encode(
            _liquidityPoolToken,
            abi.encodeWithSignature("approve(address,uint256)", _gauge, _stakeAmount)
        );
        _codes[2] = abi.encode(_gauge, abi.encodeWithSignature("deposit(uint256)", _stakeAmount));
    }

    function getUnstakeSomeCodes(address _liquidityPool, uint256 _unstakeAmount)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        address _gauge = swapPoolToGauges[_liquidityPool];
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_gauge, abi.encodeWithSignature("withdraw(uint256)", _unstakeAmount));
    }

    /**
     * @dev Calls the appropriate deploy function depending on N_COINS
     *
     * @dev This function needs an address _underlyingToken argument to get how many _underlyingToken equal
     *      the user's balance in _liquidityPoolToken in staking vault(gauge)
     */
    function getAllAmountInTokenStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        address[] memory _underlyingTokens = _getUnderlyingTokens(_liquidityPool);
        uint256 tokenIndex = 0;
        for (uint256 i = 0; i < _underlyingTokens.length; i++) {
            if (_underlyingTokens[i] == _underlyingToken) {
                tokenIndex = i;
            }
        }
        uint256 _liquidityPoolTokenAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        uint256 _b = 0;
        if (_liquidityPoolTokenAmount > 0) {
            _b = ICurveDeposit(_liquidityPool).calc_withdraw_one_coin(_liquidityPoolTokenAmount, int128(tokenIndex));
        }
        _b = _b.add(
            harvestCodeProviderContract.rewardBalanceInUnderlyingTokens(
                getRewardToken(_liquidityPool),
                _underlyingToken,
                getUnclaimedRewardTokenAmount(_optyVault, _liquidityPool)
            )
        );
        return _b;
    }

    function getLiquidityPoolTokenBalanceStake(address payable _optyVault, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        return ICurveGauge(swapPoolToGauges[_liquidityPool]).balanceOf(_optyVault);
    }

    function getUnstakeAndWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            _codes = new bytes[](4);
            _codes[0] = getUnstakeSomeCodes(_liquidityPool, _redeemAmount)[0];
            bytes[] memory _withdrawCodes =
                getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
            _codes[1] = _withdrawCodes[0];
            _codes[2] = _withdrawCodes[1];
            _codes[3] = _withdrawCodes[2];
        }
    }

    function getMinter(address _gauge) public view returns (address) {
        return ICurveGauge(_gauge).minter();
    }

    function _getDepositAmounts(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory _depositAmounts)
    {
        _depositAmounts = maxExposureType == DataTypes.MaxExposure.Pct
            ? _amounts
            : _getMaxDepositAmounts(_liquidityPool, _amounts);
    }

    function _getMaxDepositAmounts(address _liquidityPool, uint256[] memory _amounts)
        internal
        view
        returns (uint256[] memory _depositAmounts)
    {
        _depositAmounts = new uint256[](_amounts.length);
        for (uint256 i = 0; i < _amounts.length; i++) {
            if ((maxDepositAmount[_liquidityPool].length > 0) && _amounts[i] > (maxDepositAmount[_liquidityPool])[i]) {
                _depositAmounts[i] = maxDepositAmount[_liquidityPool][i];
            } else {
                if (maxDepositAmountDefault.length > 0 && _amounts[i] > maxDepositAmountDefault[i]) {
                    _depositAmounts[i] = maxDepositAmountDefault[i];
                } else {
                    _depositAmounts[i] = _amounts[i];
                }
            }
        }
    }

    function _getUnderlyingTokens(address _liquidityPool) internal view returns (address[] memory _underlyingTokens) {
        _underlyingTokens = swapPoolToUnderlyingTokens[_liquidityPool];
    }
}
