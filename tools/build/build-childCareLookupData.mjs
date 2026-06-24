/**
 * Builds child care lookup data from the FY2026 workbook.
 * Run: npm run build:child-care-data
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

const wb = XLSX.readFile(wbPath);
const prog = wb.Sheets["Program specific data"];
const loc = wb.Sheets["Location specific data"];

function colLettersToIndex(letters) {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

const fplRows = [];
for (let excelRow = 6; excelRow <= 13; excelRow++) {
  const a = prog["A" + excelRow];
  const b = prog["B" + excelRow];
  const c = prog["C" + excelRow];
  if (!a || a.v == null) continue;
  const sz = Number(a.v);
  if (sz < 1) continue;
  fplRows.push({
    householdSize: sz,
    annualFpl: Number(b.v),
    monthlyFpl: Number(c.v),
  });
}

const limitRows = [];
for (let excelRow = 20; excelRow <= 27; excelRow++) {
  const cells = ["A", "B", "C", "D", "E", "F"].map((L) => prog[L + excelRow]);
  if (!cells[0] || cells[0].v == null) continue;
  limitRows.push({
    householdSize: Number(cells[0].v),
    smi85: Number(cells[1].v),
    groupILimit: Number(cells[2].v),
    groupIiLimit: Number(cells[3].v),
    groupIiiLimit: Number(cells[4].v),
    groupIvLimit: Number(cells[5].v),
  });
}

const ag = colLettersToIndex("AG");
const am = colLettersToIndex("AM");
const ref = loc["!ref"];
const rng = XLSX.utils.decode_range(ref);
const localityByName = {};
for (let R = rng.s.r + 2; R <= rng.e.r; R++) {
  const nameCell = loc[XLSX.utils.encode_cell({ r: R, c: 0 })];
  if (!nameCell || typeof nameCell.v !== "string") continue;
  const name = nameCell.v.trim();
  if (!name || name === "Locality") continue;
  const rates = [];
  for (let c = 0; c < 5; c++) {
    const cell = loc[XLSX.utils.encode_cell({ r: R, c: ag + c })];
    rates.push(cell && cell.v != null && cell.v !== "" ? Number(cell.v) : 0);
  }
  const gCell = loc[XLSX.utils.encode_cell({ r: R, c: am })];
  const group = gCell && gCell.v != null ? Number(gCell.v) : 1;
  localityByName[name] = { group, rates };
}

const keys = Object.keys(localityByName).sort();
const body = `/**
 * Auto-generated from "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
 * (Program specific data + Location specific data AG–AK, AM).
 * Regenerate: npm run build:child-care-data
 */
const CHILD_CARE_FPL_BY_HOUSEHOLD = ${JSON.stringify(fplRows, null, 2)};

const CHILD_CARE_LIMITS_BY_HOUSEHOLD = ${JSON.stringify(limitRows, null, 2)};

/** @type {Record<string, { group: number, rates: number[] }>} */
const CHILD_CARE_LOCALITY_BY_NAME = ${JSON.stringify(Object.fromEntries(keys.map((k) => [k, localityByName[k]])), null, 2)};
`;

writeFileSync(src.childCareLookup, body, "utf8");
console.log("Wrote src/programs/child-care/lookup-data.js", { fpl: fplRows.length, limits: limitRows.length, localities: keys.length });
