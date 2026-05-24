/**
 * Regression check vs workbook "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
 * Child care subsidy S208 = 2675, S210 = 2655 (Prince Edward sample).
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import vm from "vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const ctx = {};
for (const f of ["childCareLookupData.js", "childCareSubsidy.js"]) {
  vm.runInNewContext(readFileSync(join(root, f), "utf8"), ctx, { filename: f });
}

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
