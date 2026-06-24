/**
 * Regression check — child care subsidy S208 = 2675, S210 = 2655 (Prince Edward sample).
 */
import { src, loadIntoContext } from "../lib/paths.mjs";

const ctx = loadIntoContext([src.childCareLookup, src.childCareCalc]);

const counts = { infant: 1, toddler: 0, two: 1, preschool: 0, school: 1, teenIncapable: 0 };
const base = {
  childCareSelected: true,
  locality: "Prince Edward",
  householdSize: 7,
  counts: counts,
  monthlySocialSecurity: 0,
  tanfPathL: 489.8,
  tanfPathT: 0,
};

const s208 = ctx.computeChildCareSubsidyMonthly(
  Object.assign({}, base, { monthlyEarned: 500 })
);
const s210 = ctx.computeChildCareSubsidyMonthly(
  Object.assign({}, base, { monthlyEarned: 1000 })
);

const ok208 = s208 === 2675;
const ok210 = s210 === 2655;
console.log("S208", s208, ok208 ? "OK" : "FAIL (expected 2675)");
console.log("S210", s210, ok210 ? "OK" : "FAIL (expected 2655)");
if (!ok208 || !ok210) process.exit(1);
