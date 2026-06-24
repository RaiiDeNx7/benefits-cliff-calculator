/**
 * Auto-generated from "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
 * Sheet "EITC Rates": rows A6:G13 (not MFJ) and A17:G24 (MFJ).
 * Regenerate: npm run build:eitc-data
 */

/** @typedef {{ numChildren: number, agiMustBeBelow: number, maxCredit: number, phaseInRate: number, phaseOutRate: number, maxCreditStartsAt: number, phaseOutStartsAt: number }} EitcRateRow */

/** @type {EitcRateRow[]} */
const EITC_RATES_NOT_MFJ = [
  {
    "numChildren": 0,
    "agiMustBeBelow": 19104,
    "maxCredit": 664,
    "phaseInRate": 0.0765,
    "phaseOutRate": 0.0765,
    "maxCreditStartsAt": 8680,
    "phaseOutStartsAt": 10860
  },
  {
    "numChildren": 1,
    "agiMustBeBelow": 50434,
    "maxCredit": 4427,
    "phaseInRate": 0.34,
    "phaseOutRate": 0.1598,
    "maxCreditStartsAt": 13020,
    "phaseOutStartsAt": 23890
  },
  {
    "numChildren": 2,
    "agiMustBeBelow": 57310,
    "maxCredit": 7316,
    "phaseInRate": 0.4,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 23890
  },
  {
    "numChildren": 3,
    "agiMustBeBelow": 61555,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 23890
  },
  {
    "numChildren": 4,
    "agiMustBeBelow": 61555,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 23890
  },
  {
    "numChildren": 5,
    "agiMustBeBelow": 61555,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 23890
  },
  {
    "numChildren": 6,
    "agiMustBeBelow": 61555,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 23890
  },
  {
    "numChildren": 7,
    "agiMustBeBelow": 61555,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 23890
  }
];

/** @type {EitcRateRow[]} */
const EITC_RATES_MFJ = [
  {
    "numChildren": 0,
    "agiMustBeBelow": 26214,
    "maxCredit": 664,
    "phaseInRate": 0.0765,
    "phaseOutRate": 0.065,
    "maxCreditStartsAt": 8680,
    "phaseOutStartsAt": 18140
  },
  {
    "numChildren": 1,
    "agiMustBeBelow": 57554,
    "maxCredit": 4427,
    "phaseInRate": 0.34,
    "phaseOutRate": 0.1598,
    "maxCreditStartsAt": 13020,
    "phaseOutStartsAt": 31160
  },
  {
    "numChildren": 2,
    "agiMustBeBelow": 64430,
    "maxCredit": 7316,
    "phaseInRate": 0.4,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 31160
  },
  {
    "numChildren": 3,
    "agiMustBeBelow": 68675,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 31160
  },
  {
    "numChildren": 4,
    "agiMustBeBelow": 68675,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 31160
  },
  {
    "numChildren": 5,
    "agiMustBeBelow": 68675,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 31160
  },
  {
    "numChildren": 6,
    "agiMustBeBelow": 68675,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 31160
  },
  {
    "numChildren": 7,
    "agiMustBeBelow": 68675,
    "maxCredit": 8231,
    "phaseInRate": 0.45,
    "phaseOutRate": 0.2106,
    "maxCreditStartsAt": 18290,
    "phaseOutStartsAt": 31160
  }
];
