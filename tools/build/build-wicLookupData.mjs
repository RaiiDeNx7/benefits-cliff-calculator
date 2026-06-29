/**
 * Builds src/programs/wic/lookup-data.js from FY2026 workbook.
 * - Program specific data A109:B116 — WIC income limits by household
 * - Program specific data B119 — monthly value per WIC person
 *
 * Run: npm run build-wic-data
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

const prog = XLSX.readFile(wbPath).Sheets["Program specific data"];

const wicIncomeLimit = [];
for (let r = 109; r <= 116; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  if (!a || a.v == null) continue;
  wicIncomeLimit.push({ hh: Number(a.v), limit: Number(b.v) });
}

const wicValuePerPerson =
  prog["B119"] && prog["B119"].v != null ? Number(prog["B119"].v) : 36.76;

const body = `/**
 * Auto-generated from FY2026 workbook (Program specific data).
 * Regenerate: npm run build-wic-data
 */

const WIC_INCOME_LIMIT_BY_HH = ${JSON.stringify(wicIncomeLimit, null, 2)};

const WIC_VALUE_PER_WIC_PERSON_MONTHLY = ${JSON.stringify(wicValuePerPerson)};
`;

writeFileSync(src.wicLookup, body, "utf8");
console.log("Wrote src/programs/wic/lookup-data.js", {
  incomeLimitRows: wicIncomeLimit.length,
  valuePerPerson: wicValuePerPerson,
});
