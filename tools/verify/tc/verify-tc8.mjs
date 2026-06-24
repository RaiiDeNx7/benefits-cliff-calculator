/**
 * Regression: Test Case 8 / Household 13 (Pittsylvania).
 * Workbook expected: HCV 1012 (non-parent SS D86 must not flow into HCV column D).
 */
import { src, readConcat } from "../../lib/paths.mjs";

const hcvCode = readConcat([src.hcvLookup, src.hcvCalc]);

const hcvParams = {
  hcvSelected: true,
  locality: "Pittsylvania",
  householdSize: 5,
  numDependents: 1,
  adultAges: [35, 34, 66, 70],
  monthlyEarned: 1200,
  monthlySocialSecurity: 0,
  tanfL: 0,
  tanfT: 0,
  monthlySsi: 0,
  bedrooms: 3,
};

const run = new Function(
  hcvCode +
    "\nreturn {\n" +
    "  hcvD80: computeHcvProgramMonthlyQ(" +
    JSON.stringify(hcvParams) +
    "),\n" +
    "  hcvWithD86: computeHcvProgramMonthlyQ(" +
    JSON.stringify(Object.assign({}, hcvParams, { monthlySocialSecurity: 1000 })) +
    "),\n" +
    "};"
);

const r = run();
const ok =
  Math.abs(r.hcvD80 - 1012) < 0.01 &&
  Math.abs(r.hcvWithD86 - 712) < 0.01;

console.log("TC8 (Household 13)", r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
