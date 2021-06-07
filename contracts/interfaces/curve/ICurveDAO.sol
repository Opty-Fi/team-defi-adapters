// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface ICurveDAO {
    function mint(address liquidityPoolGauge) external; // Function to mint CRV tokens.
}
