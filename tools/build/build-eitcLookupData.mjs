/**
 * Reads "EITC Rates" sheet A6:G13 (single / not MFJ) and A17:G24 (MFJ) from the FY2026 workbook.
 * Run: npm run build:eitc-data
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

const wb = XLSX.readFile(wbPath);
const sh = wb.Sheets["EITC Rates"];

function readBlock(startRow, endRow) {
  const rows = [];
  for (let r = startRow; r <= endRow; r++) {
    const a = sh["A" + r];
    if (!a || a.v === "" || a.v == null) continue;
    const n = Number(a.v);
    if (Number.isNaN(n)) continue;
    const row = {
      numChildren: n,
      agiMustBeBelow: Number(sh["B" + r].v),
      maxCredit: Number(sh["C" + r].v),
      phaseInRate: Number(sh["D" + r].v),
      phaseOutRate: Number(sh["E" + r].v),
      maxCreditStartsAt: Number(sh["F" + r].v),
      phaseOutStartsAt: Number(sh["G" + r].v),
    };
    rows.push(row);
  }
  return rows;
}

const single = readBlock(6, 13);
const mfj = readBlock(17, 24);

const body = `/**
 * Auto-generated from "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
 * Sheet "EITC Rates": rows A6:G13 (not MFJ) and A17:G24 (MFJ).
 * Regenerate: npm run build:eitc-data
 */

/** @typedef {{ numChildren: number, agiMustBeBelow: number, maxCredit: number, phaseInRate: number, phaseOutRate: number, maxCreditStartsAt: number, phaseOutStartsAt: number }} EitcRateRow */

/** @type {EitcRateRow[]} */
const EITC_RATES_NOT_MFJ = ${JSON.stringify(single, null, 2)};

/** @type {EitcRateRow[]} */
const EITC_RATES_MFJ = ${JSON.stringify(mfj, null, 2)};
`;

writeFileSync(src.eitcLookup, body, "utf8");
console.log("Wrote src/programs/eitc/lookup-data.js", { notMfj: single.length, mfj: mfj.length });
