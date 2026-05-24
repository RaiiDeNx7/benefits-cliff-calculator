import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lookup = readFileSync(join(root, "snapTanfWicLookupData.js"), "utf8");
const tanf = readFileSync(join(root, "tanfView.js"), "utf8");
const wic = readFileSync(join(root, "wic.js"), "utf8");

const tanfParams = {
  monthlyEarned: 500,
  monthlySS: 0,
  tanfParentYesCount: 2,
  tipD61: 0,
  tipD66ChildrenNotInTanfAu: 0,
  tipB31Children: 3,
  tanfRegionGroupA3: 2,
  tanfSelected: true,
  tanfViewSelected: false,
};

const run = new Function(
  lookup +
    "\n" +
    tanf +
    "\n" +
    wic +
    "\nconst tanfParams = " +
    JSON.stringify(tanfParams) +
    ";\n" +
    "const tanfMax = computeTanfMaxLT(tanfParams);\n" +
    "return {\n" +
    "  tanfMax,\n" +
    "  wic211: computeWicMonthlyF({ wicSelected: true, householdSizeWic: 7, monthlyEarnedWicB: 500, wicUnearnedH2: 0, tanfMaxLTForWicD: tanfMax, wicEligiblePersonCount: 2 }),\n" +
    "  wic213: computeWicMonthlyF({ wicSelected: true, householdSizeWic: 7, monthlyEarnedWicB: 1000, wicUnearnedH2: 0, tanfMaxLTForWicD: tanfMax, wicEligiblePersonCount: 2 }),\n" +
    "};"
);

const r = run();
const ok =
  Math.abs(r.tanfMax - 489.8) < 0.01 &&
  Math.abs(r.wic211 - 73.52) < 0.005 &&
  Math.abs(r.wic213 - 73.52) < 0.005;

console.log(r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
