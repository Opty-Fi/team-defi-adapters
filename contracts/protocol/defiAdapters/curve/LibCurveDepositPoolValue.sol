// SPDX-License-Identifier:MIT

pragma solidity ^0.6.12;

import { CurveDepositPool } from "./CurveDepositPool.sol";

library LibCurveDeposit {
    function getPoolValueInUSD(address _liquidityPool, address) internal view returns (uint256) {
        if (_liquidityPool == CurveDepositPool.COMPOUND_DEPOSIT_POOL) {
            return _getCurveCompoundPoolValueInUSD(_liquidityPool);
        }
    }

    function _getCurveCompoundPoolValueInUSD(address) private view returns (uint256) {
        return address(0);
    }
}
