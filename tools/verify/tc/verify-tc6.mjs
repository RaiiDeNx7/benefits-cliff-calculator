/**
 * Regression: Test Case 6 / Household 11a (Pittsylvania).
 * Workbook expected: TANF 354, SNAP 994, HCV 1097.10, child care 2041.55.
 */
import { src, readConcat } from "../../lib/paths.mjs";

const code = readConcat([
  src.tanfLookup,
  src.tanfView,
  src.tanfCalc,
  src.snapLookup,
  src.snapCalc,
  src.hcvLookup,
  src.hcvCalc,
  src.childCareLookup,
  src.childCareCalc,
]);

const tanfParams = {
  monthlyEarned: 369,
  monthlySS: 0,
  tanfParentYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 1,
  tipB31Children: 2,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
};

const snapParams = {
  snapSelected: true,
  householdSizeSnap: 4,
  monthlyEarnedSnapD: 369,
  monthlyEarnedTanfB: 369,
  monthlySS: 0,
  countableUnearnedOther: 0,
  shelterMonthly: 500,
  utilityMethod: "actual",
  utilityMonthly: 500,
  elderlyAdultsSnapCount: 0,
  snapDisabilityMemberCount: 1,
  disabilitySupportIncomeSnap: 200,
  tanfAnnualForSnapC205: 99500,
  tanfParentYesCount: 2,
  tanfCaretakerDisabledYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 1,
  tipB31Children: 2,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
};

const hcvParams = {
  hcvSelected: true,
  locality: "Pittsylvania",
  householdSize: 4,
  numDependents: 2,
  adultAges: [29, 28, 0, 0, 0, 0, 0, 0],
  monthlyEarned: 369,
  tanfL: 354,
  tanfT: 0,
  monthlySocialSecurity: 0,
  monthlySsi: 200,
  bedrooms: 3,
  shelterMonthly: 500,
  utilityMonthly: 500,
  snapUtilityAllowanceMonthly: 476,
};

const ccParams = {
  childCareSelected: true,
  locality: "Pittsylvania",
  householdSize: 4,
  counts: { infant: 1, toddler: 0, two: 0, preschool: 1, school: 0, teenIncapable: 0 },
  monthlyEarned: 369,
  monthlySocialSecurity: 0,
  tanfPathL: 354,
  tanfPathT: 0,
};

const run = new Function(
  code +
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
  Math.abs(r.tanf - 354) < 0.01 &&
  r.snap === 994 &&
  Math.abs(r.hcv - 1097.1) < 0.01 &&
  Math.abs(r.childCare - 2041.55) < 0.01;

console.log("TC6 (Household 11a)", r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
