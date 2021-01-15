// SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

interface ICompound {
    struct CompBalanceMetadata {
        uint256 balance;
        uint256 votes;
        address delegate;
    }

    struct CompBalanceMetadataExt {
        uint256 balance;
        uint256 votes;
        address delegate;
        uint256 allocated;
    }

    function getCompBalanceMetadata(address comp, address account) external view returns (CompBalanceMetadata memory);

    function getCompBalanceMetadataExt(
        address comp,
        address comptroller,
        address account
    ) external returns (CompBalanceMetadataExt memory);

    function mint(uint256 mintAmount) external returns (uint256);

    function redeem(uint256 redeemTokens) external returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function totalBorrows() external view returns (uint256);

    function totalReserves() external view returns (uint256);

    function getCash() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function claimComp(address holder) external;

    function underlying() external view returns (address);

    function decimals() external view returns (uint8);

    function compAccrued(address holder) external view returns (uint256);
}
