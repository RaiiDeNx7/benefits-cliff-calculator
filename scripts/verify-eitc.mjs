/**
 * Regression: EITC!E208 and E210 match workbook sample (MFJ, 3 children, monthly 500 / 1000).
 * E208/12 = 258.75, E210/12 = 517.50
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import vm from "vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const ctx = {};
for (const f of ["eitcLookupData.js", "eitc.js"]) {
  vm.runInNewContext(readFileSync(join(root, f), "utf8"), ctx, { filename: f });
}

const base = {
  numChildren: 3,
  filingMarriedJointly: true,
  eitcEnabled: true,
};

const E208 = ctx.computeEitcAnnualE208(Object.assign({}, base, { monthlyEarned: 500 }));
const E210 = ctx.computeEitcAnnualE208(Object.assign({}, base, { monthlyEarned: 1000 }));
const m208 = ctx.computeEitcMonthlyFromMonthlyEarned(Object.assign({}, base, { monthlyEarned: 500 }));
const m210 = ctx.computeEitcMonthlyFromMonthlyEarned(Object.assign({}, base, { monthlyEarned: 1000 }));

const okE208 = E208 === 3105 && Math.abs(m208 - 3105 / 12) < 1e-9;
const okE210 = E210 === 6210 && Math.abs(m210 - 6210 / 12) < 1e-9;

console.log("E208 annual", E208, okE208 ? "OK" : "FAIL");
console.log("E208/12", m208, okE208 ? "" : "FAIL");
console.log("E210 annual", E210, okE210 ? "OK" : "FAIL");
console.log("E210/12", m210, okE210 ? "" : "FAIL");

if (!okE208 || !okE210) process.exit(1);
