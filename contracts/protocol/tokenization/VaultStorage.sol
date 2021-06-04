// solhint-disable max-states-count
// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

// library
import { DataTypes } from "../../libraries/types/DataTypes.sol";

/**
 * @title Vault state that can change
 * @author opty.fi
 * @dev The storage contract for opty.fi's interest bearing vault token
 */

contract VaultStorage {
    /**
     * @notice
     * @dev
     */
    DataTypes.Operation[] public queue;

    /**
     * @notice
     * @dev
     */
    mapping(address => uint256) public pendingDeposits;

    /**
     * @notice
     * @dev
     */
    mapping(address => uint256) public pendingWithdraws;

    /**
     * @notice
     * @dev
     */
    mapping(uint256 => DataTypes.BlockVaultValue[]) public blockToBlockVaultValues;

    /**
     * @notice
     * @dev
     */
    bytes32 public constant ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;

    /**
     * @notice
     * @dev
     */
    bytes32 public investStrategyHash;

    /**
     * @notice
     * @dev
     */
    uint256 public vaultValue;

    /**
     * @notice
     * @dev
     */
    uint256 public gasOwedToOperator;

    /**
     * @notice
     * @dev
     */
    uint256 public depositQueue;

    /**
     * @notice
     * @dev
     */
    uint256 public withdrawQueue;

    /**
     * @notice
     * @dev
     */
    uint256 public maxVaultValueJump = 100; // basis points

    /**
     * @notice
     * @dev
     */
    address public underlyingToken; //  store the underlying token contract address (for example DAI)

    /**
     * @notice
     * @dev
     */
    string public profile;

    /**
     * @notice
     * @dev
     */
    event DepositQueue(address indexed sender, uint256 indexed index, uint256 indexed amount);

    /**
     * @notice
     * @dev
     */
    event WithdrawQueue(address indexed sender, uint256 indexed index, uint256 indexed amount);
}
