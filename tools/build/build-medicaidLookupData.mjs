/**
 * Builds medicaid lookup data from FY2026 workbook Program specific data.
 * Run: npm run build:medicaid-data
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

const wb = XLSX.readFile(wbPath);
const prog = wb.Sheets["Program specific data"];

const adultCell = prog["C148"];
const childCell = prog["C152"];
const adult =
  adultCell && adultCell.v != null && adultCell.v !== ""
    ? Number(adultCell.v)
    : 0;
const child =
  childCell && childCell.v != null && childCell.v !== ""
    ? Number(childCell.v)
    : 0;

const body = `/**
 * Auto-generated from FY2026 workbook (Program specific data C148, C152).
 * Regenerate: npm run build:medicaid-data
 */

const MEDICAID_ADULT_SPEND_MONTHLY = ${JSON.stringify(adult)};
const MEDICAID_CHILD_SPEND_MONTHLY = ${JSON.stringify(child)};
`;

writeFileSync(src.medicaidLookup, body, "utf8");
console.log("Wrote src/programs/medicaid/lookup-data.js", { MEDICAID_ADULT_SPEND_MONTHLY: adult, MEDICAID_CHILD_SPEND_MONTHLY: child });
