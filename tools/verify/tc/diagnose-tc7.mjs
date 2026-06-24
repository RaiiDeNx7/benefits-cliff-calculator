/**
 * Household 11b (TC7) — print TANF AU key and benefit outputs for workbook comparison.
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
};

const run = new Function(
  code +
    "\n" +
    "function g6k(p) {\n" +
    "  const d6 = p.tanfParentYesCount - p.tipD61;\n" +
    "  return Math.min(8, Math.max(1, Math.round(d6 + (p.tipB31Children - p.tipD66ChildrenNotInTanfAu))));\n" +
    "}\n" +
    "return {\n" +
    "  au: { parentYes: 2, tipD61: 0, tipD66: 1, g6k: g6k(" +
    JSON.stringify(tanfParams) +
    ") },\n" +
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
    JSON.stringify({
      childCareSelected: true,
      locality: "Pittsylvania",
      householdSize: 7,
      counts: { infant: 1, toddler: 0, two: 1, preschool: 0, school: 1, teenIncapable: 0 },
      monthlyEarned: 500,
      monthlySocialSecurity: 0,
      tanfPathL: 355.4,
      tanfPathT: 0,
    }) +
    "),\n" +
    "  expected: { tanf: 355.4, snap: 1224, hcv: 1217.38, childCare: 2675 },\n" +
    "};"
);

const r = run();
console.log("TC7 diagnose (Household 11b)", r);
