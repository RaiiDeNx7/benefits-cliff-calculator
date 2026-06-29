/**
 * Builds src/programs/tanf/lookup-data.js from FY2026 workbook.
 * - Program specific data A35:B42 — standard deduction by AU size
 * - Program specific data A6:C13 col C — monthly 150% FPL (workbook K2 path)
 * - Program specific data A48:C55 — standard of assistance (groups 2 / 1)
 * - Program specific data A60:C67 — max gross income (groups 2 / 1)
 * - Program specific data B56 / C56 — TANF-VIEW I2 caps
 * - Location specific data col B — TANF-VIEW A3 by locality
 *
 * Run: npm run build-tanf-data
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

const wb = XLSX.readFile(wbPath);
const prog = wb.Sheets["Program specific data"];
const loc = wb.Sheets["Location specific data"];

const tanfStandardDeduction = [];
for (let r = 35; r <= 42; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  if (!a || typeof a.v !== "number") continue;
  tanfStandardDeduction.push({ size: Number(a.v), deduction: Number(b.v) });
}

const tanfMonthly150Fpl = [];
for (let r = 6; r <= 13; r++) {
  const a = prog["A" + r];
  const c = prog["C" + r];
  if (!a || a.v == null) continue;
  tanfMonthly150Fpl.push({ hh: Number(a.v), monthly150: Number(c.v) });
}

const tanfStandardOfAssistance = [];
for (let r = 48; r <= 55; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  const c = prog["C" + r];
  if (!a || a.v == null) continue;
  tanfStandardOfAssistance.push({
    hh: Number(a.v),
    group2: Number(b.v),
    group1: Number(c.v),
  });
}

const tanfMaxGrossIncome = [];
for (let r = 60; r <= 67; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  const c = prog["C" + r];
  if (!a || a.v == null) continue;
  tanfMaxGrossIncome.push({
    hh: Number(a.v),
    group2: Number(b.v),
    group1: Number(c.v),
  });
}

const tanfI2Group2 =
  prog["B56"] && prog["B56"].v != null ? Number(prog["B56"].v) : 723;
const tanfI2Group1 =
  prog["C56"] && prog["C56"].v != null ? Number(prog["C56"].v) : 861;

const tanfA3ByLocality = {};
const ref = loc["!ref"];
const rng = XLSX.utils.decode_range(ref);
for (let R = rng.s.r + 2; R <= rng.e.r; R++) {
  const nameCell = loc[XLSX.utils.encode_cell({ r: R, c: 0 })];
  if (!nameCell || typeof nameCell.v !== "string") continue;
  const name = nameCell.v.trim();
  if (!name || name === "Locality") continue;
  const bCell = loc[XLSX.utils.encode_cell({ r: R, c: 1 })];
  tanfA3ByLocality[name] =
    bCell && bCell.v != null && bCell.v !== "" ? Number(bCell.v) : 1;
}

const body = `/**
 * Auto-generated from FY2026 workbook (Program + Location col B for TANF A3).
 * Regenerate: npm run build-tanf-data
 */

const TANF_STANDARD_DEDUCTION_BY_SIZE = ${JSON.stringify(tanfStandardDeduction, null, 2)};

const TANF_MONTHLY_150_FPL_BY_HH = ${JSON.stringify(tanfMonthly150Fpl, null, 2)};

const TANF_STANDARD_OF_ASSISTANCE_BY_HH = ${JSON.stringify(tanfStandardOfAssistance, null, 2)};

const TANF_MAX_GROSS_INCOME_BY_HH = ${JSON.stringify(tanfMaxGrossIncome, null, 2)};

const TANF_VIEW_I2_CAP_GROUP2 = ${JSON.stringify(tanfI2Group2)};

const TANF_VIEW_I2_CAP_GROUP1 = ${JSON.stringify(tanfI2Group1)};

/** @type {Record<string, number>} locality → TANF-VIEW A3 (1 or 2) */
const TANF_VIEW_A3_BY_LOCALITY = ${JSON.stringify(tanfA3ByLocality, null, 2)};
`;

writeFileSync(src.tanfLookup, body, "utf8");
console.log("Wrote src/programs/tanf/lookup-data.js", {
  deductionRows: tanfStandardDeduction.length,
  localities: Object.keys(tanfA3ByLocality).length,
  i2Caps: { group2: tanfI2Group2, group1: tanfI2Group1 },
});
