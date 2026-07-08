/**
 * SNAP!V209 / SNAP!V211 (FY2026).
 * @requires src/programs/snap/lookup-data.js, src/programs/tanf/lookup-data.js, src/shared/tanf-view.js
 */
(function (global) {
  "use strict";

  function clampHh(n) {
    const x = Math.round(Number(n) || 0);
    return Math.min(8, Math.max(1, x));
  }

  function lookupSnapGrossNet(hh) {
    const rows = typeof SNAP_GROSS_NET_TEST_ROWS !== "undefined" ? SNAP_GROSS_NET_TEST_ROWS : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i];
    }
    return rows[0] || { grossLessThan: 0, netCountableLessThan: 0 };
  }

  function lookupSnapMaxAllotment(hh) {
    const rows = typeof SNAP_MAX_ALLOTMENT_BY_HH !== "undefined" ? SNAP_MAX_ALLOTMENT_BY_HH : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i].maxAllotment;
    }
    return rows[0] ? rows[0].maxAllotment : 0;
  }

  function lookupSnapH2HeatingCooling(hh) {
    const rows = typeof SNAP_UTILITY_BY_HH !== "undefined" ? SNAP_UTILITY_BY_HH : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i].heatingCoolingStandard;
    }
    return rows[0] ? rows[0].heatingCoolingStandard : 0;
  }

  function lookupSnapSua(hh) {
    const rows = typeof SNAP_UTILITY_BY_HH !== "undefined" ? SNAP_UTILITY_BY_HH : [];
    const k = clampHh(hh);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === k) return rows[i].sua;
    }
    return rows[0] ? rows[0].sua : 0;
  }

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

    const hh = clampHh(p.householdSizeSnap);
    const snapG = lookupSnapGrossNet(hh);
    const k2 = lookupSnapMaxAllotment(hh);
    const j2net = snapG.netCountableLessThan;
    const g2gross = snapG.grossLessThan;
    const h2heat = lookupSnapH2HeatingCooling(hh);
    const snapL2Cap = typeof SNAP_SHELTER_CAP_L2 === "number" ? SNAP_SHELTER_CAP_L2 : 712;
    const headerI2 = snapHeaderI2Utility(p);

    const annual208 = p.tanfAnnualForSnapC205 != null ? p.tanfAnnualForSnapC205 : 99500;
    const lt208 =
      typeof computeTanf208MaxLT === "function"
        ? computeTanf208MaxLT(p, annual208)
        : computeTanfViewRowLT(
            Object.assign({}, p, { monthlyEarned: annual208 / 12 })
          );
    const c205 = Math.max(lt208.L, lt208.T);

    const tanfBEarned =
      p.monthlyEarnedTanfB != null ? p.monthlyEarnedTanfB : p.monthlyEarnedSnapD;
    const tanfMain = computeTanfViewRowLT(Object.assign({}, p, { monthlyEarned: tanfBEarned }));
    const cRowMax = Math.max(tanfMain.L, tanfMain.T);

    const d = Number(p.monthlyEarnedSnapD) || 0;
    const cTanf = cRowMax;
    const e = (Number(p.monthlySS) || 0) + (Number(p.countableUnearnedOther) || 0);
    const fSnap = Number(p.disabilitySupportIncomeSnap) || 0;
    const g = d + cTanf + e + fSnap;
    const hYes = g < g2gross;
    const iEarn20 = d * 0.2;
    const k = Math.max(0, g - iEarn20 - h2heat);
    const lRow = headerI2;
    const mShelter = Number(p.shelterMonthly) || 0;
    const nShelterTotal = lRow + mShelter;
    const pHalf = k / 2;
    const d2 = Number(p.elderlyAdultsSnapCount) || 0;
    const e2 = Number(p.snapDisabilityMemberCount) || 0;
    const deSum = d2 + e2;
    const oYes = deSum > 0 && k < j2net;
    let q = 0;
    if (deSum === 0) {
      if (nShelterTotal < snapL2Cap && nShelterTotal - pHalf > 0) {
        q = nShelterTotal - pHalf;
      } else if (nShelterTotal > snapL2Cap) {
        q = snapL2Cap;
      }
    }
    let r = 0;
    if (deSum > 0 && nShelterTotal - pHalf > 0) r = nShelterTotal - pHalf;
    let s = 0;
    if (deSum > 0 && k - r > 0) s = k - r;
    else if (deSum === 0 && k - q > 0) s = k - q;
    const tExcess = s * 0.3;
    const inner = k2 - tExcess;
    const uCond = p.snapSelected && (hYes || oYes) && g < g2gross && inner > 10;
    const u = uCond ? Math.floor(inner) : 0;
    if (u <= 0) return 0;
    let v = u;
    if (c205 < 3 && u > 10 && u < 24) v = 24;
    return v;
  }

  global.computeSnapV = computeSnapV;
})(typeof window !== "undefined" ? window : globalThis);
