// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

/**
 * @title Interface for the DeFi adapters having protocol configuration contract setter functions
 * @author Opty.fi
 * @notice Interface of the DeFi protocol adapter for having protocol configuration contract setter functions
 * @dev Abstraction layer to different DeFi protocols like AaveV1, Compound etc.
 * It is used as an interface layer for adding new protocol configuration contract addresses setter functions
 */
interface IAdapterProtocolConfig {
    /**
     * @notice Sets the HarvestCodeProvider contract address
     * @param _harvestCodeProvider Optyfi's HarvestCodeProvider contract address
     */
    function setHarvestCodeProvider(address _harvestCodeProvider) external;
}
