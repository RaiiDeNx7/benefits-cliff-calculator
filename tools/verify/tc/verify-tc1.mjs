/**
 * Regression: Test Case 1 / Household 1 (Albemarle).
 * Workbook expected: SNAP current 785, SNAP new 508.
 */
import { src, readConcat } from "../../lib/paths.mjs";

const code = readConcat([src.tanfLookup, src.tanfView, src.snapLookup, src.snapCalc]);

const snapParams = {
  snapSelected: true,
  householdSizeSnap: 3,
  monthlyEarnedTanfB: 500,
  monthlySS: 0,
  countableUnearnedOther: 0,
  shelterMonthly: 1200,
  utilityMethod: "sua",
  utilityMonthly: 0,
  elderlyAdultsSnapCount: 0,
  snapDisabilityMemberCount: 1,
  disabilitySupportIncomeSnap: 0,
  tanfAnnualForSnapC205: 99500,
  tanfParentYesCount: 1,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 0,
  tipB31Children: 2,
  tanfRegionGroupA3: 1,
  tanfSelected: true,
  tanfViewSelected: false,
};

const run = new Function(
  code +
    "\nreturn {\n" +
    "  cur: computeSnapV(" +
    JSON.stringify(Object.assign({}, snapParams, { monthlyEarnedSnapD: 500 })) +
    "),\n" +
    "  neu: computeSnapV(" +
    JSON.stringify(Object.assign({}, snapParams, { monthlyEarnedSnapD: 1900 })) +
    "),\n" +
    "};"
);

const r = run();
const ok = r.cur === 785 && r.neu === 508;

console.log("TC1 (Household 1)", r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
