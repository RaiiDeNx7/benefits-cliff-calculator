/**
 * Housing Choice Voucher program monthly subsidy — Excel `Housing Voucher` sheet **Q209** / **Q211**.
 *
 * Q = IF(AND(G="Yes", A14, P−N>0), P−N, 0)
 * F = B + C + D + E (monthly gross + TANF + SS + SSI parts; E defaults 0)
 * G = IF(F < L2_monthly, "Yes", "No") with L2 from Location AMI 80% / 12 by household size
 * H deduction row = 40*(dependents + F59); F59 default 0
 * I row = IF(H2_elderCount + F59 > 0, 33.33, 0) — same F59 as sheet $I$2
 * J = max(0, F − H_row − I_row); K=0.3*J; L=0.1*F; M=50; N=max(K,L,M); P=payment std by bedroom
 *
 * C209/C211 use TANF-VIEW L212/T212 vs L214/T214; app reuses optional **cc-tanf-l** / **cc-tanf-t** (MAX).
 * When qualified shelter is entered, subsidy is **min(P−N, GR−N)** with
 * **GR = min(P, max(shelter + max(util, SUA), min(F×α, P − pad)))** (α defaults to 1.825, pad to 75).
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

  function ami80MonthlyLimit(loc, householdSize) {
    var hh = Math.max(1, Math.min(8, Math.floor(Number(householdSize)) || 1));
    var row = loc.ami80MonthlyByHousehold[String(hh)];
    return row != null ? Number(row) : 0;
  }

  function paymentStandard(loc, bedrooms) {
    var bed = Math.max(1, Math.min(5, Math.floor(Number(bedrooms)) || 0));
    if (!bed) return 0;
    var row = loc.paymentStandardByBedroom[String(bed)];
    return row != null ? Number(row) : 0;
  }

  function elderlyAdultCount(adultAges) {
    var n = 0;
    var ages = adultAges || [];
    for (var i = 0; i < ages.length; i++) {
      if ((Number(ages[i]) || 0) >= 62) n += 1;
    }
    return n;
  }

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

    var B = Number(p.monthlyEarned) || 0;
    var C = tanfMonthly(p.tanfL, p.tanfT);
    var D = Number(p.monthlySocialSecurity) || 0;
    var E = Number(p.monthlySsi) || 0;
    var F = B + C + D + E;

    var L2 = ami80MonthlyLimit(loc, p.householdSize);
    if (F >= L2) return 0;

    var f59 = Number(p.disabilityF59) || 0;
    var dependents = Math.max(0, Math.floor(Number(p.numDependents) || 0));
    var H = 40 * (dependents + f59);
    var I = elderlyAdultCount(p.adultAges) + f59 > 0 ? 33.33 : 0;
    var J = Math.max(0, F - H - I);
    var K = 0.3 * J;
    var L = 0.1 * F;
    var M = 50;
    var N = Math.max(K, L, M);
    var P = paymentStandard(loc, bedrooms);
    var rawPN = P - N;
    if (!(F < L2 && p.hcvSelected && rawPN > 0)) return 0;

    var shelter = Math.max(0, Number(p.shelterMonthly) || 0);
    if (shelter > 0) {
      var utilAct = Math.max(0, Number(p.utilityMonthly) || 0);
      var sua = Math.max(0, Number(p.snapUtilityAllowanceMonthly) || 0);
      var comp = shelter + Math.max(utilAct, sua);
      var mult =
        Number(p.hcvRentIncomeMultiple) > 0 ? Number(p.hcvRentIncomeMultiple) : 1460 / 800;
      var pad = Number(p.hcvGrossRentPad);
      if (Number.isNaN(pad) || pad < 0) pad = 75;
      var inner = Math.min(F * mult, Math.max(0, P - pad));
      var gr = Math.min(P, Math.max(comp, inner) + 59 / 1000);
      var capped = Math.min(rawPN, Math.max(0, gr - N));
      return roundCents(capped);
    }

    return roundCents(rawPN);
  }

  global.computeHcvProgramMonthlyQ = computeHcvProgramMonthlyQ;
})(typeof window !== "undefined" ? window : globalThis);
