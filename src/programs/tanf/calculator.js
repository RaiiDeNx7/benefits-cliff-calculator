/**
 * TANF program UI wrappers over the shared TANF-VIEW math.
 *
 * The displayed TANF amount is MAX(L, T) — the larger of the standard TANF
 * grant (L) and the TANF-VIEW grant (T) from src/shared/tanf-view.js.
 *
 * Note (workbook quirk): both Current and New scenario rows use the *current*
 * packaged earned income (Total income package B90), not the new amount (B91).
 * app.js mirrors that when calling these helpers.
 *
 * @requires src/programs/tanf/lookup-data.js, src/shared/tanf-view.js
 */
(function (global) {
  "use strict";

  /** Monthly TANF benefit shown in the UI: max of standard (L) and VIEW (T). */
  function computeTanfMaxLT(p) {
    if (typeof computeTanfViewRowLT !== "function") return 0;
    const row = computeTanfViewRowLT(p);
    return Math.max(row.L, row.T);
  }

  /** VIEW-only T column (rarely needed; most callers use MAX(L,T)). */
  function computeTanfViewTOnly(p) {
    if (typeof computeTanfViewRowLT !== "function") return 0;
    return computeTanfViewRowLT(p).T;
  }

  global.computeTanfMaxLT = computeTanfMaxLT;
  global.computeTanfViewTOnly = computeTanfViewTOnly;
})(typeof window !== "undefined" ? window : globalThis);
