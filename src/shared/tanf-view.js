/**
 * TANF-VIEW core math (shared hub).
 *
 * Temporary Assistance for Needy Families (TANF) is Virginia’s cash-assistance
 * program. This module computes two workbook columns for a given earned-income
 * scenario:
 *
 *   L — TANF grant when the household selected the standard TANF path
 *   T — TANF-VIEW grant (alternate 150% FPL path used for cliffs / linkage)
 *
 * Both paths share the same assistance-unit size (G6), regional group (A3),
 * standard deduction, max gross, and Standard of Assistance (SOA). Other
 * programs (SNAP, HCV, child care, WIC) call this to treat TANF as unearned
 * income or as an eligibility gate.
 *
 * Excel: TANF-VIEW sheet rows 212 / 214 (and the C205 annual-income probe).
 * Lookups live in src/programs/tanf/lookup-data.js.
 *
 * @requires src/programs/tanf/lookup-data.js
 */
(function (global) {
  "use strict";

  /** Household / AU size used in lookups is capped at 1–8 (workbook tables). */
  function clampHh(n) {
    const x = Math.round(Number(n) || 0);
    return Math.min(8, Math.max(1, x));
  }

  /**
   * Count of adults who are parents of the children (TANF-VIEW caretaker count).
   * Prefers tanfParentYesCount; falls back to the older caretaker-disabled field.
   */
  function tanfParentYesCount(p) {
    return p.tanfParentYesCount != null
      ? p.tanfParentYesCount
      : p.tanfCaretakerDisabledYesCount;
  }

  /**
   * G6 — assistance-unit size for lookups:
   *   (parentYesCount − tipD61) + (children − childrenNotInTanfAu)
   * tipD61 / tipD66 exclude certain non-parent adults and disabled children
   * from the AU, matching the Total income package sheet.
   */
  function tanfG6Key(p) {
    const d6 = tanfParentYesCount(p) - p.tipD61;
    return clampHh(d6 + (p.tipB31Children - p.tipD66ChildrenNotInTanfAu));
  }

  /** Standard earned-income deduction by AU size (Program table). */
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

  /** Monthly 150% FPL threshold by AU size (gates the VIEW / T path). */
  function lookupTanfMonthly150Fpl(g6k) {
    const rows =
      typeof TANF_MONTHLY_150_FPL_BY_HH !== "undefined" ? TANF_MONTHLY_150_FPL_BY_HH : [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].hh === g6k) return rows[i].monthly150;
    }
    return rows.length ? rows[rows.length - 1].monthly150 : 0;
  }

  /**
   * Standard of Assistance (SOA) — max monthly need amount for the AU.
   * a3 is locality region group 1 or 2 (Location → TANF A3).
   */
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

  /** Maximum countable gross income for standard TANF eligibility (by AU + region). */
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

  /** I2 payment cap by region group (grant cannot exceed this). */
  function tanfI2Cap(a3) {
    if (a3 === 2) {
      return typeof TANF_VIEW_I2_CAP_GROUP2 === "number" ? TANF_VIEW_I2_CAP_GROUP2 : 0;
    }
    return typeof TANF_VIEW_I2_CAP_GROUP1 === "number" ? TANF_VIEW_I2_CAP_GROUP1 : 0;
  }

  /**
   * Compute TANF-VIEW L and T for one earned-income scenario.
   *
   * Letter variables mirror Excel column letters on the TANF-VIEW row:
   *
   *   B  earned (0 if no parent-yes adults remain after D61)
   *   C  parent Social Security (TIP D80)
   *   D  gross = B + C
   *   E  passes max-gross test (D ≤ F2)
   *   F  earned after standard deduction
   *   G  20% earned disregard on F
   *   H  countable earned = F − G
   *   I  countable income = C + H
   *   K  standard TANF grant = min(SOA − I, I2) if E, else 0; zero if ≤ $9.99
   *   L  K if TANF checkbox selected, else 0
   *
   * VIEW path (150% FPL):
   *   M  gross under 150% FPL?
   *   O  full SOA (capped) if M
   *   P  countable income + O
   *   R/S  clawback when P exceeds 150% FPL
   *   T  S if VIEW selected and S > $9.99, else 0
   *
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
    // D6 = parent caretakers remaining after excluding tipD61 non-parent adults.
    const d6 = tanfParentYesCount(p) - p.tipD61;
    const g6k = tanfG6Key(p);
    const a3 = p.tanfRegionGroupA3 === 2 ? 2 : 1;
    const d2std = lookupTanfStandardDeduction(g6k);
    const monthly150 = lookupTanfMonthly150Fpl(g6k);
    const f2max = lookupTanfMaxGross(g6k, a3);
    const g2soa = lookupTanfSoa(g6k, a3);
    const i2cap = tanfI2Cap(a3);

    // --- Income and standard TANF (L) path ---
    const b = d6 > 0 ? Number(p.monthlyEarned) || 0 : 0;
    const c = Number(p.monthlySS) || 0;
    const d = b + c;
    const eYes = d <= f2max;
    const f = Math.max(0, b - d2std); // earned after standard deduction
    const g = f * 0.2; // 20% earned disregard
    const h = f - g; // countable earned
    const i = c + h; // countable income (SS + countable earned)
    // Grant fills gap between SOA and countable income, capped at I2.
    const kRaw = eYes ? Math.min(Math.max(0, g2soa - i), i2cap) : 0;
    const k = kRaw > 9.99 ? kRaw : 0; // workbook: tiny grants treated as $0
    const L = p.tanfSelected ? Math.min(k, i2cap) : 0;

    // --- TANF-VIEW (T) path: 150% FPL / SOA clawback ---
    const mYes = d < monthly150;
    const O = mYes ? Math.min(g2soa, i2cap) : 0;
    const P = i + O;
    const R = P > monthly150 ? P - monthly150 : 0;
    const S = P > monthly150 ? O - R : O;
    const T = p.tanfViewSelected && mYes && S > 9.99 ? Math.min(S, i2cap) : 0;
    return { L: L, T: T };
  }

  /**
   * Same as computeTanfViewRowLT but earned income is annualIncome / 12.
   * Used by SNAP’s C205 min-allotment probe (workbook uses a fixed annual figure).
   */
  function computeTanf208MaxLT(p, annualIncome) {
    const monthlyFromAnnual = Number(annualIncome) / 12;
    return computeTanfViewRowLT(Object.assign({}, p, { monthlyEarned: monthlyFromAnnual }));
  }

  /** Locality → TANF region group A3 (1 or 2) from TANF_VIEW_A3_BY_LOCALITY. */
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
