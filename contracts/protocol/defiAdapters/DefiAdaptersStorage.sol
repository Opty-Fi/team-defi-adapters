// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

//  libraries
import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @title DefiAdaptersStorage Contract
 * @author Opty.fi
 * @dev Contract used to store defi adapter contract's state variables and events
 */
contract DefiAdaptersStorage {
    /**
     * @notice notify when Max Deposit Protocol mode is set
     */
    event LogMaxDepositProtocolMode(
        address indexed adapter,
        DataTypes.MaxExposure indexed maxDepositProtocolMode,
        address indexed caller
    );

    /**
     * @notice notify when Max Deposit Protocol percentage is set
     */
    event LogMaxDepositProtocolPct(
        address indexed adapter,
        uint256 indexed maxDepositProtocolPct,
        address indexed caller
    );

    /**
     * @notice notify when Max Deposit Pool percentage is set
     */
    event LogMaxDepositPoolPct(address indexed adapter, uint256 indexed maxDepositPoolPct, address indexed caller);

    /**
     * @notice notify when Max Deposit Amount is set
     */
    event LogMaxDepositAmount(address indexed adapter, uint256 indexed maxDepositAmount, address indexed caller);
}
