import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const d = readFileSync(join(root, "hcvLookupData.js"), "utf8");
const s = readFileSync(join(root, "hcv.js"), "utf8");
const code = d + "\n" + s + "\n";

const base = {
  hcvSelected: true,
  locality: "Prince Edward",
  householdSize: 7,
  numDependents: 3,
  adultAges: [34, 28, 67, 70],
  tanfL: 489.8,
  tanfT: 0,
  monthlySocialSecurity: 0,
  bedrooms: 4,
};

const fn1 = new Function(
  code +
    "return { q209: computeHcvProgramMonthlyQ(" +
    JSON.stringify(Object.assign({}, base, { monthlyEarned: 500 })) +
    "), q211: computeHcvProgramMonthlyQ(" +
    JSON.stringify(Object.assign({}, base, { monthlyEarned: 1000 })) +
    ") };"
);
const r1 = fn1();
const ok209 = Math.abs(r1.q209 - 1284.059) < 0.01;
const ok211 = Math.abs(r1.q211 - 1134.059) < 0.01;
console.log("workbook P-N only (no shelter)", r1, ok209 && ok211 ? "OK" : "FAIL");
if (!ok209 || !ok211) process.exit(1);

const pHud = Object.assign({}, base, {
  tanfL: 0,
  tanfT: 0,
  shelterMonthly: 500,
  utilityMonthly: 0,
  snapUtilityAllowanceMonthly: 476,
});
const fn2 = new Function(
  code +
    "return { q209: computeHcvProgramMonthlyQ(" +
    JSON.stringify(Object.assign({}, pHud, { monthlyEarned: 800 })) +
    "), q211: computeHcvProgramMonthlyQ(" +
    JSON.stringify(Object.assign({}, pHud, { monthlyEarned: 1600 })) +
    ") };"
);
const r2 = fn2();
const okHud209 = Math.abs(r2.q209 - 1266.06) < 0.01;
const okHud211 = Math.abs(r2.q211 - 1026.06) < 0.01;
console.log("shelter 500 + SNAP UA gross-rent cap", r2, okHud209 && okHud211 ? "OK" : "FAIL");
if (!okHud209 || !okHud211) process.exit(1);
