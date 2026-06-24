/**
 * TANF-VIEW MAX(L,T) output and VIEW-only T column.
 * @requires src/programs/tanf/lookup-data.js, src/shared/tanf-view.js
 */
(function (global) {
  "use strict";

  function computeTanfMaxLT(p) {
    if (typeof computeTanfViewRowLT !== "function") return 0;
    const row = computeTanfViewRowLT(p);
    return Math.max(row.L, row.T);
  }

  function computeTanfViewTOnly(p) {
    if (typeof computeTanfViewRowLT !== "function") return 0;
    return computeTanfViewRowLT(p).T;
  }

  global.computeTanfMaxLT = computeTanfMaxLT;
  global.computeTanfViewTOnly = computeTanfViewTOnly;
})(typeof window !== "undefined" ? window : globalThis);
