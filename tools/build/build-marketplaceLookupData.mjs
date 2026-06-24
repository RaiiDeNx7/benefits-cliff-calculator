/**
 * Builds marketplaceLookupData.js from the FY2026 workbook:
 * - Program specific data A6:D13: monthly FPL for marketplace K2
 * - Program specific data A5:N13: Medicaid H (col 7), J (col 6), L (col 13) for O220
 * - SLCSP premiums: adult premiums by locality and age (rows 4–137, HLOOKUP col index in row 3)
 *
 * Run: node scripts/build-marketplaceLookupData.mjs
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

function excelColLetter(n1) {
  let n = n1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const wb = XLSX.readFile(wbPath);
const prog = wb.Sheets["Program specific data"];
const slcsp = wb.Sheets["SLCSP premiums"];

const fplRows = [];
for (let excelRow = 6; excelRow <= 13; excelRow++) {
  const a = prog["A" + excelRow];
  const d = prog["D" + excelRow];
  if (!a || a.v == null) continue;
  const sz = Number(a.v);
  if (sz < 1) continue;
  fplRows.push({
    householdSize: sz,
    monthlyFpl: Number(prog["C" + excelRow].v),
  });
}

const medicaidRows = [];
for (let excelRow = 5; excelRow <= 13; excelRow++) {
  const a = prog["A" + excelRow];
  if (!a || typeof a.v !== "number") continue;
  const sz = Number(a.v);
  if (sz < 1) continue;
  medicaidRows.push({
    householdSize: sz,
    jLimitMedicaid: Number(prog["F" + excelRow].v),
    hDisregard: Number(prog["G" + excelRow].v),
    lLimitMedicaid: Number(prog["M" + excelRow].v),
  });
}

const sh = slcsp;
const agesRow = 2;
const colIdxRow = 3;
const dataStartRow = 4;
const dataEndRow = 137;

const slcspByLocality = {};
const ref = sh["!ref"];
const rng = XLSX.utils.decode_range(ref);
const maxC = Math.min(rng.e.c, XLSX.utils.decode_col("AV"));

for (let R = dataStartRow - 1; R <= dataEndRow - 1 && R <= rng.e.r; R++) {
  const nameCell = sh[XLSX.utils.encode_cell({ r: R, c: 0 })];
  if (!nameCell || typeof nameCell.v !== "string") continue;
  const locality = nameCell.v.trim();
  if (!locality || locality === "Location") continue;

  const byAge = {};
  for (let C = 1; C <= maxC; C++) {
    const ageCell = sh[XLSX.utils.encode_cell({ r: agesRow - 1, c: C })];
    const idxCell = sh[XLSX.utils.encode_cell({ r: colIdxRow - 1, c: C })];
    if (!ageCell || typeof ageCell.v !== "number") continue;
    if (!idxCell || typeof idxCell.v !== "number") continue;
    const age = Math.floor(ageCell.v);
    const col1Based = Math.floor(idxCell.v);
    const letter = excelColLetter(col1Based);
    const premCell = sh[letter + (R + 1)];
    const prem =
      premCell && premCell.v != null && premCell.v !== ""
        ? Number(premCell.v)
        : 0;
    if (!Number.isNaN(age)) byAge[age] = prem;
  }
  slcspByLocality[locality] = byAge;
}

const body = `/**
 * Auto-generated from FY2026 workbook (Program specific data + SLCSP premiums).
 * Regenerate: npm run build:marketplace-data
 */

const MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD = ${JSON.stringify(fplRows, null, 2)};

const MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD = ${JSON.stringify(medicaidRows, null, 2)};

/** @type {Record<string, Record<string, number>>} age key as string for JSON */
const SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE = ${JSON.stringify(slcspByLocality, null, 2)};
`;

writeFileSync(src.marketplaceLookup, body, "utf8");
console.log("Wrote src/programs/marketplace/lookup-data.js", {
  fpl: fplRows.length,
  medicaid: medicaidRows.length,
  localities: Object.keys(slcspByLocality).length,
});
