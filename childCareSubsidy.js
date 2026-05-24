/**
 * Child care subsidy monthly amount — mirrors Excel "Child care subsidy" sheet
 * rows 208 (current / Total income package B90) and 210 (new / B91).
 *
 * Excel: S208 = IF(AND('Total income package'!$A$8=TRUE, OR(F208,G208,H208)),
 *                  SUM(J208:N208) - R208, 0)
 * Dependencies documented inline (F208..R208, sheet constants K2, M2, N2, C2:H2, A3).
 *
 * TANF column H uses TANF-VIEW!L212/T212 (row 208) and L214/T214 (row 210).
 * Pass tanfPathL / tanfPathT from those cells when available; otherwise 0 (H = "No").
 */

(function (global) {
  "use strict";

  /** Locality label in UI → key in CHILD_CARE_LOCALITY_BY_NAME (workbook typo). */
  var LOCALITY_ALIASES = {
    "Rockbridge-Buena Vista-Lexington": "Rockbridge-",
  };

  function resolveLocalityData(localityName) {
    if (!localityName) return null;
    var direct = CHILD_CARE_LOCALITY_BY_NAME[localityName];
    if (direct) return direct;
    var alias = LOCALITY_ALIASES[localityName];
    if (alias && CHILD_CARE_LOCALITY_BY_NAME[alias]) {
      return CHILD_CARE_LOCALITY_BY_NAME[alias];
    }
    return null;
  }

  function householdLookupRows(householdSize) {
    var hh = Math.max(1, Math.min(8, Math.floor(Number(householdSize)) || 1));
    var fpl =
      CHILD_CARE_FPL_BY_HOUSEHOLD.find(function (r) {
        return r.householdSize === hh;
      }) || CHILD_CARE_FPL_BY_HOUSEHOLD[CHILD_CARE_FPL_BY_HOUSEHOLD.length - 1];
    var lim =
      CHILD_CARE_LIMITS_BY_HOUSEHOLD.find(function (r) {
        return r.householdSize === hh;
      }) || CHILD_CARE_LIMITS_BY_HOUSEHOLD[CHILD_CARE_LIMITS_BY_HOUSEHOLD.length - 1];
    return { hh: hh, fpl: fpl, limits: lim };
  }

  function monthlyIncomeLimitForGroup(group, limitsRow) {
    var g = Number(group) || 1;
    if (g === 1) return limitsRow.groupILimit;
    if (g === 2) return limitsRow.groupIiLimit;
    if (g === 3) return limitsRow.groupIiiLimit;
    return limitsRow.groupIvLimit;
  }

  /**
   * @param {object} counts — C2..H2 equivalents
   * @param {number} counts.infant
   * @param {number} counts.toddler
   * @param {number} counts.two
   * @param {number} counts.preschool
   * @param {number} counts.school
   * @param {number} counts.teenIncapable
   */
  function sumYoungForF(counts) {
    return (
      (counts.infant || 0) +
      (counts.toddler || 0) +
      (counts.two || 0) +
      (counts.preschool || 0)
    );
  }

  function sumAllSubsidyChildren(counts) {
    return sumYoungForF(counts) + (counts.school || 0) + (counts.teenIncapable || 0);
  }

  function monthlyCopayPerChild(B, N2, eFpl, sumCDEH) {
    if (B >= N2) return 0;
    if (eFpl > 3.5) return 375 * sumCDEH;
    if (eFpl > 3) return 325 * sumCDEH;
    if (eFpl > 2.5) return 275 * sumCDEH;
    if (eFpl > 2) return 225 * sumCDEH;
    if (eFpl > 1.5) return 175 * sumCDEH;
    if (eFpl > 1) return 125 * sumCDEH;
    if (eFpl > 0) return 5 * sumCDEH;
    return 0;
  }

  function yesNoFromTanfPath(L, T) {
    var a = Number(L) || 0;
    var b = Number(T) || 0;
    return a > 0 || b > 0 ? "Yes" : "No";
  }

  /**
   * @param {object} p
   * @param {boolean} p.childCareSelected — 'Total income package'!A8
   * @param {string} p.locality — 'Total income package'!B3
   * @param {number} p.householdSize — 'Total income package'!B32 (capped 1–8)
   * @param {object} p.counts — C2:H2
   * @param {number} p.monthlyEarned — B208 or B210 (monthly earned only)
   * @param {number} p.monthlySocialSecurity — D80
   * @param {number} [p.tanfPathL] — TANF-VIEW L column for this scenario row
   * @param {number} [p.tanfPathT] — TANF-VIEW T column
   * @returns {number} Monthly subsidy (S208 / S210)
   */
  function computeChildCareSubsidyMonthly(p) {
    if (!p.childCareSelected) return 0;

    var loc = resolveLocalityData(p.locality);
    if (!loc) return 0;

    var lk = householdLookupRows(p.householdSize);
    var K2 = lk.fpl.monthlyFpl;
    var N2 = lk.limits.smi85;
    var M2 = monthlyIncomeLimitForGroup(loc.group, lk.limits);

    var c = p.counts || {};
    var C2 = c.infant || 0;
    var D2 = c.toddler || 0;
    var E2 = c.two || 0;
    var F2 = c.preschool || 0;
    var G2 = c.school || 0;
    var H2 = c.teenIncapable || 0;

    var B = Number(p.monthlyEarned) || 0;
    var Css = Number(p.monthlySocialSecurity) || 0;
    var D = B + Css;
    var E = K2 > 0 ? D / K2 : 0;

    var sumCF = sumYoungForF(c);
    var sumAll = sumAllSubsidyChildren(c);

    var F208 = B < N2 && sumCF > 0 ? "Yes" : "No";
    var G208 = B < M2 ? "Yes" : "No";
    var H208 = yesNoFromTanfPath(p.tanfPathL, p.tanfPathT);

    if (!(F208 === "Yes" || G208 === "Yes" || H208 === "Yes")) return 0;

    var rates = loc.rates;
    var J =
      (B > N2 ? 0 : rates[0] * C2) * 20;
    var K = (B > N2 ? 0 : rates[1] * D2) * 20;
    var L = (B > N2 ? 0 : rates[2] * E2) * 20;
    var M = (B > N2 ? 0 : rates[3] * F2) * 20;
    var Ncol = (B > N2 ? 0 : rates[4] * (G2 + H2)) * 20;

    var I = monthlyCopayPerChild(B, N2, E, sumAll);
    var O = I * sumAll;
    var P = B * 0.05;
    var Q = I * 3;
    var R = Math.min(O, P) < Q ? Math.min(O, P) : Q;

    var sumJN = J + K + L + M + Ncol;
    return sumJN - R;
  }

  global.computeChildCareSubsidyMonthly = computeChildCareSubsidyMonthly;
})(typeof window !== "undefined" ? window : globalThis);
