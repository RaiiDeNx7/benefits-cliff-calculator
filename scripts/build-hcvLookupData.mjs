/**
 * Builds hcvLookupData.js from FY2026 workbook (Location specific data).
 * - 80% AMI annual cols 11-18 by household size 1-8 (Housing Voucher L2), stored as monthly (/12).
 * - HCV payment standard cols 25-29 by bedroom 1-5 (Housing Voucher P209 IFS).
 *
 * Run: node scripts/build-hcvLookupData.mjs
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

const loc = XLSX.readFile(wbPath).Sheets["Location specific data"];
const ref = loc["!ref"];
const rng = XLSX.utils.decode_range(ref);
const byLocality = {};

for (let R = rng.s.r + 2; R <= rng.e.r; R++) {
  const nameCell = loc[XLSX.utils.encode_cell({ r: R, c: 0 })];
  if (!nameCell || typeof nameCell.v !== "string") continue;
  const name = nameCell.v.trim();
  if (!name || name === "Locality") continue;

  const ami80MonthlyByHousehold = {};
  for (let hh = 1; hh <= 8; hh++) {
    const cell = loc[XLSX.utils.encode_cell({ r: R, c: 10 + hh })];
    const annual =
      cell && cell.v != null && cell.v !== "" ? Number(cell.v) : 0;
    ami80MonthlyByHousehold[String(hh)] = annual / 12;
  }

  const paymentStandardByBedroom = {};
  for (let bed = 1; bed <= 5; bed++) {
    const cell = loc[XLSX.utils.encode_cell({ r: R, c: 24 + bed })];
    paymentStandardByBedroom[String(bed)] =
      cell && cell.v != null && cell.v !== "" ? Number(cell.v) : 0;
  }

  byLocality[name] = { ami80MonthlyByHousehold, paymentStandardByBedroom };
}

const body = `/**
 * Auto-generated (Location specific data: AMI 80% monthly by hh 1-8, payment std cols 25-29 by bedroom 1-5).
 * Regenerate: node scripts/build-hcvLookupData.mjs
 */

/** @type {Record<string, { ami80MonthlyByHousehold: Record<string, number>, paymentStandardByBedroom: Record<string, number> }>} */
const HCV_BY_LOCALITY = ${JSON.stringify(byLocality, null, 2)};
`;

writeFileSync(join(root, "hcvLookupData.js"), body, "utf8");
console.log("Wrote hcvLookupData.js", Object.keys(byLocality).length, "localities");
