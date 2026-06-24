import { src, readConcat } from "../lib/paths.mjs";

const code = readConcat([src.marketplaceLookup, src.marketplaceCalc]);
const run = new Function(
  code +
    "\nreturn { l500: computeMarketplaceSubsidyMonthlyL({marketplaceSelected:true,locality:'Prince Edward',householdSize:7,monthlyEarned:500,adultAges:[34,28,67,70,0,0,0,0]}), l6000: computeMarketplaceSubsidyMonthlyL({marketplaceSelected:true,locality:'Prince Edward',householdSize:7,monthlyEarned:6000,adultAges:[34,28,67,70,0,0,0,0]}) };"
);
const r = run();
const ok = r.l500 === 0 && r.l6000 === 889;
console.log(r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
