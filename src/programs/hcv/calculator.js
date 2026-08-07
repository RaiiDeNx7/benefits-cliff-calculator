/**
 * Housing Choice Voucher (HCV) — monthly program subsidy.
 *
 * Mirrors Excel `Housing Voucher` sheet **Q209** / **Q211**.
 *
 * What the formula does:
 *   1. Gross income F = earned + MAX(TANF L,T) + parent SS + SSI.
 *   2. Income test G: F must be under the locality’s 80% AMI monthly limit (L2)
 *      for the household size.
 *   3. Tenant payment N = max(30% of adjusted income, 10% of gross, $50).
 *      Adjusted income J = F − $40×(dependents + disability) − $33.33 if
 *      elderly (62+) or disabled is present.
 *   4. Payment standard P from locality × bedroom count (1–4).
 *   5. Subsidy Q = P − N (when positive and income-eligible).
 *
 * C209/C211 use TANF-VIEW L212/T212 vs L214/T214; app.js passes those L/T values.
 *
 * Note: The workbook also describes an optional gross-rent (GR) cap using
 * shelter/utility/SUA. This implementation currently returns P−N only;
 * shelter/utility params may be collected by the UI for future parity.
 *
 * @requires hcvLookupData.js (HCV_BY_LOCALITY)
 */
(function (global) {
  "use strict";

  var LOCALITY_ALIASES = {
    "Rockbridge-Buena Vista-Lexington": "Rockbridge-",
  };

  function resolveLocalityData(localityName) {
    if (!localityName || typeof HCV_BY_LOCALITY === "undefined") return null;
    if (HCV_BY_LOCALITY[localityName]) return HCV_BY_LOCALITY[localityName];
    var alias = LOCALITY_ALIASES[localityName];
    if (alias && HCV_BY_LOCALITY[alias]) return HCV_BY_LOCALITY[alias];
    return null;
  }

  /** 80% AMI monthly income limit for household size 1–8. */
  function ami80MonthlyLimit(loc, householdSize) {
    var hh = Math.max(1, Math.min(8, Math.floor(Number(householdSize)) || 1));
    var row = loc.ami80MonthlyByHousehold[String(hh)];
    return row != null ? Number(row) : 0;
  }

  /** PHA payment standard for 1–4 bedrooms (0 bedrooms → no subsidy). */
  function paymentStandard(loc, bedrooms) {
    var bed = Math.max(1, Math.min(4, Math.floor(Number(bedrooms)) || 0));
    if (!bed) return 0;
    var row = loc.paymentStandardByBedroom[String(bed)];
    return row != null ? Number(row) : 0;
  }

  /** Count of adults age 62+ (HCV elderly deduction trigger). */
  function elderlyAdultCount(adultAges) {
    var n = 0;
    var ages = adultAges || [];
    for (var i = 0; i < ages.length; i++) {
      if ((Number(ages[i]) || 0) >= 62) n += 1;
    }
    return n;
  }

  /** TANF cash counted in gross = larger of L and T paths. */
  function tanfMonthly(L, T) {
    return Math.max(Number(L) || 0, Number(T) || 0);
  }

  /**
   * @param {object} p
   * @param {boolean} p.hcvSelected — Total income package A14
   * @param {string} p.locality
   * @param {number} p.householdSize — B2
   * @param {number} p.numDependents — D2
   * @param {number[]} [p.adultAges] — for H2 elderly count (62+)
   * @param {number} p.monthlyEarned — B209 or B211
   * @param {number} [p.tanfL]
   * @param {number} [p.tanfT]
   * @param {number} [p.monthlySocialSecurity]
   * @param {number} [p.monthlySsi]
   * @param {number} [p.disabilityF59]
   * @param {number} p.bedrooms
   * @param {number} [p.shelterMonthly]
   * @param {number} [p.utilityMonthly]
   * @param {number} [p.snapUtilityAllowanceMonthly]
   * @param {number} [p.hcvRentIncomeMultiple]
   * @param {number} [p.hcvGrossRentPad]
   * @returns {number}
   */
  function roundCents(amount) {
    return Math.round(amount * 100) / 100;
  }

  function computeHcvProgramMonthlyQ(p) {
    if (!p.hcvSelected) return 0;

    var loc = resolveLocalityData(p.locality);
    if (!loc) return 0;

    var bedrooms = Math.floor(Number(p.bedrooms) || 0);
    if (bedrooms < 1) return 0;

    // F = gross monthly resources used for the AMI test and tenant share.
    var B = Number(p.monthlyEarned) || 0;
    var C = tanfMonthly(p.tanfL, p.tanfT);
    var D = Number(p.monthlySocialSecurity) || 0;
    var E = Number(p.monthlySsi) || 0;
    var F = B + C + D + E;

    // Must be under 80% AMI monthly for household size.
    var L2 = ami80MonthlyLimit(loc, p.householdSize);
    if (F >= L2) return 0;

    // Adjusted income and tenant payment (higher of 30% adj, 10% gross, $50).
    var f59 = Number(p.disabilityF59) || 0;
    var dependents = Math.max(0, Math.floor(Number(p.numDependents) || 0));
    var H = 40 * (dependents + f59); // $40 dependent/disability deduction
    var I = elderlyAdultCount(p.adultAges) + f59 > 0 ? 33.33 : 0; // elderly/disabled
    var J = Math.max(0, F - H - I);
    var K = 0.3 * J;
    var L = 0.1 * F;
    var M = 50;
    var N = Math.max(K, L, M); // tenant share
    var P = paymentStandard(loc, bedrooms);
    var rawPN = P - N;
    if (!(F < L2 && p.hcvSelected && rawPN > 0)) return 0;

    return roundCents(rawPN);
  }

  global.computeHcvProgramMonthlyQ = computeHcvProgramMonthlyQ;
})(typeof window !== "undefined" ? window : globalThis);
