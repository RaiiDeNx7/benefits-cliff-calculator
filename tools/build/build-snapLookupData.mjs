/**
 * Builds src/programs/snap/lookup-data.js from FY2026 workbook.
 * - Program specific data A72:C79 — utility / SUA by household
 * - Program specific data A85:D92 — gross / net income tests
 * - Program specific data A97:B104 — max allotment
 * - SNAP!L2 — shelter cap
 *
 * Run: npm run build-snap-data
 */
import XLSX from "xlsx";
import { writeFileSync } from "fs";
import { wbPath, src } from "../lib/paths.mjs";

const wb = XLSX.readFile(wbPath);
const prog = wb.Sheets["Program specific data"];
const snapSheet = wb.Sheets["SNAP"];
const snapL2 =
  snapSheet["L2"] && snapSheet["L2"].v != null && snapSheet["L2"].v !== ""
    ? Number(snapSheet["L2"].v)
    : 712;

const snapGrossNetRows = [];
for (let r = 85; r <= 92; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  const d = prog["D" + r];
  if (!a || a.v == null) continue;
  snapGrossNetRows.push({
    hh: Number(a.v),
    grossLessThan: Number(b.v),
    netCountableLessThan: Number(d.v),
  });
}

const snapMaxAllotment = [];
for (let r = 97; r <= 104; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  if (!a || a.v == null) continue;
  snapMaxAllotment.push({ hh: Number(a.v), maxAllotment: Number(b.v) });
}

const snapUtilityRows = [];
for (let r = 72; r <= 79; r++) {
  const a = prog["A" + r];
  const b = prog["B" + r];
  const c = prog["C" + r];
  if (!a || a.v == null) continue;
  snapUtilityRows.push({
    hh: Number(a.v),
    heatingCoolingStandard: Number(b.v),
    sua: Number(c.v),
  });
}

const body = `/**
 * Auto-generated from FY2026 workbook (Program specific data + SNAP!L2).
 * Regenerate: npm run build-snap-data
 */

const SNAP_GROSS_NET_TEST_ROWS = ${JSON.stringify(snapGrossNetRows, null, 2)};

const SNAP_MAX_ALLOTMENT_BY_HH = ${JSON.stringify(snapMaxAllotment, null, 2)};

const SNAP_UTILITY_BY_HH = ${JSON.stringify(snapUtilityRows, null, 2)};

const SNAP_SHELTER_CAP_L2 = ${JSON.stringify(snapL2)};
`;

writeFileSync(src.snapLookup, body, "utf8");
console.log("Wrote src/programs/snap/lookup-data.js", {
  grossNetRows: snapGrossNetRows.length,
  maxAllotmentRows: snapMaxAllotment.length,
  utilityRows: snapUtilityRows.length,
  shelterCap: snapL2,
});
