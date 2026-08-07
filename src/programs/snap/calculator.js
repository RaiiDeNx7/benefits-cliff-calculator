/**
 * SNAP (Supplemental Nutrition Assistance Program) monthly allotment.
 *
 * Mirrors Excel SNAP!V209 (current) / SNAP!V211 (new). Returns the monthly
 * food-benefit dollars for the household, or 0 if ineligible / not selected.
 *
 * High-level flow:
 *   1. Build gross countable income (earned + TANF + SS + SSI).
 *   2. Apply 20% earned disregard and heating/cooling standard → net-ish income K.
 *   3. Compute excess shelter (utilities + rent above half of K), with a cap
 *      for households without elderly/disabled members.
 *   4. Allotment ≈ max allotment − 30% of (K − excess shelter); floor/ceil rules.
 *   5. Min-allotment bump (C205): if a high-income TANF probe is near zero and
 *      the raw allotment is between $10 and $24, raise it to $24.
 *
 * TANF is embedded via computeTanfViewRowLT / computeTanf208MaxLT — SNAP treats
 * MAX(L,T) as unearned cash in the gross test.
 *
 * @requires src/programs/snap/lookup-data.js, src/programs/tanf/lookup-data.js, src/shared/tanf-view.js
 */
(function (global) {
  "use strict";

  /** SNAP tables are defined for household sizes 1–8. */
  function clampHh(n) {
    const x = Math.round(Number(n) || 0);
    return Math.min(8, Math.max(1, x));
  }

  /** Gross and net income test thresholds for this household size. */
  function lookupSnapGrossNet(hh) {
    const rows = typeof SNAP_GROSS_NET_TEST_ROWS !== "undefined" ? SNAP_GROSS_NET_TEST_ROWS : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i];
    }
    return rows[0] || { grossLessThan: 0, netCountableLessThan: 0 };
  }

  /** Maximum monthly SNAP allotment (before excess-shelter reduction). */
  function lookupSnapMaxAllotment(hh) {
    const rows = typeof SNAP_MAX_ALLOTMENT_BY_HH !== "undefined" ? SNAP_MAX_ALLOTMENT_BY_HH : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i].maxAllotment;
    }
    return rows[0] ? rows[0].maxAllotment : 0;
  }

  /** Heating/cooling standard (H2) used in the net-income calculation. */
  function lookupSnapH2HeatingCooling(hh) {
    const rows = typeof SNAP_UTILITY_BY_HH !== "undefined" ? SNAP_UTILITY_BY_HH : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i].heatingCoolingStandard;
    }
    return rows[0] ? rows[0].heatingCoolingStandard : 0;
  }

  /** Standard Utility Allowance (SUA) when the household opts for the standard. */
  function lookupSnapSua(hh) {
    const rows = typeof SNAP_UTILITY_BY_HH !== "undefined" ? SNAP_UTILITY_BY_HH : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i].sua;
    }
    return rows[0] ? rows[0].sua : 0;
  }

  /**
   * Utility dollars used in shelter total (I2):
   * SUA method → table SUA; otherwise the user-entered actual utility amount.
   */
  function snapHeaderI2Utility(p) {
    const hh = clampHh(p.householdSizeSnap);
    if (p.utilityMethod === "sua") return lookupSnapSua(hh);
    return Number(p.utilityMonthly) || 0;
  }

  /**
   * @param {object} p
   * @param {boolean} p.snapSelected
   * @param {number} p.householdSizeSnap
   * @param {number} p.monthlyEarnedSnapD — SNAP D209 / D211
   * @param {number} [p.monthlyEarnedTanfB] — TANF B212/B214 (workbook: both B90; default = Snap D)
   * @param {number} p.monthlySS
   * @param {number} p.countableUnearnedOther — Tip D86 path
   * @param {number} p.shelterMonthly — Tip B69
   * @param {string} p.utilityMethod
   * @param {number} p.utilityMonthly
   * @param {number} p.elderlyAdultsSnapCount — SNAP D2 (ages > 59)
   * @param {number} p.snapDisabilityMemberCount — SNAP E2 (F59+D59+H59+D64)
   * @param {number} p.disabilitySupportIncomeSnap — SNAP F209/F211 (SSI income)
   * @param {number} p.tanfAnnualForSnapC205
   * @param {number} p.tanfCaretakerDisabledYesCount
   * @param {number} p.tipD61
   * @param {number} p.tipD66ChildrenNotInTanfAu
   * @param {number} p.tipB31Children
   * @param {number} p.tanfRegionGroupA3
   * @param {boolean} p.tanfSelected
   * @param {boolean} p.tanfViewSelected
   */
  function computeSnapV(p) {
    if (!p.snapSelected) return 0;
    if (typeof computeTanfViewRowLT !== "function") return 0;

    // --- Lookups for this household size ---
    const hh = clampHh(p.householdSizeSnap);
    const snapG = lookupSnapGrossNet(hh);
    const k2 = lookupSnapMaxAllotment(hh);
    const j2net = snapG.netCountableLessThan;
    const g2gross = snapG.grossLessThan;
    const h2heat = lookupSnapH2HeatingCooling(hh);
    const snapL2Cap = typeof SNAP_SHELTER_CAP_L2 === "number" ? SNAP_SHELTER_CAP_L2 : 744;
    const headerI2 = snapHeaderI2Utility(p);

    // C205 probe: run TANF at a fixed high annual income (~$99,500).
    // If that probe’s MAX(L,T) is under $3, small allotments get raised to $24.
    const annual208 = p.tanfAnnualForSnapC205 != null ? p.tanfAnnualForSnapC205 : 99500;
    const lt208 =
      typeof computeTanf208MaxLT === "function"
        ? computeTanf208MaxLT(p, annual208)
        : computeTanfViewRowLT(
            Object.assign({}, p, { monthlyEarned: annual208 / 12 })
          );
    const c205 = Math.max(lt208.L, lt208.T);

    // Unearned TANF in SNAP gross = MAX(L,T) at the TANF earned path (usually current B90).
    const tanfBEarned =
      p.monthlyEarnedTanfB != null ? p.monthlyEarnedTanfB : p.monthlyEarnedSnapD;
    const tanfMain = computeTanfViewRowLT(Object.assign({}, p, { monthlyEarned: tanfBEarned }));
    const cRowMax = Math.max(tanfMain.L, tanfMain.T);

    // --- Gross income G and gross test H ---
    const d = Number(p.monthlyEarnedSnapD) || 0; // earned
    const cTanf = cRowMax; // TANF cash counted as unearned
    const e = (Number(p.monthlySS) || 0) + (Number(p.countableUnearnedOther) || 0);
    const fSnap = Number(p.disabilitySupportIncomeSnap) || 0; // SSI
    const g = d + cTanf + e + fSnap;
    const hYes = g < g2gross;

    // --- Net-ish income K: gross − 20% earned − heating/cooling standard ---
    const iEarn20 = d * 0.2;
    const k = Math.max(0, g - iEarn20 - h2heat);

    // --- Shelter excess (Q for non-elderly/disabled; R for elderly/disabled) ---
    const lRow = headerI2; // utilities
    const mShelter = Number(p.shelterMonthly) || 0;
    const nShelterTotal = lRow + mShelter;
    const pHalf = k / 2; // household expected to pay half of K toward shelter
    const d2 = Number(p.elderlyAdultsSnapCount) || 0;
    const e2 = Number(p.snapDisabilityMemberCount) || 0;
    const deSum = d2 + e2; // elderly and/or disabled members present?

    // oYes: alternate eligibility when elderly/disabled and K under the net test.
    const oYes = deSum > 0 && k < j2net;

    // No elderly/disabled: excess shelter capped at L2 (default $744).
    let q = 0;
    if (deSum === 0) {
      if (nShelterTotal < snapL2Cap && nShelterTotal - pHalf > 0) {
        q = nShelterTotal - pHalf;
      } else if (nShelterTotal > snapL2Cap) {
        q = snapL2Cap;
      }
    }
    // With elderly/disabled: uncapped excess shelter (n − half of K).
    let r = 0;
    if (deSum > 0 && nShelterTotal - pHalf > 0) r = nShelterTotal - pHalf;

    // S = income after subtracting the applicable excess-shelter amount.
    let s = 0;
    if (deSum > 0 && k - r > 0) s = k - r;
    else if (deSum === 0 && k - q > 0) s = k - q;

    // Household contribution toward food = 30% of S; allotment = max − that.
    const tExcess = s * 0.3;
    const inner = k2 - tExcess;

    // Must pass gross (or elderly/disabled net alternate), stay under gross again,
    // and produce an allotment greater than $10.
    const uCond = p.snapSelected && (hYes || oYes) && g < g2gross && inner > 10;
    const u = uCond ? Math.floor(inner) : 0;
    if (u <= 0) return 0;

    // Min-allotment rule: bump $11–$23 to $24 when C205 probe is near zero.
    let v = u;
    if (c205 < 3 && u > 10 && u < 24) v = 24;
    return v;
  }

  global.computeSnapV = computeSnapV;
})(typeof window !== "undefined" ? window : globalThis);
