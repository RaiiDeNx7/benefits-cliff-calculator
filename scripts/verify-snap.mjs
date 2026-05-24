import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const d = readFileSync(join(root, "snapTanfWicLookupData.js"), "utf8");
const j = readFileSync(join(root, "snap.js"), "utf8");

const p209 = {
  snapSelected: true,
  householdSizeSnap: 7,
  monthlyEarnedSnapD: 500,
  monthlySS: 0,
  countableUnearnedOther: 500,
  shelterMonthly: 500,
  utilityMethod: "actual",
  utilityMonthly: 0,
  elderlyAdultsSnapCount: 2,
  disabilitySupportIncomeSnap: 0,
  tanfAnnualForSnapC205: 99500,
  tanfParentYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 0,
  tipB31Children: 3,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
  monthlyEarnedTanfB: 500,
};

const p211 = Object.assign({}, p209, {
  monthlyEarnedSnapD: 1000,
  monthlyEarnedTanfB: 500,
});

const run = new Function(
  d +
    "\n" +
    j +
    "\nconst p209 = " +
    JSON.stringify(p209) +
    ";\n" +
    "const p211 = " +
    JSON.stringify(p211) +
    ";\n" +
    "return { v209: computeSnapV(p209), v211: computeSnapV(p211) };"
);

const r = run();

const princeEdwardBase = {
  snapSelected: true,
  householdSizeSnap: 7,
  monthlyEarnedTanfB: 800,
  tanfMonthlySS: 0,
  snapUnearnedD86: 500,
  shelterMonthly: 500,
  utilityMethod: "actual",
  elderlyAdultsSnapCount: 2,
  snapDisabilityCountE2: 0,
  snapSupportIncomeF209: 0,
  tanfAnnualForSnapC205: 99500,
  tanfParentYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 0,
  tipB31Children: 3,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
};

const runPe = new Function(
  d +
    "\n" +
    j +
    "\nconst base = " +
    JSON.stringify(princeEdwardBase) +
    ";\n" +
    "return {\n" +
    "  cur: computeSnapV(Object.assign({}, base, { monthlyEarnedSnapD: 800, utilityMonthly: 0 })),\n" +
    "  neu: computeSnapV(Object.assign({}, base, { monthlyEarnedSnapD: 1600, utilityMonthly: 100 })),\n" +
    "};"
);
const pe = runPe();

const ok =
  r.v209 === 1243 &&
  r.v211 === 1123 &&
  pe.cur === 1243 &&
  pe.neu === 1051;
console.log({ template: r, princeEdward: pe }, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
