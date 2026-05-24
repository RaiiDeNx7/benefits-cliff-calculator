/**
 * One-off: reads FY2026 workbook and prints JS snippets for child care lookups.
 * Run: node scripts/extract-child-care-lookups.mjs
 */
import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const wbPath = join(
  root,
  "Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy - Copy.xlsx"
);

const wb = XLSX.readFile(wbPath);
const prog = wb.Sheets["Program specific data"];
const loc = wb.Sheets["Location specific data"];

function colLetterToIndex(letters) {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

// A5:C13 — household size, annual FPL, monthly FPL
const fplRows = [];
for (let r = 4; r <= 12; r++) {
  const a = prog[`A${r + 1}`];
  const b = prog[`B${r + 1}`];
  const c = prog[`C${r + 1}`];
  if (!a || a.v == null) continue;
  fplRows.push({ householdSize: Number(a.v), annualFpl: Number(b.v), monthlyFpl: Number(c.v) });
}

// A20:F27 — col A household, B 85% SMI?, C-F group I-IV limits
const limitRows = [];
for (let r = 19; r <= 26; r++) {
  const row = r + 1;
  const cells = ["A", "B", "C", "D", "E", "F"].map((L) => prog[`${L}${row}`]);
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

// Location: col A locality name; AG-AK (0-based 32-36) rates; AM (38) group
const ag = colLetterToIndex("AG");
const am = colLetterToIndex("AM");
const ref = loc["!ref"];
const rng = XLSX.utils.decode_range(ref);
const localityRates = [];
for (let R = rng.s.r + 2; R <= rng.e.r; R++) {
  const nameCell = loc[XLSX.utils.encode_cell({ r: R, c: 0 })];
  if (!nameCell || typeof nameCell.v !== "string") continue;
  const name = nameCell.v.trim();
  if (!name || name === "Locality") continue;
  const rates = [];
  for (let c = 0; c < 5; c++) {
    const cell = loc[XLSX.utils.encode_cell({ r: R, c: ag + c })];
    rates.push(cell && cell.v != null ? Number(cell.v) : 0);
  }
  const gCell = loc[XLSX.utils.encode_cell({ r: R, c: am })];
  const group = gCell && gCell.v != null ? Number(gCell.v) : 1;
  localityRates.push({ name, rates, group });
}

console.log("// --- FPL_BY_HOUSEHOLD_SIZE (Program specific data A5:C13) ---");
console.log("const CHILD_CARE_FPL_BY_HOUSEHOLD = " + JSON.stringify(fplRows, null, 2) + ";");
console.log("\n// --- LIMITS_BY_HOUSEHOLD (Program specific data A20:F27) ---");
console.log("const CHILD_CARE_LIMITS_BY_HOUSEHOLD = " + JSON.stringify(limitRows, null, 2) + ";");
console.log("\n// --- LOCALITY_RATES (Location AG-AK) + group (AM) ---");
console.log("const CHILD_CARE_LOCALITY_TABLE = " + JSON.stringify(localityRates, null, 2) + ";");
