/**
 * Medicaid sheet monthly total N212 / N214 (L212+M212 and L214+M214).
 * Uses MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD (J/H/L) from marketplaceLookupData.js
 * and spend rates from medicaidLookupData.js (Program C148, C152).
 */

(function (global) {
  "use strict";

  /**
   * @param {number} householdSize
   * @returns {{ householdSize: number, jLimitMedicaid: number, hDisregard: number, lLimitMedicaid: number } | null}
   */
  function medicaidThresholdRow(householdSize) {
    const rows =
      typeof MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD !== "undefined"
        ? MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD
        : [];
    const sz = Math.min(8, Math.max(1, Math.floor(householdSize)));
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].householdSize === sz) return rows[i];
    }
    return rows.length ? rows[0] : null;
  }

  /**
   * @param {object} p
   * @param {boolean} p.medicaidSelected — Total income package A16
   * @param {number} p.householdSize — Medicaid B2 / Total income B32
   * @param {number} p.numAdults — Medicaid C2 / Total income B30
   * @param {number} p.numChildren — Medicaid F2 / Total income B31
   * @param {number} p.monthlyEarned — B212 or B214 (monthly earned, ceiling-sum path)
   * @returns {number}
   */
  function computeMedicaidMonthlyN(p) {
    if (!p.medicaidSelected) return 0;
    const row = medicaidThresholdRow(p.householdSize);
    if (!row) return 0;

    const adultRate =
      typeof MEDICAID_ADULT_SPEND_MONTHLY === "number"
        ? MEDICAID_ADULT_SPEND_MONTHLY
        : 0;
    const childRate =
      typeof MEDICAID_CHILD_SPEND_MONTHLY === "number"
        ? MEDICAID_CHILD_SPEND_MONTHLY
        : 0;

    const e = Math.max(0, p.monthlyEarned - row.hDisregard);
    const m2 = p.numAdults * adultRate;
    const p2 = p.numChildren * childRate;

    let l212 = 0;
    if (e < row.jLimitMedicaid) l212 = m2;
    let m212 = 0;
    if (e < row.lLimitMedicaid) m212 = p2;
    return l212 + m212;
  }

  global.computeMedicaidMonthlyN = computeMedicaidMonthlyN;
})(typeof window !== "undefined" ? window : globalThis);
