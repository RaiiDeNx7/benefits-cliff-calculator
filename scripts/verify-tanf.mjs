import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lookup = readFileSync(join(root, "snapTanfWicLookupData.js"), "utf8");
const tanf = readFileSync(join(root, "tanfView.js"), "utf8");

const p212 = {
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

const p214 = Object.assign({}, p212);

const run = new Function(
  lookup +
    "\n" +
    tanf +
    "\nreturn {\n" +
    "  max212: computeTanfMaxLT(" +
    JSON.stringify(p212) +
    "),\n" +
    "  max214: computeTanfMaxLT(" +
    JSON.stringify(p214) +
    "),\n" +
    "  t212: computeTanfViewTOnly(" +
    JSON.stringify(p212) +
    "),\n" +
    "  t214: computeTanfViewTOnly(" +
    JSON.stringify(p214) +
    "),\n" +
    "};"
);

const r = run();
const ok =
  Math.abs(r.max212 - 489.8) < 0.01 &&
  Math.abs(r.max214 - 489.8) < 0.01 &&
  r.t212 === 0 &&
  r.t214 === 0;

console.log(r, ok ? "OK" : "FAIL");
if (!ok) process.exit(1);
