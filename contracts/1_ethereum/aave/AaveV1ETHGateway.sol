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
    address public AaveV1LendingPool = address(0x398eC7346DcD622eDc5ae82352F02bE94C62d119);

    // solhint-disable-next-line var-name-mixedcase
    address public AaveV1LendingPoolCore = address(0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3);

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
    ) public Modifiers(_registry) {
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
        IERC20(address(WETH)).transferFrom(_vault, address(this), _amounts[0]);
        WETH.withdraw(_amounts[0]);
        ILendingPool(_lendingPool).deposit{ value: address(this).balance }(ETH, _amounts[0], uint16(0));
        IERC20(_liquidityPool).transfer(_vault, IERC20(_liquidityPool).balanceOf(address(this)));
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
        IERC20(_liquidityPool).transferFrom(_vault, address(this), _amount);
        IAaveV1Token(_liquidityPool).redeem(_amount);
        WETH.deposit{ value: address(this).balance }();
        IERC20(address(WETH)).transfer(_vault, IERC20(address(WETH)).balanceOf(address(this)));
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
     *  @notice Function to set the AaveV1's Lending pool
     *  @param _aaveV1LendingPool AaveV1's Lending pool contract address
     */
    function setAaveV1LendingPool(address _aaveV1LendingPool) public onlyOperator {
        require(_aaveV1LendingPool.isContract(), "!isContract");
        AaveV1LendingPool = _aaveV1LendingPool;
    }

    /**
     *  @notice Function to set the AaveV1's Lending pool core
     *  @param _aaveV1LendingPoolCore AaveV1's Lending pool core contract address
     */
    function setAaveV1LendingPoolCore(address _aaveV1LendingPoolCore) public onlyOperator {
        require(_aaveV1LendingPoolCore.isContract(), "!isContract");
        AaveV1LendingPoolCore = _aaveV1LendingPoolCore;
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
                msg.sender == AaveV1LendingPool ||
                msg.sender == AaveV1LendingPoolCore,
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
