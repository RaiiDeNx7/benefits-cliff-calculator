/**
 * Health Insurance Marketplace subsidy (premium tax credit), monthly.
 *
 * Mirrors Excel 'Health insurance subsidy '!L220 / L222.
 *
 * What the formula does:
 *   1. If the household would qualify for Medicaid (same J-limit test as the
 *      Medicaid module), subsidy is $0 — Medicaid blocks Marketplace.
 *   2. K = sum of Second Lowest Cost Silver Plan (SLCSP) premiums for each
 *      adult age in the locality (up to 8 adults).
 *   3. J = expected household contribution from income as a % of FPL, using
 *      ACA contribution brackets (E/F rates and H/I income band edges).
 *   4. L = max(0, K − J) — subsidy fills the gap between SLCSP and contribution.
 *
 * B220/B222 = 'Total income package'!B90 / B91 (monthly earned).
 * K2 = VLOOKUP(household size, Program specific A6:D13, 3) — MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD
 * Medicaid H2/J2 from Program A5:N13 cols G, F — MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD
 */
(function (global) {
  "use strict";

  var LOCALITY_ALIASES = {
    "Rockbridge-Buena Vista-Lexington": "Rockbridge-",
  };

  function resolveLocalityName(name) {
    if (!name) return "";
    if (
      typeof SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE !== "undefined" &&
      SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE[name]
    ) {
      return name;
    }
    var alt = LOCALITY_ALIASES[name];
    if (alt && SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE[alt]) return alt;
    return name;
  }

  /** Monthly FPL for household size (denominator for % FPL). */
  function monthlyFplForHousehold(householdSize) {
    var hh = Math.max(1, Math.min(8, Math.floor(Number(householdSize)) || 1));
    var row = MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD.find(function (r) {
      return r.householdSize === hh;
    });
    return row ? row.monthlyFpl : 1330;
  }

  function medicaidThresholdRow(householdSize) {
    var hh = Math.max(1, Math.min(8, Math.floor(Number(householdSize)) || 1));
    return (
      MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD.find(function (r) {
        return r.householdSize === hh;
      }) || MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD[0]
    );
  }

  /**
   * Income-band edges (M/N) derived from monthly FPL K2.
   * Used with eFromD/fFromD/hFromD/iFromD to interpolate the contribution rate.
   */
  function mnFromK2(K2) {
    return {
      m2: 0,
      n2: K2 * 1.49,
      m3: K2 * 1.5,
      n3: K2 * 1.99,
      m4: K2 * 2,
      n4: K2 * 2.49,
      m5: K2 * 2.5,
      n5: K2 * 2.99,
      m6: K2 * 3,
      n6: K2 * 3.99,
      m7: K2 * 4,
      n7: 500000 / 12,
    };
  }

  /** Lower contribution rate E for % FPL band D = income / FPL. */
  function eFromD(D) {
    if (D > 3.99) return 0.085;
    if (D > 2.99) return 0.06;
    if (D > 1.99) return 0.02;
    if (D > 1.49) return 0;
    return 0;
  }

  /** Upper contribution rate F for the same % FPL band. */
  function fFromD(D) {
    if (D > 3.99) return 0.085;
    if (D > 2.99) return 0.085;
    if (D > 2.49) return 0.06;
    if (D > 1.99) return 0.04;
    if (D > 1.49) return 0.02;
    return 0;
  }

  /** Upper income edge H of the active ACA bracket. */
  function hFromD(D, mn) {
    if (D > 3.99) return mn.n7;
    if (D > 2.99) return mn.n6;
    if (D > 2.49) return mn.n5;
    if (D > 1.99) return mn.n4;
    if (D > 1.49) return mn.n3;
    if (D >= 0) return mn.n2;
    return 0;
  }

  /** Lower income edge I of the active ACA bracket. */
  function iFromD(D, mn) {
    if (D > 3.99) return mn.n6;
    if (D > 2.99) return mn.n5;
    if (D > 2.49) return mn.n4;
    if (D > 1.99) return mn.n3;
    if (D > 1.49) return mn.n2;
    if (D >= 0) return 0;
    return 0;
  }

  /**
   * Expected monthly contribution J:
   *   B * (E + (B − I) * (F − E) / (H − I))
   * Linearly interpolates between rates E and F across the income band [I, H].
   */
  function contributionJ(B, K2) {
    var mn = mnFromK2(K2);
    var D = K2 > 0 ? B / K2 : 0;
    var E = eFromD(D);
    var F = fFromD(D);
    var H = hFromD(D, mn);
    var I = iFromD(D, mn);
    var denom = H - I;
    if (denom === 0) return B * E;
    return B * (E + ((B - I) * (F - E)) / denom);
  }

  /**
   * True when countable income (earned − disregard) is under the adult Medicaid
   * limit — same gate that zeros Marketplace subsidy (O = "Yes" in Excel).
   */
  function medicaidBlocksMarketplace(monthlyEarned, householdSize) {
    var med = medicaidThresholdRow(householdSize);
    var B = Number(monthlyEarned) || 0;
    var E = Math.max(0, B - med.hDisregard);
    return E < med.jLimitMedicaid;
  }

  /** Sum SLCSP adult premiums for each positive age (Excel C4:C11). */
  function slcspAdultsSum(locality, adultAges) {
    var loc = resolveLocalityName(locality);
    var table =
      typeof SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE !== "undefined"
        ? SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE[loc]
        : null;
    if (!table) return 0;
    var sum = 0;
    for (var i = 0; i < 8; i++) {
      var age = Math.floor(Number(adultAges[i]) || 0);
      if (age <= 0) continue;
      var prem = table[age];
      if (prem == null) prem = table[String(age)];
      sum += Number(prem) || 0;
    }
    return sum;
  }

  /**
   * @param {object} p
   * @param {boolean} p.marketplaceSelected
   * @param {string} p.locality
   * @param {number} p.householdSize
   * @param {number[]} p.adultAges — up to 8 entries (Excel B4–B11)
   * @param {number} p.monthlyEarned — B90 / B91
   */
  function computeMarketplaceSubsidyMonthlyL(p) {
    if (!p.marketplaceSelected) return 0;
    if (typeof MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD === "undefined") return 0;

    var K2 = monthlyFplForHousehold(p.householdSize);
    var K = slcspAdultsSum(p.locality, p.adultAges || []);
    var B = Number(p.monthlyEarned) || 0;
    var J = contributionJ(B, K2);

    if (medicaidBlocksMarketplace(B, p.householdSize)) return 0;
    return Math.max(0, K - J);
  }

  global.computeMarketplaceSubsidyMonthlyL = computeMarketplaceSubsidyMonthlyL;
})(typeof window !== "undefined" ? window : globalThis);
