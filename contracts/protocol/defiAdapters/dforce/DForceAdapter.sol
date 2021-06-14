// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

//  libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";

//  helper contracts
import { Modifiers } from "../../configuration/Modifiers.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";

//  interfaces
import { IDForceDeposit } from "../../../interfaces/dforce/IDForceDeposit.sol";
import { IDForceStake } from "../../../interfaces/dforce/IDForceStake.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAdapterMinimal } from "../../../interfaces/opty/defiAdapters/IAdapterMinimal.sol";
import { IAdapterProtocolConfig } from "../../../interfaces/opty/defiAdapters/IAdapterProtocolConfig.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";
import { IAdapterStaking } from "../../../interfaces/opty/defiAdapters/IAdapterStaking.sol";
import { IAdapterInvestLimit } from "../../../interfaces/opty/defiAdapters/IAdapterInvestLimit.sol";

/**
 * @title Adapter for DForce protocol
 * @author Opty.fi
 * @dev Abstraction layer to DForce's pools
 */
contract DForceAdapter is
    IAdapterMinimal,
    IAdapterProtocolConfig,
    IAdapterHarvestReward,
    IAdapterStaking,
    IAdapterInvestLimit,
    Modifiers
{
    using SafeMath for uint256;

    /** @notice Maps liquidityPool to staking vault */
    mapping(address => address) public liquidityPoolToStakingVault;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct; // basis points

    /** @notice  Maps liquidityPool to max deposit value in number */
    mapping(address => uint256) public maxDepositAmount;

    // deposit pools
    address public constant USDT_DEPOSIT_POOL = address(0x868277d475E0e475E38EC5CdA2d9C83B5E1D9fc8);
    address public constant USDC_DEPOSIT_POOL = address(0x16c9cF62d8daC4a38FB50Ae5fa5d51E9170F3179);
    address public constant DAI_DEPOSIT_POOL = address(0x02285AcaafEB533e03A7306C55EC031297df9224);

    // staking vaults
    address public constant USDT_STAKING_VAULT = address(0x324EebDAa45829c6A8eE903aFBc7B61AF48538df);
    address public constant USDC_STAKING_VAULT = address(0xB71dEFDd6240c45746EC58314a01dd6D833fD3b5);
    address public constant DAI_STAKING_VAULT = address(0xD2fA07cD6Cd4A5A96aa86BacfA6E50bB3aaDBA8B);

    /** @notice HarvestCodeProvider contract instance */
    HarvestCodeProvider public harvestCodeProviderContract;

    /** @notice max deposit value datatypes */
    DataTypes.MaxExposure public maxExposureType;

    /** @notice DForce's reward token address */
    address public rewardToken;

    /** @notice max deposit's default value in percentage */
    uint256 public maxDepositPoolPctDefault; // basis points

    /** @notice max deposit's default value in number */
    uint256 public maxDepositAmountDefault;

    constructor(address _registry, address _harvestCodeProvider) public Modifiers(_registry) {
        setHarvestCodeProvider(_harvestCodeProvider);
        setRewardToken(address(0x431ad2ff6a9C365805eBaD47Ee021148d6f7DBe0));
        setLiquidityPoolToStakingVault(USDT_DEPOSIT_POOL, USDT_STAKING_VAULT);
        setLiquidityPoolToStakingVault(USDC_DEPOSIT_POOL, USDC_STAKING_VAULT);
        setLiquidityPoolToStakingVault(DAI_DEPOSIT_POOL, DAI_STAKING_VAULT);
        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
        setMaxDepositPoolType(DataTypes.MaxExposure.Number);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external override onlyGovernance {
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositAmountDefault(uint256 _maxDepositAmountDefault) external override onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositAmount(address _liquidityPool, uint256 _maxDepositAmount) external override onlyGovernance {
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @notice Map the liquidity pool to its Staking vault address
     * @param _liquidityPool liquidity pool address to be mapped with staking vault
     * @param _stakingVault staking vault address to be linked with liquidity pool
     */
    function setLiquidityPoolToStakingVault(address _liquidityPool, address _stakingVault) public onlyOperator {
        require(
            liquidityPoolToStakingVault[_liquidityPool] != _stakingVault,
            "liquidityPoolToStakingVault already set"
        );
        liquidityPoolToStakingVault[_liquidityPool] = _stakingVault;
    }

    /**
     * @inheritdoc IAdapterProtocolConfig
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) public override onlyOperator {
        harvestCodeProviderContract = HarvestCodeProvider(_harvestCodeProvider);
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function setRewardToken(address _rewardToken) public override onlyOperator {
        rewardToken = _rewardToken;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) public override onlyGovernance {
        maxExposureType = _type;
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public override onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getDepositAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = IERC20(_underlyingTokens[0]).balanceOf(_optyVault);
        return getDepositSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _amounts);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getUnderlyingTokens(address _liquidityPool, address)
        public
        view
        override
        returns (address[] memory _underlyingTokens)
    {
        _underlyingTokens = new address[](1);
        _underlyingTokens[0] = IDForceDeposit(_liquidityPool).token();
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getSomeAmountInToken(
        address,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) public view override returns (uint256) {
        if (_liquidityPoolTokenAmount > 0) {
            _liquidityPoolTokenAmount = _liquidityPoolTokenAmount
                .mul(IDForceDeposit(_liquidityPool).getExchangeRate())
                .div(10**IDForceDeposit(_liquidityPool).decimals());
        }
        return _liquidityPoolTokenAmount;
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function calculateAmountInLPToken(
        address,
        address _liquidityPool,
        uint256 _depositAmount
    ) public view override returns (uint256) {
        return
            _depositAmount.mul(10**(IDForceDeposit(_liquidityPool).decimals())).div(
                IDForceDeposit(_liquidityPool).getExchangeRate()
            );
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function calculateRedeemableLPTokenAmount(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (uint256 _amount) {
        uint256 _liquidityPoolTokenBalance = getLiquidityPoolTokenBalance(_optyVault, _underlyingToken, _liquidityPool);
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInToken).add(1);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function isRedeemableAmountSufficient(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getClaimRewardTokenCode(address payable, address _liquidityPool)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        address _stakingVault = liquidityPoolToStakingVault[_liquidityPool];
        _codes = new bytes[](1);
        _codes[0] = abi.encode(_stakingVault, abi.encodeWithSignature("getReward()"));
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(_liquidityPool)).balanceOf(_optyVault);
        return getHarvestSomeCodes(_optyVault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function canStake(address) public view override returns (bool) {
        return true;
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getStakeAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _stakeAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getStakeSomeCodes(_liquidityPool, _stakeAmount);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeAllCodes(address payable _optyVault, address _liquidityPool)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        uint256 _unstakeAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        return getUnstakeSomeCodes(_liquidityPool, _unstakeAmount);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function calculateRedeemableLPTokenAmountStake(
        address payable _optyVault,
        address,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (uint256 _amount) {
        address _stakingVault = liquidityPoolToStakingVault[_liquidityPool];
        uint256 _liquidityPoolTokenBalance = IERC20(_stakingVault).balanceOf(_optyVault);
        uint256 _balanceInTokenStake = getAllAmountInTokenStake(_optyVault, address(0), _liquidityPool);
        // can have unintentional rounding errors
        _amount = (_liquidityPoolTokenBalance.mul(_redeemAmount)).div(_balanceInTokenStake).add(1);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function isRedeemableAmountSufficientStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bool) {
        uint256 _balanceInTokenStake = getAllAmountInTokenStake(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInTokenStake >= _redeemAmount;
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeAndWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) public view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalanceStake(_optyVault, _liquidityPool);
        return getUnstakeAndWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getDepositSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        if (_amounts[0] > 0) {
            uint256 _depositAmount = _getDepositAmount(_liquidityPool, _amounts[0]);
            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _underlyingTokens[0],
                abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, uint256(0))
            );
            _codes[1] = abi.encode(
                _underlyingTokens[0],
                abi.encodeWithSignature("approve(address,uint256)", _liquidityPool, _depositAmount)
            );
            _codes[2] = abi.encode(
                _liquidityPool,
                abi.encodeWithSignature("mint(address,uint256)", _optyVault, _depositAmount)
            );
        }
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                getLiquidityPoolToken(_underlyingTokens[0], _liquidityPool),
                abi.encodeWithSignature("redeem(address,uint256)", _optyVault, _redeemAmount)
            );
        }
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getPoolValue(address _liquidityPool, address) public view override returns (uint256) {
        return IDForceDeposit(_liquidityPool).getLiquidity();
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getLiquidityPoolToken(address, address _liquidityPool) public view override returns (address) {
        return _liquidityPool;
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getAllAmountInToken(
        address payable _optyVault,
        address,
        address _liquidityPool
    ) public view override returns (uint256) {
        return IDForceDeposit(_liquidityPool).getTokenBalance(_optyVault);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address,
        address _liquidityPool
    ) public view override returns (uint256) {
        return IERC20(_liquidityPool).balanceOf(_optyVault);
    }

    /**
     * @inheritdoc IAdapterMinimal
     */
    function getRewardToken(address) public view override returns (address) {
        return rewardToken;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getUnclaimedRewardTokenAmount(address payable _optyVault, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        return IDForceStake(liquidityPoolToStakingVault[_liquidityPool]).earned(_optyVault);
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
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

    /**
     * @inheritdoc IAdapterStaking
     */
    function getStakeSomeCodes(address _liquidityPool, uint256 _shares)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        if (_shares > 0) {
            address _stakingVault = liquidityPoolToStakingVault[_liquidityPool];
            address _liquidityPoolToken = getLiquidityPoolToken(address(0), _liquidityPool);
            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _stakingVault, uint256(0))
            );
            _codes[1] = abi.encode(
                _liquidityPoolToken,
                abi.encodeWithSignature("approve(address,uint256)", _stakingVault, _shares)
            );
            _codes[2] = abi.encode(_stakingVault, abi.encodeWithSignature("stake(uint256)", _shares));
        }
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeSomeCodes(address _liquidityPool, uint256 _shares)
        public
        view
        override
        returns (bytes[] memory _codes)
    {
        if (_shares > 0) {
            address _stakingVault = liquidityPoolToStakingVault[_liquidityPool];
            _codes = new bytes[](1);
            _codes[0] = abi.encode(_stakingVault, abi.encodeWithSignature("withdraw(uint256)", _shares));
        }
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getAllAmountInTokenStake(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        address _stakingVault = liquidityPoolToStakingVault[_liquidityPool];
        uint256 b = IERC20(_stakingVault).balanceOf(_optyVault);
        if (b > 0) {
            b = b.mul(IDForceDeposit(getLiquidityPoolToken(_underlyingToken, _liquidityPool)).getExchangeRate()).div(
                1e18
            );
        }
        uint256 _unclaimedReward = getUnclaimedRewardTokenAmount(_optyVault, _liquidityPool);
        if (_unclaimedReward > 0) {
            b = b.add(
                harvestCodeProviderContract.rewardBalanceInUnderlyingTokens(
                    rewardToken,
                    _underlyingToken,
                    _unclaimedReward
                )
            );
        }
        return b;
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getLiquidityPoolTokenBalanceStake(address payable _optyVault, address _liquidityPool)
        public
        view
        override
        returns (uint256)
    {
        address _stakingVault = liquidityPoolToStakingVault[_liquidityPool];
        return IERC20(_stakingVault).balanceOf(_optyVault);
    }

    /**
     * @inheritdoc IAdapterStaking
     */
    function getUnstakeAndWithdrawSomeCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            _codes = new bytes[](2);
            _codes[0] = getUnstakeSomeCodes(_liquidityPool, _redeemAmount)[0];
            _codes[1] = getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount)[0];
        }
    }

    function _getDepositAmount(address _liquidityPool, uint256 _amount) internal view returns (uint256 _depositAmount) {
        _depositAmount = _amount;
        uint256 _limit =
            maxExposureType == DataTypes.MaxExposure.Pct
                ? _getMaxDepositAmountByPct(_liquidityPool, _amount)
                : _getMaxDepositAmount(_liquidityPool, _amount);
        if (_limit != 0 && _depositAmount > _limit) {
            _depositAmount = _limit;
        }
    }

    function _getMaxDepositAmountByPct(address _liquidityPool, uint256 _amount)
        internal
        view
        returns (uint256 _depositAmount)
    {
        _depositAmount = _amount;
        uint256 _poolValue = getPoolValue(_liquidityPool, address(0));
        uint256 maxPct = maxDepositPoolPct[_liquidityPool];
        if (maxPct == 0) {
            maxPct = maxDepositPoolPctDefault;
        }
        uint256 _limit = (_poolValue.mul(maxPct)).div(uint256(10000));
        if (_depositAmount > _limit) {
            _depositAmount = _limit;
        }
    }

    function _getMaxDepositAmount(address _liquidityPool, uint256 _amount)
        internal
        view
        returns (uint256 _depositAmount)
    {
        _depositAmount = _amount;
        uint256 maxDeposit = maxDepositAmount[_liquidityPool];
        if (maxDeposit == 0) {
            maxDeposit = maxDepositAmountDefault;
        }
        if (_depositAmount > maxDeposit) {
            _depositAmount = maxDeposit;
        }
    }
}
