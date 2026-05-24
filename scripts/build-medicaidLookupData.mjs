/**
 * Builds medicaidLookupData.js from FY2026 workbook Program specific data:
 * - C148: monthly adult Medicaid spend (non-expansion path, M2)
 * - C152: monthly child Medicaid spend (P2)
 *
 * Run: node scripts/build-medicaidLookupData.mjs
 */
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const wbPath = join(
  root,
  "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
);

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
 * Regenerate: node scripts/build-medicaidLookupData.mjs
 */

const MEDICAID_ADULT_SPEND_MONTHLY = ${JSON.stringify(adult)};
const MEDICAID_CHILD_SPEND_MONTHLY = ${JSON.stringify(child)};
`;

writeFileSync(join(root, "medicaidLookupData.js"), body, "utf8");
console.log("Wrote medicaidLookupData.js", { MEDICAID_ADULT_SPEND_MONTHLY: adult, MEDICAID_CHILD_SPEND_MONTHLY: child });
