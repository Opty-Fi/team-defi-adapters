// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

// libraries
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";

// helper contracts
import { Modifiers } from "../../configuration/Modifiers.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";

// interfaces
import { ISushiswapMasterChef } from "../../../interfaces/sushiswap/ISushiswapMasterChef.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAdapter } from "../../../interfaces/opty/defiAdapters/IAdapter.sol";
import { IAdapterInvestLimit } from "../../../interfaces/opty/defiAdapters/IAdapterInvestLimit.sol";
import { IAdapterHarvestReward } from "../../../interfaces/opty/defiAdapters/IAdapterHarvestReward.sol";

/**
 * @title Adapter for Sushiswap protocol
 * @author Opty.fi
 * @dev Abstraction layer to Sushiswap's MasterChef contract
 */

contract SushiswapAdapter is IAdapter, IAdapterInvestLimit, IAdapterHarvestReward, Modifiers {
    using SafeMath for uint256;

    /** @notice  Maps liquidityPool to max deposit value in percentage */
    mapping(address => uint256) public maxDepositPoolPct; // basis points

    /** @notice  Maps liquidityPool to max deposit value in absolute value for a specific token */
    mapping(address => mapping(address => uint256)) public maxDepositAmount;

    /** @notice  Maps underlyingToken to the ID of its pool */
    mapping(address => uint256) public underlyingTokenToPid;

    /** @notice  MasterChef V1 contract address */
    address public constant MASTERCHEFV1 = address(0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd);

    /** @notice  SUSHI token contract address */
    address public constant SUSHI = address(0x6B3595068778DD592e39A122f4f5a5cF09C90fE2);

    /** @notice  WETH-USDC pair contract address */
    address public constant SUSHI_WETH_USDC = address(0x397FF1542f962076d0BFE58eA045FfA2d347ACa0);

    /** @notice HarvestCodeProvider contract instance */
    HarvestCodeProvider public harvestCodeProviderContract;

    /** @notice max deposit value datatypes */
    DataTypes.MaxExposure public maxDepositProtocolMode;

    /** @notice Sushiswap's reward token address */
    address public rewardToken;

    /** @notice Sushiswap's MasterChef contract instance */
    ISushiswapMasterChef public masterChef;

    /** @notice max deposit's protocol value in percentage */
    uint256 public maxDepositProtocolPct; // basis points

    constructor(address _registry) public Modifiers(_registry) {
        harvestCodeProviderContract = HarvestCodeProvider(registryContract.getHarvestCodeProvider());
        setMasterChef(MASTERCHEFV1);
        setRewardToken(SUSHI);
        setMaxDepositProtocolPct(uint256(10000)); // 100%
        setMaxDepositProtocolMode(DataTypes.MaxExposure.Pct);
        setUnderlyingTokenToPid(SUSHI_WETH_USDC, uint256(1));
    }

    /**
     * @notice Map underlyingToken to its pool ID
     * @param _underlyingToken pair contract address to be mapped with pool ID
     * @param _pid pool ID to be linked with pair address
     */
    function setUnderlyingTokenToPid(address _underlyingToken, uint256 _pid) public onlyOperator {
        require(_underlyingToken != address(0), "Invalid address");
        require(underlyingTokenToPid[_underlyingToken] == uint256(0), "_underlyingTokenToPid already set");
        underlyingTokenToPid[_underlyingToken] = _pid;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositPoolPct(address _underlyingToken, uint256 _maxDepositPoolPct)
        external
        override
        onlyGovernance
    {
        maxDepositPoolPct[_underlyingToken] = _maxDepositPoolPct;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositAmount(
        address,
        address _underlyingToken,
        uint256 _maxDepositAmount
    ) external override onlyGovernance {
        maxDepositAmount[address(masterChef)][_underlyingToken] = _maxDepositAmount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address
    ) external view override returns (bytes[] memory) {
        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = IERC20(_underlyingTokens[0]).balanceOf(_vault);
        return getDepositSomeCodes(_vault, _underlyingTokens, address(masterChef), _amounts);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _vault,
        address[] memory _underlyingTokens,
        address
    ) external view override returns (bytes[] memory) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalance(_vault, _underlyingTokens[0], address(masterChef));
        return getWithdrawSomeCodes(_vault, _underlyingTokens, address(masterChef), _redeemAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function getUnderlyingTokens(address, address) external view override returns (address[] memory) {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateAmountInLPToken(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function calculateRedeemableLPTokenAmount(
        address payable _vault,
        address,
        address _liquidityPool,
        uint256
    ) external view override returns (uint256 _amount) {
        uint256 _pid = underlyingTokenToPid[_liquidityPool];
        _amount = masterChef.userInfo(_pid, _vault).amount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function isRedeemableAmountSufficient(
        address payable _vault,
        address _underlyingToken,
        address,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_vault, _underlyingToken, address(masterChef));
        return _balanceInToken >= _redeemAmount;
    }

    /* solhint-disable no-empty-blocks */

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getClaimRewardTokenCode(address payable, address) external view override returns (bytes[] memory) {}

    /* solhint-enable no-empty-blocks */

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestAllCodes(
        address payable _vault,
        address _underlyingToken,
        address
    ) external view override returns (bytes[] memory) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(address(masterChef))).balanceOf(_vault);
        return getHarvestSomeCodes(_vault, _underlyingToken, address(masterChef), _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function canStake(address) external view override returns (bool) {
        return false;
    }

    /**
     * @notice Sets the Sushiswap's MasterChef V1 contract address
     * @param _masterChef Sushiswap's MasterChef V1 contract address
     */
    function setMasterChef(address _masterChef) public onlyOperator {
        require(_masterChef != address(0), "Invalid address");
        masterChef = ISushiswapMasterChef(_masterChef);
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
    function setMaxDepositProtocolMode(DataTypes.MaxExposure _mode) public override onlyGovernance {
        maxDepositProtocolMode = _mode;
    }

    /**
     * @inheritdoc IAdapterInvestLimit
     */
    function setMaxDepositProtocolPct(uint256 _maxDepositProtocolPct) public override onlyGovernance {
        maxDepositProtocolPct = _maxDepositProtocolPct;
    }

    /* solhint-disable no-unused-vars */

    /**
     * @inheritdoc IAdapter
     */
    function getDepositSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address,
        uint256[] memory _amounts
    ) public view override returns (bytes[] memory _codes) {
        if (_amounts[0] > 0) {
            uint256 _pid = underlyingTokenToPid[_underlyingTokens[0]];
            uint256 _depositAmount = _getDepositAmount(address(masterChef), _underlyingTokens[0], _amounts[0]);
            _codes = new bytes[](3);
            _codes[0] = abi.encode(
                _underlyingTokens[0],
                abi.encodeWithSignature("approve(address,uint256)", address(masterChef), uint256(0))
            );
            _codes[1] = abi.encode(
                _underlyingTokens[0],
                abi.encodeWithSignature("approve(address,uint256)", address(masterChef), _depositAmount)
            );
            _codes[2] = abi.encode(
                address(masterChef),
                abi.encodeWithSignature("deposit(uint256,uint256)", _pid, _depositAmount)
            );
        }
    }

    /* solhint-enable no-unused-vars */

    /* solhint-disable no-unused-vars */

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address,
        uint256 _redeemAmount
    ) public view override returns (bytes[] memory _codes) {
        if (_redeemAmount > 0) {
            uint256 _pid = underlyingTokenToPid[_underlyingTokens[0]];
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                address(masterChef),
                abi.encodeWithSignature("withdraw(uint256,uint256)", _pid, _redeemAmount)
            );
        }
    }

    /* solhint-enable no-unused-vars */

    /**
     * @inheritdoc IAdapter
     */
    function getPoolValue(address, address _underlyingToken) public view override returns (uint256) {
        return IERC20(_underlyingToken).balanceOf(address(masterChef));
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolToken(address _underlyingToken, address) public view override returns (address) {
        return _underlyingToken;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _vault,
        address _underlyingToken,
        address
    ) public view override returns (uint256) {
        uint256 _pid = underlyingTokenToPid[_underlyingToken];
        uint256 _balance = masterChef.userInfo(_pid, _vault).amount;
        uint256 _unclaimedReward = getUnclaimedRewardTokenAmount(_vault, _underlyingToken);
        if (_unclaimedReward > 0) {
            _balance = _balance.add(
                harvestCodeProviderContract.rewardBalanceInLPTokensSushi(
                    rewardToken,
                    _underlyingToken,
                    _unclaimedReward
                )
            );
        }
        return _balance;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolTokenBalance(
        address payable _vault,
        address _underlyingToken,
        address
    ) public view override returns (uint256) {
        uint256 _pid = underlyingTokenToPid[_underlyingToken];
        uint256 _lpTokenBalance = masterChef.userInfo(_pid, _vault).amount;
        return _lpTokenBalance;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getRewardToken(address) public view override returns (address) {
        return rewardToken;
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getUnclaimedRewardTokenAmount(address payable _vault, address _underlyingToken)
        public
        view
        override
        returns (uint256)
    {
        uint256 _pid = underlyingTokenToPid[_underlyingToken];
        return ISushiswapMasterChef(_underlyingToken).pendingSushi(_pid, _vault);
    }

    /**
     * @inheritdoc IAdapterHarvestReward
     */
    function getHarvestSomeCodes(
        address payable _vault,
        address _underlyingToken,
        address,
        uint256 _rewardTokenAmount
    ) public view override returns (bytes[] memory) {
        return
            harvestCodeProviderContract.getHarvestLPTokenSushiCodes(
                _vault,
                getRewardToken(address(masterChef)),
                _underlyingToken,
                _rewardTokenAmount
            );
    }

    function _getDepositAmount(
        address,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256 _depositAmount) {
        _depositAmount = _amount;
        uint256 _limit =
            maxDepositProtocolMode == DataTypes.MaxExposure.Pct
                ? _getMaxDepositAmountByPct(_underlyingToken, _amount)
                : _getMaxDepositAmount(address(masterChef), _underlyingToken, _amount);
        if (_depositAmount > _limit) {
            _depositAmount = _limit;
        }
    }

    function _getMaxDepositAmountByPct(address _underlyingToken, uint256 _amount)
        internal
        view
        returns (uint256 _depositAmount)
    {
        _depositAmount = _amount;
        uint256 _poolValue = getPoolValue(address(0), _underlyingToken);
        uint256 maxPct = maxDepositPoolPct[_underlyingToken];
        if (maxPct == 0) {
            maxPct = maxDepositProtocolPct;
        }
        uint256 _limit = (_poolValue.mul(maxPct)).div(uint256(10000));
        if (_depositAmount > _limit) {
            _depositAmount = _limit;
        }
    }

    function _getMaxDepositAmount(
        address,
        address _underlyingToken,
        uint256 _amount
    ) internal view returns (uint256 _depositAmount) {
        _depositAmount = _amount;
        uint256 maxDeposit = maxDepositAmount[address(masterChef)][_underlyingToken];
        if (_depositAmount > maxDeposit) {
            _depositAmount = maxDeposit;
        }
    }
}
