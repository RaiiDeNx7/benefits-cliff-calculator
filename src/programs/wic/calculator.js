/**
 * WIC — Special Supplemental Nutrition Program for Women, Infants, and Children.
 *
 * Mirrors WIC sheet monthly benefit F211 / F213.
 *
 * What the formula does:
 *   1. Countable income E = earned + parent SS (H2) + MAX(TANF L, T).
 *   2. If E is under the household-size income limit (I2), benefit =
 *      (eligible person count G2) × (per-person monthly value).
 *   3. Otherwise $0.
 *
 * Eligible persons (G2) in the app are young children in infant–preschool
 * age bands (teen/school-age bands are excluded from the count).
 *
 * @requires src/programs/wic/lookup-data.js
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

    // E = earned + SS + TANF cash (workbook counts TANF as unearned for the test).
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
