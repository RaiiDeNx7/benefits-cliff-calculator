/**
 * EITC — Earned Income Tax Credit (federal + Virginia add-on).
 *
 * Mirrors Excel "EITC" sheet rows 208 / 210. The credit is computed on *annual*
 * earned income, then the UI shows the monthly equivalent (annual ÷ 12).
 *
 * What the formula does:
 *   1. Look up the rate row by number of children (0–7) and filing status
 *      (Married Filing Jointly vs other) from EITC Rates tables.
 *   2. Federal credit phases in with income, plateaus at max credit, then
 *      phases out until AGI exceeds the “must be below” cutoff.
 *   3. Virginia add-on on these rows = 15% of the federal credit
 *      (workbook D208 = C208*0.15; do not use the 0.2 rate from row 5).
 *   4. Combined annual E = federal + VA; monthly = E / 12.
 *
 * Excel mapping:
 * - 'Total income package'!A10 = gate (TRUE shows credit; app uses EITC checkbox).
 * - B208 / B210 = monthly earned ('Total income package'!B90 / B91).
 * - A208 / A210 = B*12 (annual earned for bracket math).
 * - EITC!C2..K2 = VLOOKUP on children (B31) × filing status (B72)
 *   against "EITC Rates" (NOT MFJ: A6:G13, MFJ: A17:G24).
 * - C208 / C210 = federal credit (TY 2026 table).
 * - D208 / D210 = C * 0.15 (VA add-on).
 * - E208 / E210 = IF(A10, C+D, 0). UI shows E/12.
 *
 * @fileoverview Depends on eitcLookupData.js (EITC_RATES_NOT_MFJ, EITC_RATES_MFJ).
 */
(function (global) {
  "use strict";

  /** VA share on federal for E208/E210 only (EITC!D208 = C208*0.15). */
  var VA_RATE_ON_FEDERAL_208 = 0.15;

  /**
   * @param {number} numChildren — same role as 'Total income package'!B31 (0–7 for lookup).
   * @param {boolean} filingMarriedJointly — E2 = "Married filing jointly" vs other → table choice.
   * @returns {object} rate row (agiMustBeBelow, maxCredit, phaseInRate, phaseOutRate, maxCreditStartsAt, phaseOutStartsAt)
   */
  function eitcRateRowFor(numChildren, filingMarriedJointly) {
    var n = Math.max(0, Math.min(7, Math.floor(Number(numChildren) || 0)));
    var table = filingMarriedJointly ? EITC_RATES_MFJ : EITC_RATES_NOT_MFJ;
    var found = table.find(function (r) {
      return r.numChildren === n;
    });
    return found || table[0];
  }

  /**
   * Federal EITC annual (EITC!C208 / C210 core).
   *
   * Regions of annual earned A (using rate-row letters F,G,H,I,J,K):
   *   A > F           → $0 (over the AGI cutoff)
   *   K ≤ A < F       → phase-out: G − (A − K − 1) * I
   *   J ≤ A < K       → plateau at max credit G
   *   A < J           → phase-in: A * H
   *
   * @param {number} annualEarned — A208 or A210
   * @param {object} row — F,G,H,I,J,K from rate row
   */
  function federalEitcAnnual(annualEarned, row) {
    var A = Number(annualEarned) || 0;
    var F = row.agiMustBeBelow;
    var G = row.maxCredit;
    var H = row.phaseInRate;
    var I = row.phaseOutRate;
    var J = row.maxCreditStartsAt;
    var K = row.phaseOutStartsAt;

    var credit;
    if (A > F) {
      credit = 0;
    } else if (A < F && A >= K) {
      credit = G - (A - K - 1) * I;
    } else if (A < K && A >= J) {
      credit = G;
    } else if (A < J) {
      credit = A * H;
    } else {
      credit = 0;
    }
    return Math.max(0, credit);
  }

  /**
   * Annual combined federal + VA (E208 / E210).
   * @param {object} p
   * @param {number} p.monthlyEarned — B208 or B210
   * @param {number} p.numChildren — B31 equivalent
   * @param {boolean} p.filingMarriedJointly
   * @param {boolean} p.eitcEnabled — A10 equivalent
   */
  function computeEitcAnnualE208(p) {
    if (!p.eitcEnabled) return 0;
    if (typeof EITC_RATES_MFJ === "undefined") return 0;
    var row = eitcRateRowFor(p.numChildren, p.filingMarriedJointly);
    var annualEarned = (Number(p.monthlyEarned) || 0) * 12;
    var federal = federalEitcAnnual(annualEarned, row);
    var vaAddOn = federal * VA_RATE_ON_FEDERAL_208;
    return federal + vaAddOn;
  }

  /**
   * Monthly = E208/12 or E210/12 (what the calculator UI displays).
   */
  function computeEitcMonthlyFromMonthlyEarned(p) {
    return computeEitcAnnualE208(p) / 12;
  }

  global.computeEitcAnnualE208 = computeEitcAnnualE208;
  global.computeEitcMonthlyFromMonthlyEarned = computeEitcMonthlyFromMonthlyEarned;
})(typeof window !== "undefined" ? window : globalThis);
