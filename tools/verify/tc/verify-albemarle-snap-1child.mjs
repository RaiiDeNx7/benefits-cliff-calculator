/**
 * Albemarle SNAP New: 1 adult + 1 toddler, Current $500 / New $1900, shelter $1200, SUA.
 *
 * Site (correct AU: tipB31Children=1) → SNAP New 289, embedded TANF L 256.20.
 * Sheet value 260 matches the same SNAP HH=2 path only when tipB31Children=2
 * (TANF AU sized as 3 → L 354.20). That is a workbook AU / child-count mismatch,
 * not a site allotment bug — do not change computeSnapV to force 260 for 1 child.
 */
import { src, readConcat } from "../../lib/paths.mjs";

const code = readConcat([src.tanfLookup, src.tanfView, src.snapLookup, src.snapCalc]);

const base = {
  snapSelected: true,
  householdSizeSnap: 2,
  monthlyEarnedSnapD: 1900,
  monthlyEarnedTanfB: 500,
  monthlySS: 0,
  countableUnearnedOther: 0,
  shelterMonthly: 1200,
  utilityMethod: "sua",
  utilityMonthly: 0,
  elderlyAdultsSnapCount: 0,
  snapDisabilityMemberCount: 0,
  disabilitySupportIncomeSnap: 0,
  tanfAnnualForSnapC205: 99500,
  tanfParentYesCount: 1,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 0,
  tipB31Children: 1,
  tanfRegionGroupA3: 1,
  tanfSelected: true,
  tanfViewSelected: false,
};

const run = new Function(
  code +
    "\nconst base = " +
    JSON.stringify(base) +
    ";\n" +
    "const site = Object.assign({}, base, { tipB31Children: 1 });\n" +
    "const sheetLike = Object.assign({}, base, { tipB31Children: 2 });\n" +
    "const tanfSite = computeTanfViewRowLT(Object.assign({}, site, { monthlyEarned: site.monthlyEarnedTanfB }));\n" +
    "const tanfSheet = computeTanfViewRowLT(Object.assign({}, sheetLike, { monthlyEarned: sheetLike.monthlyEarnedTanfB }));\n" +
    "return {\n" +
    "  siteNew: computeSnapV(site),\n" +
    "  sheetLikeNew: computeSnapV(sheetLike),\n" +
    "  tanfLSite: tanfSite.L,\n" +
    "  tanfLSheetLike: tanfSheet.L,\n" +
    "};\n"
);

const r = run();
const ok =
  r.siteNew === 289 &&
  Math.abs(r.tanfLSite - 256.2) < 0.01 &&
  r.sheetLikeNew === 260 &&
  Math.abs(r.tanfLSheetLike - 354.2) < 0.01;

console.log("Albemarle 1-child SNAP New", r, ok ? "OK" : "FAIL");
console.log(
  "Conclusion: site 289 is correct for 1 toddler; sheet 260 implies TANF AU with 2 children (L≈354.20)."
);
if (!ok) process.exit(1);
