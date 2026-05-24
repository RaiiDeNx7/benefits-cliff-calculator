import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mp = readFileSync(join(root, "marketplaceLookupData.js"), "utf8");
const mdData = readFileSync(join(root, "medicaidLookupData.js"), "utf8");
const md = readFileSync(join(root, "medicaid.js"), "utf8");

const run = new Function(
  mp +
    "\n" +
    mdData +
    "\n" +
    md +
    "\nreturn {\n" +
    "  n212: computeMedicaidMonthlyN({ medicaidSelected: true, householdSize: 7, numAdults: 4, numChildren: 3, monthlyEarned: 500 }),\n" +
    "  n214: computeMedicaidMonthlyN({ medicaidSelected: true, householdSize: 7, numAdults: 4, numChildren: 3, monthlyEarned: 1000 }),\n" +
    "  highEarn: computeMedicaidMonthlyN({ medicaidSelected: true, householdSize: 1, numAdults: 1, numChildren: 0, monthlyEarned: 10000 })\n" +
    "};"
);
const r = run();
const ok =
  r.n212 === 3024.5 &&
  r.n214 === 3024.5 &&
  r.highEarn === 0;
console.log(r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
