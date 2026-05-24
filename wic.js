/**
 * WIC sheet monthly benefit F211 / F213.
 * F = IF(E < I2, G2 * per-person value, 0) with E = B + H2 + D.
 * @requires snapTanfWicLookupData.js
 */
(function (global) {
  "use strict";

  function clampHh(n) {
    const x = Math.round(Number(n) || 0);
    return Math.min(8, Math.max(1, x));
  }

  /**
   * @param {object} p
   * @param {boolean} p.wicSelected
   * @param {number} p.householdSizeWic — WIC B2
   * @param {number} p.monthlyEarnedWicB — B211 / B213
   * @param {number} p.wicUnearnedH2 — WIC H2 (unearned / SS aggregate)
   * @param {number} p.tanfMaxLTForWicD — MAX(TANF-VIEW L,T) for row 212/214
   * @param {number} p.wicEligiblePersonCount — WIC G2
   * @returns {number}
   */
  function computeWicMonthlyF(p) {
    if (!p.wicSelected) return 0;
    const hh = clampHh(p.householdSizeWic);
    const rows =
      typeof WIC_INCOME_LIMIT_BY_HH !== "undefined" ? WIC_INCOME_LIMIT_BY_HH : [];
    const limRow = rows.find(function (x) {
      return x.hh === hh;
    });
    const limitRow = limRow || rows[rows.length - 1];
    const i2 = limitRow ? limitRow.limit : 0;
    const e =
      (Number(p.monthlyEarnedWicB) || 0) +
      (Number(p.wicUnearnedH2) || 0) +
      (Number(p.tanfMaxLTForWicD) || 0);
    if (e >= i2) return 0;
    const per =
      typeof WIC_VALUE_PER_WIC_PERSON_MONTHLY === "number"
        ? WIC_VALUE_PER_WIC_PERSON_MONTHLY
        : 0;
    const g2 = Number(p.wicEligiblePersonCount) || 0;
    return per * g2;
  }

  global.computeWicMonthlyF = computeWicMonthlyF;
  global.computeWicF = computeWicMonthlyF;
})(typeof window !== "undefined" ? window : globalThis);
