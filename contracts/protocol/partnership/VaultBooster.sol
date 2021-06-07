// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

//  libraries
import { DataTypes } from "../../libraries/types/DataTypes.sol";

//  helper contracts
import { VaultBoosterStorage } from "./VaultBoosterStorage.sol";
import { Modifiers } from "../configuration/Modifiers.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { ExponentialNoError } from "../../dependencies/compound/ExponentialNoError.sol";

//  interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IVaultBooster } from "../../interfaces/opty/IVaultBooster.sol";

/**
 * @title VaultBooster Contract
 * @author Opty.fi inspired by Compound.finance
 * @notice Contract for managing the ODEFI rewards
 * @dev Contract contains math for calculating the ODEFI rewards for all the users
 */
contract VaultBooster is IVaultBooster, VaultBoosterStorage, ExponentialNoError, Modifiers {
    using SafeERC20 for IERC20;

    constructor(address _registry, address _odefi) public Modifiers(_registry) {
        _setODEFIAddress(_odefi);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function claimODEFI(address _holder) external override returns (uint256) {
        claimODEFI(_holder, allOdefiVaults);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function updateUserStateInVault(address _odefiVault, address _user) external override {
        odefiUserStateInVault[_odefiVault][_user].index = odefiVaultState[_odefiVault].index;
        odefiUserStateInVault[_odefiVault][_user].timestamp = odefiVaultState[_odefiVault].timestamp;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function updateOdefiVaultRatePerSecondAndVaultToken(address _odefiVault) external override returns (bool) {
        odefiVaultRatePerSecondAndVaultToken[_odefiVault] = IERC20(_odefiVault).totalSupply() > 0
            ? div_(mul_(odefiVaultRatePerSecond[_odefiVault], 1e18), IERC20(_odefiVault).totalSupply())
            : uint256(0);
        return true;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function updateOdefiVaultIndex(address _odefiVault) external override returns (uint224) {
        if (odefiVaultState[_odefiVault].index == uint224(0)) {
            odefiVaultStartTimestamp[_odefiVault] = getBlockTimestamp();
            odefiVaultState[_odefiVault].timestamp = uint32(odefiVaultStartTimestamp[_odefiVault]);
            odefiVaultState[_odefiVault].index = uint224(odefiVaultRatePerSecondAndVaultToken[_odefiVault]);
            return odefiVaultState[_odefiVault].index;
        } else {
            uint256 _deltaSeconds = sub_(getBlockTimestamp(), uint256(odefiVaultState[_odefiVault].timestamp));
            if (_deltaSeconds > 0) {
                uint256 _deltaSecondsSinceStart = sub_(getBlockTimestamp(), odefiVaultStartTimestamp[_odefiVault]);
                uint256 _supplyTokens = IERC20(_odefiVault).totalSupply();
                uint256 _odefiAccrued = mul_(_deltaSeconds, odefiVaultRatePerSecond[_odefiVault]);
                uint256 _ratio = _supplyTokens > 0 ? div_(mul_(_odefiAccrued, 1e18), _supplyTokens) : uint256(0);
                uint256 _index =
                    div_(
                        add_(
                            mul_(
                                odefiVaultState[_odefiVault].index,
                                sub_(
                                    uint256(odefiVaultState[_odefiVault].timestamp),
                                    odefiVaultStartTimestamp[_odefiVault]
                                )
                            ),
                            _ratio
                        ),
                        _deltaSecondsSinceStart
                    );
                odefiVaultState[_odefiVault] = DataTypes.ODEFIState({
                    index: safe224(_index, "new index exceeds 224 bits"),
                    timestamp: safe32(getBlockTimestamp(), "block number exceeds 32 bits")
                });
            }
            return odefiVaultState[_odefiVault].index;
        }
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function setRewardRate(address _odefiVault, uint256 _rate) external override returns (bool) {
        require(msg.sender == rewarders[_odefiVault], "!rewarder");
        odefiVaultRatePerSecond[_odefiVault] = _rate;
        return true;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function setRewarder(address _odefiVault, address _rewarder) external override onlyOperator returns (bool) {
        rewarders[_odefiVault] = _rewarder;
        return true;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function addOdefiVault(address _odefiVault) external override onlyOperator returns (bool) {
        for (uint256 i = 0; i < allOdefiVaults.length; i++) {
            require(allOdefiVaults[i] != _odefiVault, "odefiVault already added");
        }
        allOdefiVaults.push(_odefiVault);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function setOdefiVault(address _odefiVault, bool _enable) external override onlyOperator returns (bool) {
        odefiVaultEnabled[_odefiVault] = _enable;
        return true;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function claimODEFI(address _holder, address[] memory _odefiVaults) public override returns (uint256) {
        address[] memory holders = new address[](1);
        holders[0] = _holder;
        claimODEFI(holders, _odefiVaults);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function claimODEFI(address[] memory _holders, address[] memory _odefiVaults) public override returns (uint256) {
        uint256 _total;
        for (uint256 i = 0; i < _odefiVaults.length; i++) {
            address _odefiVault = _odefiVaults[i];
            require(odefiVaultEnabled[_odefiVault], "odefiVault must be enabled");
            for (uint256 j = 0; j < _holders.length; j++) {
                updateUserRewards(address(_odefiVault), _holders[j]);
                uint256 _amount = div_(odefiAccrued[_holders[j]], 1e18);
                odefiAccrued[_holders[j]] = uint256(0);
                IERC20(odefiAddress).safeTransfer(_holders[j], _amount);
                _total = add_(_total, _amount);
            }
        }
        return _total;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function updateUserRewards(address _odefiVault, address _user) public override {
        if (IERC20(_odefiVault).balanceOf(_user) > 0 && lastUserUpdate[_odefiVault][_user] != getBlockTimestamp()) {
            uint256 _deltaSecondsVault = sub_(getBlockTimestamp(), odefiVaultStartTimestamp[_odefiVault]);
            uint256 _deltaSecondsUser;
            if (
                lastUserUpdate[_odefiVault][_user] != uint256(0) &&
                lastUserUpdate[_odefiVault][_user] > odefiVaultStartTimestamp[_odefiVault]
            ) {
                _deltaSecondsUser = sub_(lastUserUpdate[_odefiVault][_user], odefiVaultStartTimestamp[_odefiVault]);
            } else {
                _deltaSecondsUser = sub_(
                    odefiUserStateInVault[_odefiVault][_user].timestamp,
                    odefiVaultStartTimestamp[_odefiVault]
                );
            }
            uint256 _userTokens = IERC20(_odefiVault).balanceOf(_user);
            uint256 _currentOdefiVaultIndex = currentOdefiVaultIndex(_odefiVault);
            uint256 _userDelta =
                mul_(
                    _userTokens,
                    sub_(
                        mul_(_currentOdefiVaultIndex, _deltaSecondsVault),
                        mul_(odefiUserStateInVault[_odefiVault][_user].index, _deltaSecondsUser)
                    )
                );
            uint256 _userAccrued = add_(odefiAccrued[_user], _userDelta);
            odefiAccrued[_user] = _userAccrued;
        }
        lastUserUpdate[_odefiVault][_user] = getBlockTimestamp();
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function claimableODEFI(address _holder, address[] memory _odefiVaults) public view override returns (uint256) {
        uint256 claimableOdefiAmount;
        for (uint256 i = 0; i < _odefiVaults.length; i++) {
            address _odefiVault = _odefiVaults[i];
            if (odefiVaultEnabled[_odefiVault] == true) {
                uint256 _deltaSecondsUser;
                if (
                    lastUserUpdate[_odefiVault][_holder] != uint256(0) &&
                    lastUserUpdate[_odefiVault][_holder] > odefiVaultStartTimestamp[_odefiVault]
                ) {
                    _deltaSecondsUser = sub_(
                        lastUserUpdate[_odefiVault][_holder],
                        odefiVaultStartTimestamp[_odefiVault]
                    );
                } else {
                    _deltaSecondsUser = sub_(
                        odefiUserStateInVault[_odefiVault][_holder].timestamp,
                        odefiVaultStartTimestamp[_odefiVault]
                    );
                }
                uint256 _currentODEFIVaultIndex = currentOdefiVaultIndex(_odefiVault);
                uint256 _userDelta =
                    mul_(
                        IERC20(_odefiVault).balanceOf(_holder),
                        sub_(
                            mul_(
                                _currentODEFIVaultIndex,
                                sub_(getBlockTimestamp(), odefiVaultStartTimestamp[_odefiVault])
                            ),
                            mul_(odefiUserStateInVault[_odefiVault][_holder].index, _deltaSecondsUser)
                        )
                    );
                claimableOdefiAmount = add_(claimableOdefiAmount, _userDelta);
            }
        }
        return div_(add_(claimableOdefiAmount, odefiAccrued[_holder]), 1e18);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function currentOdefiVaultIndex(address _odefiVault) public view override returns (uint256) {
        uint256 _deltaSecondsSinceStart = sub_(getBlockTimestamp(), odefiVaultStartTimestamp[_odefiVault]);
        uint256 _deltaSeconds = sub_(getBlockTimestamp(), uint256(odefiVaultState[_odefiVault].timestamp));
        uint256 _supplyTokens = IERC20(_odefiVault).totalSupply();
        uint256 _odefiAccrued = mul_(_deltaSeconds, odefiVaultRatePerSecond[_odefiVault]);
        uint256 _ratio = _supplyTokens > 0 ? div_(mul_(_odefiAccrued, 1e18), _supplyTokens) : uint256(0);
        uint256 _index =
            div_(
                add_(
                    mul_(
                        odefiVaultState[_odefiVault].index,
                        sub_(uint256(odefiVaultState[_odefiVault].timestamp), odefiVaultStartTimestamp[_odefiVault])
                    ),
                    _ratio
                ),
                _deltaSecondsSinceStart
            );
        return _index;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function getOdefiAddress() public view override returns (address) {
        return odefiAddress;
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function rewardDepletionSeconds(address _odefiVault) public view override returns (uint256) {
        return div_(balance(), odefiVaultRatePerSecond[_odefiVault]);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function claimableODEFI(address _holder) public view override returns (uint256) {
        return claimableODEFI(_holder, allOdefiVaults);
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function balance() public view override returns (uint256) {
        return IERC20(odefiAddress).balanceOf(address(this));
    }

    /**
     * @inheritdoc IVaultBooster
     */
    function getBlockTimestamp() public view override returns (uint256) {
        return block.timestamp;
    }

    function _setODEFIAddress(address _odefi) internal {
        require(_odefi != address(0), "!zeroAddress");
        odefiAddress = _odefi;
    }
}
