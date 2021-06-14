// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for all the defi adapters
 * @author Opty.fi
 * @notice Interface of the Defi protocol code provider/adapter for borrow functionality
 * @dev Abstraction layer to different defi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for any new defi protocol if it includes borrow
 * functionality
 */
interface IAdapterProtocolConfig {
    /**
     * @notice Sets the HarvestCodeProvider contract address
     * @param _harvestCodeProvider Optyfi's HarvestCodeProvider contract address
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) external;
}
