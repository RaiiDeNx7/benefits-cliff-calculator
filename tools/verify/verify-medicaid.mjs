import { src, readConcat } from "../lib/paths.mjs";

const code = readConcat([src.marketplaceLookup, src.medicaidLookup, src.medicaidCalc]);

const run = new Function(
  code +
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
