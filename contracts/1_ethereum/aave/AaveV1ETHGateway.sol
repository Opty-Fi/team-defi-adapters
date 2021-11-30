// SPDX-License-Identifier:MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

//  helper contracts
import { Modifiers } from "../../protocol/configuration/Modifiers.sol";

//  interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IWETH } from "@optyfi/defi-legos/interfaces/misc/contracts/IWETH.sol";
import { ILendingPool } from "@optyfi/defi-legos/ethereum/aave/contracts/ILendingPool.sol";
import { IAaveV1Token } from "@optyfi/defi-legos/ethereum/aave/contracts/IAaveV1Token.sol";
import { IETHGateway } from "@optyfi/defi-legos/interfaces/misc/contracts/IETHGateway.sol";

// import "hardhat/console.sol";

/**
 * @title ETH gateway for opty-fi's AaveV1 adapter
 * @author Opty.fi
 * @dev Inspired from Aave WETH gateway
 */
contract AaveV1ETHGateway is IETHGateway, Modifiers {
    // solhint-disable-next-line var-name-mixedcase
    IWETH internal immutable WETH;

    // solhint-disable-next-line var-name-mixedcase
    address public immutable AETH;

    // solhint-disable-next-line var-name-mixedcase
    address public immutable ETH = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    // solhint-disable-next-line var-name-mixedcase
    address public AaveLendingPool = address(0x398eC7346DcD622eDc5ae82352F02bE94C62d119);

    // solhint-disable-next-line var-name-mixedcase
    address public AaveLendingPoolCore = address(0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3);

    /**
     * @dev Sets the WETH and AETH (AaveV1 Eth pool) addresses along with registry.
     * @param weth Address of the Wrapped Ether contract
     * @param _registry Registry contract address
     * @param _aeth Address of the aETH liquidity pool
     **/
    constructor(
        address weth,
        address _registry,
        address _aeth
    )
        public
        // ) public {
        Modifiers(_registry)
    {
        WETH = IWETH(weth);
        AETH = _aeth;
    }

    /**
     * @inheritdoc IETHGateway
     */
    function depositETH(
        address _vault,
        address _lendingPool,
        address _liquidityPool,
        uint256[2] memory _amounts,
        int128
    ) external override {
        // //------//
        // console.log("Gateway Step-1: _vault = ", _vault);
        // console.log("Gateway Step-1: _lendingPool = ", _lendingPool);
        // console.log("Gateway Step-1: _liquidityPool = ", _liquidityPool);
        // console.log("This address Step-1: ThisAddress = ", address(this));
        // uint256 _vaultWethBalBefore = IERC20(address(WETH)).balanceOf(_vault);
        // uint256 _gatewayWethBalBefore = IERC20(address(WETH)).balanceOf(address(this));
        // console.log("Vault WETH bal before: ", _vaultWethBalBefore);
        // console.log("Gateway WETH bal before: ", _gatewayWethBalBefore);
        // console.log("Amounts[0]: ", _amounts[0]);
        // //------//

        // //------//
        // uint256 _allowanceBefore = IERC20(address(WETH)).allowance(_vault, address(this));
        // console.log("Allowance before: ", _allowanceBefore);
        // //------//

        IERC20(address(WETH)).transferFrom(_vault, address(this), _amounts[0]);

        // //------//
        // uint256 _allowanceAfter = IERC20(address(WETH)).allowance(_vault, address(this));
        // console.log("Allowance after: ", _allowanceAfter);
        // //------//
        // //------//
        // uint256 _vaultWethBalAfter = IERC20(address(WETH)).balanceOf(_vault);
        // uint256 _gatewayWethBalAfter = IERC20(address(WETH)).balanceOf(address(this));
        // console.log("Vault WETH bal after: ", _vaultWethBalAfter);
        // console.log("Gateway WETH bal after: ", _gatewayWethBalAfter);
        // //------//

        WETH.withdraw(_amounts[0]);

        // //------//
        // uint256 _vaultWethBalAfterWithdraw = IERC20(address(WETH)).balanceOf(_vault);
        // uint256 _gatewayWethBalAfterWithdraw = IERC20(address(WETH)).balanceOf(address(this));
        // console.log("Vault WETH bal after Withdraw: ", _vaultWethBalAfterWithdraw);
        // console.log("Gateway WETH bal after Withdraw: ", _gatewayWethBalAfterWithdraw);
        // //------//

        // uint256 _ethValue = address(this).balance;
        // console.log("_ETH value: ", _ethValue);

        ILendingPool(_lendingPool).deposit{ value: address(this).balance }(ETH, _amounts[0], uint16(0));

        // console.log("Transferred");

        // //------//
        // uint256 _vaultLpBalBefore = IERC20(_liquidityPool).balanceOf(_vault);
        // uint256 _gatewayLpBalBefore = IERC20(_liquidityPool).balanceOf(address(this));
        // console.log("Vault Lp bal before: ", _vaultLpBalBefore);
        // console.log("Gateway Lp bal before: ", _gatewayLpBalBefore);
        // //------//

        IERC20(_liquidityPool).transfer(_vault, IERC20(_liquidityPool).balanceOf(address(this)));

        // //------//
        // uint256 _vaultLpBalAfter = IERC20(_liquidityPool).balanceOf(_vault);
        // uint256 _gatewayLpBalAfter = IERC20(_liquidityPool).balanceOf(address(this));
        // console.log("Vault Lp bal after: ", _vaultLpBalAfter);
        // console.log("Gateway Lp bal after: ", _gatewayLpBalAfter);
        // //------//

        // IERC20(address(WETH)).transferFrom(_vault, address(this), _amounts[0]);
        // WETH.withdraw(_amounts[0]);
        // ICompound(_liquidityPool).mint{ value: address(this).balance }();
        // IERC20(_liquidityPool).transfer(_vault, IERC20(_liquidityPool).balanceOf(address(this)));
    }

    /**
     * @inheritdoc IETHGateway
     */
    function withdrawETH(
        address _vault,
        address,
        address _liquidityPool,
        uint256 _amount,
        int128
    ) external override {
        // console.log("_amount = ", _amount);
        IERC20(_liquidityPool).transferFrom(_vault, address(this), _amount);

        // //--------//
        // uint256 _vaultLpBalBefore = IERC20(_liquidityPool).balanceOf(_vault);
        // uint256 _gatewayLpBalBefore = IERC20(_liquidityPool).balanceOf(address(this));
        // console.log("Vault Lp Before redeem: ", _vaultLpBalBefore);
        // console.log("Gateway Lp Before redeem: ", _gatewayLpBalBefore);
        // //--------//

        IAaveV1Token(_liquidityPool).redeem(_amount);
        // ILendingPool(_lendingPool).redeemUnderlying(ETH, address(this) , _amount);
        // console.log("Redeem finished");
        // ILendingPool(_lendingPool).redeem(_amount);
        WETH.deposit{ value: address(this).balance }();
        // console.log("Eth with completed");
        IERC20(address(WETH)).transfer(_vault, IERC20(address(WETH)).balanceOf(address(this)));
        // console.log("Withdraw finished");

        // IERC20(_liquidityPool).transferFrom(_vault, address(this), _amount);
        // ICompound(_liquidityPool).redeem(_amount);
        // WETH.deposit{ value: address(this).balance }();
        // IERC20(address(WETH)).transfer(_vault, IERC20(address(WETH)).balanceOf(address(this)));
    }

    /**
     * @inheritdoc IETHGateway
     */
    function emergencyTokenTransfer(
        address _token,
        address _to,
        uint256 _amount
    ) external override onlyOperator {
        IERC20(_token).transfer(_to, _amount);
    }

    /**
     * @inheritdoc IETHGateway
     */
    function emergencyEtherTransfer(address to, uint256 amount) external override onlyOperator {
        _safeTransferETH(to, amount);
    }

    /**
     * @inheritdoc IETHGateway
     */
    function getWETHAddress() external view override returns (address) {
        return address(WETH);
    }

    /**
     * @dev transfer ETH to an address, revert if it fails.
     * @param _to recipient of the transfer
     * @param _value the amount to send
     */
    function _safeTransferETH(address _to, uint256 _value) internal {
        // solhint-disable-next-line avoid-low-level-calls
        (bool _success, ) = _to.call{ value: _value }(new bytes(0));
        require(_success, "ETH_TRANSFER_FAILED");
    }

    /**
     * @dev Only WETH and AETH contracts are allowed to transfer ETH here. Prevent other addresses
     *      to send Ether to this contract.
     */
    receive() external payable {
        require(
            msg.sender == address(WETH) ||
                msg.sender == address(AETH) ||
                msg.sender == AaveLendingPool ||
                msg.sender == AaveLendingPoolCore,
            "Receive not allowed"
        );
    }

    /**
     * @dev Revert fallback calls
     */
    fallback() external payable {
        revert("Fallback not allowed");
    }
}
