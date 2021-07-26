// SPDX-License-Identifier:MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface of ETH gateway for opty-fi's Compound adapter
 * @author Opty.fi
 * @dev Inspired from Aave WETH gateway
 */
interface ICompoundETHGateway {
    /**
     * @dev deposits ETH into the reserve, using native ETH. A corresponding amount of the overlying asset (cTokens)
     *      is minted.
     * @param _liquidityPool address of the targeted cToken pool
     * @param _amount address of the user who will receive the aTokens representing the deposit
     **/
    function depositETH(
        address _vault,
        address _liquidityPool,
        uint256 _amount
    ) external;

    /**
     * @dev withdraws the ETH _reserves of vault.
     * @param _vault address that will receive WETH
     * @param _liquidityPool address of the targeted cToken pool
     * @param _amount amount of cETH to withdraw and receive native ETH
     */
    function withdrawETH(
        address _vault,
        address _liquidityPool,
        uint256 _amount
    ) external;

    /**
     * @dev transfer ERC20 from the utility contract, for ERC20 recovery in case of stuck tokens due
     * direct transfers to the contract address.
     * @param _token token to transfer
     * @param _to recipient of the transfer
     * @param _amount amount to send
     */
    function emergencyTokenTransfer(
        address _token,
        address _to,
        uint256 _amount
    ) external;

    /**
     * @dev transfer native Ether from the utility contract, for native Ether recovery in case of stuck Ether
     * due selfdestructs or transfer ether to pre-computated contract address before deployment.
     * @param _to recipient of the transfer
     * @param _amount amount to send
     */
    function emergencyEtherTransfer(address _to, uint256 _amount) external;

    /**
     * @dev Get WETH address used by WETHGateway
     */
    function getWETHAddress() external view returns (address);
}
