/**
 * Regression: Test Case 7 / Household 11b (Pittsylvania per workbook B3).
 * Workbook expected: TANF 355.40, SNAP 1224, HCV 1217.38, child care 2675.
 * AU: parentYes=2, tipD61=0, tipD66=1 (one disabled child), child SSI $200.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function load(names) {
  return names.map((f) => readFileSync(join(root, f), "utf8")).join("\n");
}

const tanfCode = load(["snapTanfWicLookupData.js", "tanfView.js"]);
const snapCode = readFileSync(join(root, "snap.js"), "utf8");
const hcvCode =
  readFileSync(join(root, "hcvLookupData.js"), "utf8") +
  "\n" +
  readFileSync(join(root, "hcv.js"), "utf8");
const ccCode = load(["childCareLookupData.js", "childCareSubsidy.js"]);

const tanfParams = {
  monthlyEarned: 500,
  monthlySS: 0,
  tanfParentYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 1,
  tipB31Children: 3,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
};

const snapParams = {
  snapSelected: true,
  householdSizeSnap: 7,
  monthlyEarnedSnapD: 500,
  monthlyEarnedTanfB: 500,
  monthlySS: 0,
  countableUnearnedOther: 500,
  shelterMonthly: 500,
  utilityMethod: "actual",
  utilityMonthly: 0,
  elderlyAdultsSnapCount: 2,
  disabilitySupportIncomeSnap: 200,
  tanfAnnualForSnapC205: 99500,
  tanfParentYesCount: 2,
  tanfCaretakerDisabledYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 1,
  tipB31Children: 3,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
};

const hcvParams = {
  hcvSelected: true,
  locality: "Pittsylvania",
  householdSize: 7,
  numDependents: 3,
  adultAges: [34, 28, 67, 70],
  monthlyEarned: 500,
  tanfL: 355.4,
  tanfT: 0,
  monthlySocialSecurity: 0,
  monthlySsi: 200,
  bedrooms: 4,
  shelterMonthly: 500,
  utilityMonthly: 0,
  snapUtilityAllowanceMonthly: 476,
};

const ccParams = {
  childCareSelected: true,
  locality: "Pittsylvania",
  householdSize: 7,
  counts: { infant: 1, toddler: 0, two: 1, preschool: 0, school: 1, teenIncapable: 0 },
  monthlyEarned: 500,
  monthlySocialSecurity: 0,
  tanfPathL: 355.4,
  tanfPathT: 0,
};

const run = new Function(
  tanfCode +
    "\n" +
    snapCode +
    "\n" +
    hcvCode +
    "\n" +
    ccCode +
    "\nreturn {\n" +
    "  tanf: computeTanfMaxLT(" +
    JSON.stringify(tanfParams) +
    "),\n" +
    "  snap: computeSnapV(" +
    JSON.stringify(snapParams) +
    "),\n" +
    "  hcv: computeHcvProgramMonthlyQ(" +
    JSON.stringify(hcvParams) +
    "),\n" +
    "  childCare: computeChildCareSubsidyMonthly(" +
    JSON.stringify(ccParams) +
    "),\n" +
    "};"
);

const r = run();
const ok =
  Math.abs(r.tanf - 355.4) < 0.01 &&
  r.snap === 1224 &&
  Math.abs(r.hcv - 1217.38) < 0.01 &&
  r.childCare === 2675;

console.log("TC7 (Household 11b)", r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
