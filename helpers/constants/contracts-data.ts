import { RISK_PROFILE_DATA, OPTY_STAKING_VAULT } from "../type";

export const RISK_PROFILES: RISK_PROFILE_DATA = {
  RP0: {
    name: "RP0",
    canBorrow: false,
    poolRating: [0, 0],
  },
  RP1: {
    name: "RP1",
    canBorrow: false,
    poolRating: [0, 10],
  },
  RP2: {
    name: "RP2",
    canBorrow: true,
    poolRating: [0, 20],
  },
  RP3: {
    name: "RP3",
    canBorrow: true,
    poolRating: [0, 30],
  },
};

export const OPTY_STAKING_VAULTS: OPTY_STAKING_VAULT[] = [
  {
    name: "optyStakingVault1D",
    numberOfDays: "1D",
    lockTime: 86400,
    multiplier: 10000,
  },
  {
    name: "optyStakingVault30D",
    numberOfDays: "30D",
    lockTime: 2592000,
    multiplier: 12000,
  },
  {
    name: "optyStakingVault60D",
    numberOfDays: "60D",
    lockTime: 5184000,
    multiplier: 15000,
  },
  {
    name: "optyStakingVault180D",
    numberOfDays: "180D",
    lockTime: 15552000,
    multiplier: 20000,
  },
];
