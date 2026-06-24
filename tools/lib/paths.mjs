/**
 * Shared paths for build and verify tooling.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import vm from "vm";

const toolsLibDir = dirname(fileURLToPath(import.meta.url));
export const root = join(toolsLibDir, "../..");
export const wbPath = join(root, "data/source/FY2026-workbook.xlsx");

export const src = {
  configData: join(root, "src/config/data.js"),
  childCareLookup: join(root, "src/programs/child-care/lookup-data.js"),
  childCareCalc: join(root, "src/programs/child-care/calculator.js"),
  eitcLookup: join(root, "src/programs/eitc/lookup-data.js"),
  eitcCalc: join(root, "src/programs/eitc/calculator.js"),
  marketplaceLookup: join(root, "src/programs/marketplace/lookup-data.js"),
  marketplaceCalc: join(root, "src/programs/marketplace/calculator.js"),
  medicaidLookup: join(root, "src/programs/medicaid/lookup-data.js"),
  medicaidCalc: join(root, "src/programs/medicaid/calculator.js"),
  hcvLookup: join(root, "src/programs/hcv/lookup-data.js"),
  hcvCalc: join(root, "src/programs/hcv/calculator.js"),
  snapLookup: join(root, "src/programs/snap/lookup-data.js"),
  snapCalc: join(root, "src/programs/snap/calculator.js"),
  tanfLookup: join(root, "src/programs/tanf/lookup-data.js"),
  tanfCalc: join(root, "src/programs/tanf/calculator.js"),
  tanfView: join(root, "src/shared/tanf-view.js"),
  wicLookup: join(root, "src/programs/wic/lookup-data.js"),
  wicCalc: join(root, "src/programs/wic/calculator.js"),
};

/** Run JS files in order into a fresh vm context (mirrors index.html script order). */
export function loadIntoContext(filePaths, ctx = {}) {
  for (const filePath of filePaths) {
    vm.runInNewContext(readFileSync(filePath, "utf8"), ctx, {
      filename: filePath,
    });
  }
  return ctx;
}

/** Read and concatenate files (for eval-style verify scripts). */
export function readConcat(filePaths) {
  return filePaths.map((p) => readFileSync(p, "utf8")).join("\n");
}
