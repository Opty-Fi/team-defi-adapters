// solhint-disable no-unused-vars
// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { ICompound } from "../../../interfaces/compound/ICompound.sol";
import { IERC20, SafeMath } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { Modifiers } from "../../configuration/Modifiers.sol";
import { IAdapter } from "../../../interfaces/opty/IAdapter.sol";
import { DataTypes } from "../../../libraries/types/DataTypes.sol";
import { HarvestCodeProvider } from "../../configuration/HarvestCodeProvider.sol";

/**
 * @dev Abstraction layer to Compound's pools
 */

contract CompoundAdapter is IAdapter, Modifiers {
    using SafeMath for uint256;

    HarvestCodeProvider public harvestCodeProviderContract;
    mapping(address => uint256) public maxDepositPoolPct; // basis points
    mapping(address => uint256) public maxDepositAmount;

    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    DataTypes.MaxExposure public maxExposureType;
    address public comptroller;
    address public rewardToken;
    uint256 public maxDepositPoolPctDefault; // basis points
    uint256 public maxDepositAmountDefault;

    constructor(address _registry, address _harvestCodeProvider) public Modifiers(_registry) {
        setRewardToken(address(0xc00e94Cb662C3520282E6f5717214004A7f26888));
        setComptroller(address(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B));
        setHarvestCodeProvider(_harvestCodeProvider);
        setMaxDepositPoolPctDefault(uint256(10000)); // 100%
        setMaxDepositPoolType(DataTypes.MaxExposure.Number);
    }

    /**
     * @notice Sets the percentage of max deposit value for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit percentage
     * @param _maxDepositPoolPct Pool's Max deposit percentage to be set for the given liquidity pool
     */
    function setMaxDepositPoolPct(address _liquidityPool, uint256 _maxDepositPoolPct) external onlyGovernance {
        maxDepositPoolPct[_liquidityPool] = _maxDepositPoolPct;
    }

    /**
     * @notice Sets the default max deposit value (in munber)
     * @param _maxDepositAmountDefault Pool's Max deposit value in number to be set as default value
     */
    function setMaxDepositAmountDefault(uint256 _maxDepositAmountDefault) external onlyGovernance {
        maxDepositAmountDefault = _maxDepositAmountDefault;
    }

    /**
     * @notice Sets the max deposit value (in munber) for the given liquidity pool
     * @param _liquidityPool liquidity pool address for which to set max deposit value (in number)
     * @param _maxDepositAmount Pool's Max deposit value in number to be set for the given liquidity pool
     */
    function setMaxDepositAmount(address _liquidityPool, uint256 _maxDepositAmount) external onlyGovernance {
        maxDepositAmount[_liquidityPool] = _maxDepositAmount;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = IERC20(_underlyingTokens[0]).balanceOf(_optyVault);
        return getDepositSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _amounts);
    }

    // /**
    //  * @notice Get the codes for borrowing the given outputToken from the liquidityPool provided
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getBorrowAllCodes(
        address payable,
        address[] memory,
        address,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    // /**
    //  * @notice Get the codes for repaying and withdrawing the given outputToken from the liquidityPool provided
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getRepayAndWithdrawAllCodes(
        address payable,
        address[] memory,
        address,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawAllCodes(
        address payable _optyVault,
        address[] memory _underlyingTokens,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _redeemAmount = getLiquidityPoolTokenBalance(_optyVault, _underlyingTokens[0], _liquidityPool);
        return getWithdrawSomeCodes(_optyVault, _underlyingTokens, _liquidityPool, _redeemAmount);
    }

    // /**
    //  * @notice Get the underlying token addresses given the liquidityPool/liquidityPoolToken
    //  * @dev Returns the underlying token given the liquidityPoolToken for Aave, others & liquidity pool for Curve
    //  * @param _liquidityPool Liquidity Pool address from where to get the lpToken
    //  * @return _underlyingTokens List of underlying token addresses for compound liquidityPool
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getUnderlyingTokens(address _liquidityPool, address)
        external
        view
        override
        returns (address[] memory _underlyingTokens)
    {
        _underlyingTokens = new address[](1);
        _underlyingTokens[0] = ICompound(_liquidityPool).underlying();
    }

    // /**
    //  * @notice Get some amount to borrow from the given liquidity pool
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
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

    // /**
    //  * @notice Get the amount to borrow from the given liquidity pool
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
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
     * @inheritdoc IAdapter
     */
    function calculateAmountInLPToken(
        address _underlyingToken,
        address _liquidityPool,
        uint256 _depositAmount
    ) external view override returns (uint256) {
        return
            _depositAmount.mul(1e18).div(
                ICompound(getLiquidityPoolToken(_underlyingToken, _liquidityPool)).exchangeRateStored()
            );
    }

    /**
     * @inheritdoc IAdapter
     */
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

    /**
     * @inheritdoc IAdapter
     */
    function isRedeemableAmountSufficient(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool,
        uint256 _redeemAmount
    ) external view override returns (bool) {
        uint256 _balanceInToken = getAllAmountInToken(_optyVault, _underlyingToken, _liquidityPool);
        return _balanceInToken >= _redeemAmount;
    }

    // /**
    //  * @notice Returns code for claiming the reward tokens (eg: COMP etc.)
    //  * @param _optyVault Vault contract address
    //  * @return _codes Returns a bytes value to be executed
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getClaimRewardTokenCode(address payable _optyVault, address)
        external
        view
        override
        returns (bytes[] memory _codes)
    {
        _codes = new bytes[](1);
        _codes[0] = abi.encode(comptroller, abi.encodeWithSignature("claimComp(address)", _optyVault));
    }

    /**
     * @inheritdoc IAdapter
     */
    function getHarvestAllCodes(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) external view override returns (bytes[] memory _codes) {
        uint256 _rewardTokenAmount = IERC20(getRewardToken(_liquidityPool)).balanceOf(_optyVault);
        return getHarvestSomeCodes(_optyVault, _underlyingToken, _liquidityPool, _rewardTokenAmount);
    }

    /**
     * @inheritdoc IAdapter
     */
    function canStake(address) external view override returns (bool) {
        return false;
    }

    // /**
    //  * @notice Returns code for staking liquidityPool token
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getStakeSomeCodes(address, uint256) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns code for staking all liquidityPool tokens balance
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getStakeAllCodes(
        address payable,
        address[] memory,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns code for unstaking some liquidityPool tokens
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getUnstakeSomeCodes(address, uint256) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns codes for unstaking all liquidityPool tokens balance
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getUnstakeAllCodes(address payable, address) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns the balance in underlying for staked liquidityPoolToken balance of holder
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getAllAmountInTokenStake(
        address payable,
        address,
        address
    ) external view override returns (uint256) {
        revert("!empty");
    }

    // /**
    //  * @notice Get liquidity pool token staked balance
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getLiquidityPoolTokenBalanceStake(address payable, address) external view override returns (uint256) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns the equivalent amount of liquidity pool token given the share amount to be withdrawn
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function calculateRedeemableLPTokenAmountStake(
        address payable,
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns whether the share amount is redeemable or not
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function isRedeemableAmountSufficientStake(
        address payable,
        address,
        address,
        uint256
    ) external view override returns (bool) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns the code for unstake and withdraw of some liquidty pool tokens
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getUnstakeAndWithdrawSomeCodes(
        address payable,
        address[] memory,
        address,
        uint256
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    // /**
    //  * @notice Returns the code for unstake and withdraw of all liquidty pool tokens
    //  * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
    //  */
    /**
     * @inheritdoc IAdapter
     * @dev Reverting '!empty' message as there is no related functionality for this in Compound protocol
     */
    function getUnstakeAndWithdrawAllCodes(
        address payable,
        address[] memory,
        address
    ) external view override returns (bytes[] memory) {
        revert("!empty");
    }

    /**
     * @notice Sets the reward token for Compound protocol
     * @param _rewardToken Address of reward token to be set
     */
    function setRewardToken(address _rewardToken) public onlyOperator {
        rewardToken = _rewardToken;
    }

    /**
     * @notice Sets the Comptroller of Compound protocol
     * @param _comptroller Compound's Comptroller contract address
     */
    function setComptroller(address _comptroller) public onlyOperator {
        comptroller = _comptroller;
    }

    /**
     * @notice Sets the HarvestCodeProvider contract address
     * @param _harvestCodeProvider Optyfi's HarvestCodeProvider contract address
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) public onlyOperator {
        harvestCodeProviderContract = HarvestCodeProvider(_harvestCodeProvider);
    }

    /**
     * @notice Sets the max deposit amount's data type
     * @dev Types (can be number or percentage) supported for the maxDeposit value
     * @param _type Type of maxDeposit to be set (can be Number or percentage)
     */
    function setMaxDepositPoolType(DataTypes.MaxExposure _type) public onlyGovernance {
        maxExposureType = _type;
    }

    /**
     * @notice Sets the default percentage of max deposit pool value
     * @param _maxDepositPoolPctDefault Pool's Max deposit percentage to be set as default value
     */
    function setMaxDepositPoolPctDefault(uint256 _maxDepositPoolPctDefault) public onlyGovernance {
        maxDepositPoolPctDefault = _maxDepositPoolPctDefault;
    }

    /**
     * @inheritdoc IAdapter
     */
    function getDepositSomeCodes(
        address payable,
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
            _codes[2] = abi.encode(_liquidityPool, abi.encodeWithSignature("mint(uint256)", uint256(_depositAmount)));
        }
    }

    // /**
    //  * @notice Get the codes for withdrawing some amount from the liquidityPool provided
    //  * @dev Redeem some `amount` of `liquidityPoolToken` token and sends the `underlyingToken` to the caller`
    //  * @param _underlyingTokens List of underlying tokens supported by the given liquidity pool
    //  * @param _liquidityPool liquidity Pool address from where to withdraw
    //  * @param _amount amount of underlying token to withdraw from the given liquidity pool
    //  * @return _codes Returns a bytes value to be executed
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getWithdrawSomeCodes(
        address payable,
        address[] memory _underlyingTokens,
        address _liquidityPool,
        uint256 _amount
    ) public view override returns (bytes[] memory _codes) {
        if (_amount > 0) {
            _codes = new bytes[](1);
            _codes[0] = abi.encode(
                getLiquidityPoolToken(_underlyingTokens[0], _liquidityPool),
                abi.encodeWithSignature("redeem(uint256)", uint256(_amount))
            );
        }
    }

    // /**
    //  * @notice Returns pool value in underlying token for the given liquidity pool and underlying token
    //  * @param _liquidityPool liquidity Pool address from where to get the pool value
    //  * @return Returns pool value in underlying token for the given liquidity pool and underlying token
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getPoolValue(address _liquidityPool, address) public view override returns (uint256) {
        return ICompound(_liquidityPool).getCash();
    }

    // /**
    //  * @notice Get the liquidity pool token address
    //  * @param _liquidityPool Liquidity Pool address from where to get the lpToken
    //  * @return Returns the liquidity pool token address
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolToken(address, address _liquidityPool) public view override returns (address) {
        return _liquidityPool;
    }

    // /**
    //  * @inheritdoc IAdapter
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getAllAmountInToken(
        address payable _optyVault,
        address _underlyingToken,
        address _liquidityPool
    ) public view override returns (uint256) {
        // Mantisa 1e18 to decimals
        uint256 b =
            getSomeAmountInToken(
                _underlyingToken,
                _liquidityPool,
                getLiquidityPoolTokenBalance(_optyVault, _underlyingToken, _liquidityPool)
            );
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

    // /**
    //  * @notice Get liquidity pool token balance
    //  * @param _optyVault Vault contract address
    //  * @param _liquidityPool liquidity pool address from where to get the balance of lpToken
    //  * @return Returns the balance of liquidity pool token (lpToken)
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getLiquidityPoolTokenBalance(
        address payable _optyVault,
        address,
        address _liquidityPool
    ) public view override returns (uint256) {
        return IERC20(_liquidityPool).balanceOf(_optyVault);
    }

    // /**
    //  * @notice Returns the equivalent value of underlying token for given liquidityPoolTokenAmount
    //  * @param _liquidityPool liquidity pool address from where to get the balance of lpToken
    //  * @param _liquidityPoolTokenAmount lpToken amount for which to get equivalent underlyingToken amount
    //  * @return Returns the equivalent amount of underlying token for given liquidityPoolTokenAmount
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getSomeAmountInToken(
        address,
        address _liquidityPool,
        uint256 _liquidityPoolTokenAmount
    ) public view override returns (uint256) {
        if (_liquidityPoolTokenAmount > 0) {
            _liquidityPoolTokenAmount = _liquidityPoolTokenAmount
                .mul(ICompound(_liquidityPool).exchangeRateStored())
                .div(1e18);
        }
        return _liquidityPoolTokenAmount;
    }

    // /**
    //  * @notice Returns reward token address for the compound liquidity pool
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getRewardToken(address) public view override returns (address) {
        return rewardToken;
    }

    // /**
    //  * @notice Returns the amount of accrued reward tokens
    //  * @param _optyVault Vault contract address
    //  * @return _codes Returns a bytes value to be executed
    //  */
    /**
     * @inheritdoc IAdapter
     */
    function getUnclaimedRewardTokenAmount(address payable _optyVault, address) public view override returns (uint256) {
        return ICompound(comptroller).compAccrued(_optyVault);
    }

    /**
     * @inheritdoc IAdapter
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
