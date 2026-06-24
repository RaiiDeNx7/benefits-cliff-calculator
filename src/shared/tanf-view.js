/**
 * TANF-View is not currently used on site. Leave this here for now.
 * @requires src/programs/tanf/lookup-data.js
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

  function lookupTanfStandardDeduction(g6k) {
    const rows =
      typeof TANF_STANDARD_DEDUCTION_BY_SIZE !== "undefined"
        ? TANF_STANDARD_DEDUCTION_BY_SIZE
        : [];
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
    const r = rows.find(function (x) {
      return x.hh === g6k;
    });
    const row = r || rows[0];
    if (!row) return 0;
    return a3 === 2 ? row.group2 : row.group1;
  }

  function lookupTanfMaxGross(g6k, a3) {
    const rows =
      typeof TANF_MAX_GROSS_INCOME_BY_HH !== "undefined" ? TANF_MAX_GROSS_INCOME_BY_HH : [];
    const r = rows.find(function (x) {
      return x.hh === g6k;
    });
    const row = r || rows[0];
    if (!row) return 0;
    return a3 === 2 ? row.group2 : row.group1;
  }

  function tanfI2Cap(a3) {
    if (a3 === 2) {
      return typeof TANF_VIEW_I2_CAP_GROUP2 === "number" ? TANF_VIEW_I2_CAP_GROUP2 : 0;
    }
    return typeof TANF_VIEW_I2_CAP_GROUP1 === "number" ? TANF_VIEW_I2_CAP_GROUP1 : 0;
  }

  /**
   * @param {object} p
   * @param {number} p.monthlyEarned — TANF B212/B214 path (0 if D6≤0)
   * @param {number} p.monthlySS
   * @param {number} [p.tanfParentYesCount]
   * @param {number} [p.tanfCaretakerDisabledYesCount]
   * @param {number} p.tipD61
   * @param {number} p.tipD66ChildrenNotInTanfAu
   * @param {number} p.tipB31Children
   * @param {number} p.tanfRegionGroupA3
   * @param {boolean} p.tanfSelected
   * @param {boolean} p.tanfViewSelected
   * @returns {{ L: number, T: number }}
   */
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
    const kRaw = eYes ? Math.min(Math.max(0, g2soa - i), i2cap) : 0;
    const k = kRaw > 9.99 ? kRaw : 0;
    const L = p.tanfSelected ? Math.min(k, i2cap) : 0;
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

  function getTanfRegionGroupForLocality(locality) {
    const m =
      typeof TANF_VIEW_A3_BY_LOCALITY !== "undefined" ? TANF_VIEW_A3_BY_LOCALITY : {};
    const v = m[locality];
    return v === 2 ? 2 : 1;
  }

  global.computeTanfViewRowLT = computeTanfViewRowLT;
  global.computeTanf208MaxLT = computeTanf208MaxLT;
  global.getTanfRegionGroupForLocality = getTanfRegionGroupForLocality;
})(typeof window !== "undefined" ? window : globalThis);
