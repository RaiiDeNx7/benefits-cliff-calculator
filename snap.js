/**
 * SNAP!V209 / SNAP!V211 (FY2026). Uses snapTanfWicLookupData.js.
 * TANF-VIEW row math for SNAP column C is embedded (MAX(L,T) per row).
 */
(function (global) {
  "use strict";

  function clampHh(n) {
    const x = Math.round(Number(n) || 0);
    return Math.min(8, Math.max(1, x));
  }

  function tanfParentYesCount(p) {
    return p.tanfParentYesCount != null
      ? p.tanfParentYesCount
      : p.tanfCaretakerDisabledYesCount;
  }

  function tanfG6Key(p) {
    const d6 = tanfParentYesCount(p) - p.tipD61;
    return clampHh(d6 + (p.tipB31Children - p.tipD66ChildrenNotInTanfAu));
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

  function lookupTanfStandardDeduction(g6k) {
    const rows =
      typeof TANF_STANDARD_DEDUCTION_BY_SIZE !== "undefined" ? TANF_STANDARD_DEDUCTION_BY_SIZE : [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].size === g6k) return rows[i].deduction;
    }
    return rows.length ? rows[rows.length - 1].deduction : 0;
  }

  function lookupTanfMonthly150Fpl(g6k) {
    const rows =
      typeof TANF_MONTHLY_150_FPL_BY_HH !== "undefined" ? TANF_MONTHLY_150_FPL_BY_HH : [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === g6k) return rows[i].monthly150;
    }
    return rows.length ? rows[rows.length - 1].monthly150 : 0;
  }

  function lookupTanfSoa(g6k, a3) {
    const rows =
      typeof TANF_STANDARD_OF_ASSISTANCE_BY_HH !== "undefined"
        ? TANF_STANDARD_OF_ASSISTANCE_BY_HH
        : [];
    const r = rows.find((x) => x.hh === g6k) || rows[0];
    if (!r) return 0;
    return a3 === 2 ? r.group2 : r.group1;
  }

  function lookupTanfMaxGross(g6k, a3) {
    const rows =
      typeof TANF_MAX_GROSS_INCOME_BY_HH !== "undefined" ? TANF_MAX_GROSS_INCOME_BY_HH : [];
    const r = rows.find((x) => x.hh === g6k) || rows[0];
    if (!r) return 0;
    return a3 === 2 ? r.group2 : r.group1;
  }

  function tanfI2Cap(a3) {
    if (a3 === 2) {
      return typeof TANF_VIEW_I2_CAP_GROUP2 === "number" ? TANF_VIEW_I2_CAP_GROUP2 : 0;
    }
    return typeof TANF_VIEW_I2_CAP_GROUP1 === "number" ? TANF_VIEW_I2_CAP_GROUP1 : 0;
  }

  function computeTanfViewRowLT(p) {
    const d6 = tanfParentYesCount(p) - p.tipD61;
    const g6k = tanfG6Key(p);
    const a3 = p.tanfRegionGroupA3 === 2 ? 2 : 1;
    const d2std = lookupTanfStandardDeduction(g6k);
    const monthly150 = lookupTanfMonthly150Fpl(g6k);
    const f2max = lookupTanfMaxGross(g6k, a3);
    const g2soa = lookupTanfSoa(g6k, a3);
    const i2cap = tanfI2Cap(a3);

    const b = d6 > 0 ? Number(p.monthlyEarned) || 0 : 0;
    const c = Number(p.monthlySS) || 0;
    const d = b + c;
    const eYes = d <= f2max;
    const f = Math.max(0, b - d2std);
    const g = f * 0.2;
    const h = f - g;
    const i = c + h;
    const k212 = eYes ? Math.min(Math.max(0, g2soa - i), i2cap) : 0;
    const L = p.tanfSelected ? Math.min(k212 > 9.99 ? k212 : 0, i2cap) : 0;
    const mYes = d < monthly150;
    const O = mYes ? Math.min(g2soa, i2cap) : 0;
    const P = i + O;
    const R = P > monthly150 ? P - monthly150 : 0;
    const S = P > monthly150 ? O - R : O;
    const T = p.tanfViewSelected && mYes && S > 9.99 ? Math.min(S, i2cap) : 0;
    return { L: L, T: T };
  }

  function computeTanf208MaxLT(p, annualIncome) {
    const monthlyFromAnnual = Number(annualIncome) / 12;
    return computeTanfViewRowLT(Object.assign({}, p, { monthlyEarned: monthlyFromAnnual }));
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
   * @param {number} p.elderlyAdultsSnapCount
   * @param {number} p.disabilitySupportIncomeSnap
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
    const hh = clampHh(p.householdSizeSnap);
    const snapG = lookupSnapGrossNet(hh);
    const k2 = lookupSnapMaxAllotment(hh);
    const j2net = snapG.netCountableLessThan;
    const g2gross = snapG.grossLessThan;
    const h2heat = lookupSnapH2HeatingCooling(hh);
    const snapL2Cap = typeof SNAP_SHELTER_CAP_L2 === "number" ? SNAP_SHELTER_CAP_L2 : 712;
    const headerI2 = snapHeaderI2Utility(p);

    const annual208 = p.tanfAnnualForSnapC205 != null ? p.tanfAnnualForSnapC205 : 99500;
    const lt208 = computeTanf208MaxLT(p, annual208);
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
    const e2 = Number(p.disabilitySupportIncomeSnap) || 0;
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

  function getTanfRegionGroupForLocality(locality) {
    const m = typeof TANF_VIEW_A3_BY_LOCALITY !== "undefined" ? TANF_VIEW_A3_BY_LOCALITY : {};
    return m[locality] === 2 ? 2 : 1;
  }

  global.computeSnapV = computeSnapV;
  global.getTanfRegionGroupForLocality = getTanfRegionGroupForLocality;
})(typeof window !== "undefined" ? window : globalThis);
