# Maintaining the Benefits Cliff Calculator

Guide for updating the calculator when Virginia program rules, rates, or workbook formulas change. For how to run the app, see [README.md](README.md).

## How updates flow

```
Excel in data/source/
  → npm run build-*-data  (tools/build/build-*LookupData.mjs)
  → src/programs/<program>/lookup-data.js
  → calculator.js (runtime formulas)
  → src/app.js (UI) and npm run verify-*
```

Workbook paths are defined in [`tools/lib/paths.mjs`](tools/lib/paths.mjs):

| Constant | File | Used for |
|----------|------|----------|
| `wbPath` | `data/source/Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy.xlsx` | All builds except Medicaid spend rates |
| `medicaidWbPath` | `data/source/Benefits Cliff Calculator Medicaid updates_current_7_22_2026.xlsx` | Medicaid adult/child spend rates (C148, C152) |

The main FY2026 workbook is **not** checked into git; place it at `wbPath` before rebuilding most programs. If a workbook filename changes, update the matching constant in `paths.mjs`.

### Two kinds of change

| Kind | What you do |
|------|-------------|
| **Data** — FPL, rates, caps, locality tables | Update the Excel file → run the program’s `build-*-data` → confirm `lookup-data.js` → run `verify-*` |
| **Logic** — workbook formula / cliff behavior | Edit `src/programs/<program>/calculator.js` (and shared modules if needed) → update verify expected values → run `verify-*` |

Deep Excel cell mappings for formulas live in each calculator’s file header. This guide focuses on **which files to touch**.

---

## Cross-cutting dependencies

These trip up updates more often than any single program:

- **TANF-VIEW** — Core math is in [`src/shared/tanf-view.js`](src/shared/tanf-view.js) and TANF lookup data. SNAP, HCV, child care, and WIC all consume TANF L/T (or max). After TANF data or logic changes, also run those programs’ verifies (and TC6/TC7 when relevant).
- **Medicaid income thresholds** — Built by the **marketplace** script into `MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD` in [`src/programs/marketplace/lookup-data.js`](src/programs/marketplace/lookup-data.js). The Medicaid build only refreshes spend rates. If eligibility limits change, run `build-marketplace-data` and verify both Marketplace and Medicaid.
- **Locality list / UI labels / child age bands** — [`src/config/data.js`](src/config/data.js). Not regenerated from Excel. Update when localities are added/renamed or UI options change.
- **Script load order** — Configured in `index.html` (config → lookups → calculators → `app.js`). New globals must remain available in that order for the browser and for verify VMs.

---

## End-to-end workflow (any program)

1. Drop or update the workbook at the path in `paths.mjs` (or change that path if the filename changed).
2. Run the program’s `npm run build-*-data`.
3. Diff `src/programs/<program>/lookup-data.js` and confirm the expected numbers moved.
4. If workbook **formulas** changed, edit the calculator (and shared files) and align verify gold values.
5. Run `npm run verify-<program>` plus linked programs / `verify-tc*` when shared (see each section).
6. Spot-check the UI for one locality and household.

---

## Per-program checklists

### Medicaid

**When this usually changes:** Adult/child monthly spend rates; income eligibility limits / disregard.

| Step | What to touch |
|------|----------------|
| **Spend-rate source** | `medicaidWbPath` — sheet `Program specific data`, cells **C148** (adult), **C152** (child) |
| **Threshold source** | Main `wbPath` — `Program specific data` rows used by marketplace build (cols F/G/M → J limit, H disregard, L limit). Rebuild via **marketplace**, not the Medicaid build. |
| **Rebuild spend rates** | `npm run build-medicaid-data` → [`tools/build/build-medicaidLookupData.mjs`](tools/build/build-medicaidLookupData.mjs) |
| **Rebuild thresholds** | `npm run build-marketplace-data` |
| **Generated / runtime** | [`src/programs/medicaid/lookup-data.js`](src/programs/medicaid/lookup-data.js) (`MEDICAID_ADULT_SPEND_MONTHLY`, `MEDICAID_CHILD_SPEND_MONTHLY`); thresholds from marketplace lookup |
| **If logic changes** | [`src/programs/medicaid/calculator.js`](src/programs/medicaid/calculator.js) (`computeMedicaidMonthlyN`, sheet N212/N214) |
| **Verify** | `npm run verify-medicaid` (loads marketplace lookup + medicaid lookup + calc). Also `verify-marketplace` if thresholds changed. |

### Health Insurance Marketplace

**When this usually changes:** Monthly FPL used for % FPL brackets; Medicaid H/J/L thresholds; SLCSP premiums by locality/age.

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — `Program specific data` (FPL A6:D13 path; Medicaid threshold cols in A5:N13); sheet `SLCSP premiums` (locality rows, age/premium columns) |
| **Rebuild** | `npm run build-marketplace-data` → [`tools/build/build-marketplaceLookupData.mjs`](tools/build/build-marketplaceLookupData.mjs) |
| **Generated / runtime** | [`src/programs/marketplace/lookup-data.js`](src/programs/marketplace/lookup-data.js) — `MARKETPLACE_MONTHLY_FPL_BY_HOUSEHOLD`, `MEDICAID_MARKETPLACE_THRESHOLDS_BY_HOUSEHOLD`, `SLCSP_ADULT_PREMIUM_BY_LOCALITY_AND_AGE` |
| **If logic changes** | [`src/programs/marketplace/calculator.js`](src/programs/marketplace/calculator.js) (`computeMarketplaceSubsidyMonthlyL`, sheet L220/L222) |
| **Verify** | `npm run verify-marketplace`. If Medicaid thresholds changed, also `npm run verify-medicaid`. |

### SNAP

**When this usually changes:** Utility / SUA tables, gross/net income tests, max allotment, shelter cap.

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — `Program specific data` **A72:C79** (utility/SUA), **A85:D92** (gross/net), **A97:B104** (max allotment); sheet `SNAP` cell **L2** (shelter cap) |
| **Rebuild** | `npm run build-snap-data` → [`tools/build/build-snapLookupData.mjs`](tools/build/build-snapLookupData.mjs) |
| **Generated / runtime** | [`src/programs/snap/lookup-data.js`](src/programs/snap/lookup-data.js); calc also needs TANF lookup + [`src/shared/tanf-view.js`](src/shared/tanf-view.js) |
| **If logic changes** | [`src/programs/snap/calculator.js`](src/programs/snap/calculator.js) (`computeSnapV`, sheet V209/V211) |
| **Verify** | `npm run verify-snap`; household cases `verify-tc1`, `verify-albemarle-snap-1child`; with TANF/HCV/child care: `verify-tc6`, `verify-tc7` |

### TANF

**When this usually changes:** Standard deduction, 150% FPL, standard of assistance, max gross income, I2 caps, locality group (A3).

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — `Program specific data` **A35:B42** (deduction), **A6:C13** col C (monthly 150% FPL), **A48:C55** (SOA), **A60:C67** (max gross), **B56/C56** (I2 caps); `Location specific data` col **B** (TANF-VIEW A3 by locality) |
| **Rebuild** | `npm run build-tanf-data` → [`tools/build/build-tanfLookupData.mjs`](tools/build/build-tanfLookupData.mjs) |
| **Generated / runtime** | [`src/programs/tanf/lookup-data.js`](src/programs/tanf/lookup-data.js); core row math in [`src/shared/tanf-view.js`](src/shared/tanf-view.js); thin wrappers in [`src/programs/tanf/calculator.js`](src/programs/tanf/calculator.js) |
| **If logic changes** | Prefer editing `tanf-view.js` (affects SNAP, HCV, child care, WIC). Wrappers: `computeTanfMaxLT`, `computeTanfViewTOnly` |
| **Verify** | `npm run verify-tanf`, then `verify-snap`, `verify-hcv`, `verify-child-care`, `verify-wic`, and `verify-tc6` / `verify-tc7` as needed |

### Child Care Subsidy

**When this usually changes:** FPL, SMI / group income limits, locality rates and group.

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — `Program specific data` FPL rows **6–13**, limit rows **20–27**; `Location specific data` rate cols **AG–AK**, group col **AM** |
| **Rebuild** | `npm run build-child-care-data` → [`tools/build/build-childCareLookupData.mjs`](tools/build/build-childCareLookupData.mjs) |
| **Generated / runtime** | [`src/programs/child-care/lookup-data.js`](src/programs/child-care/lookup-data.js); age bands in [`src/config/data.js`](src/config/data.js); uses TANF L/T from `tanf-view.js` |
| **If logic changes** | [`src/programs/child-care/calculator.js`](src/programs/child-care/calculator.js) (`computeChildCareSubsidyMonthly`, sheet S208/S210) |
| **Verify** | `npm run verify-child-care`; with TANF stack: `verify-tc6`, `verify-tc7` |

Note: [`tools/build/extract-child-care-lookups.mjs`](tools/build/extract-child-care-lookups.mjs) is a one-off helper that prints snippets; it is not the normal rebuild path.

### Housing Choice Voucher (HCV)

**When this usually changes:** 80% AMI by household size, payment standards by bedroom, locality rows.

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — `Location specific data` (AMI 80% annual cols for HH 1–8 → stored monthly; payment standard cols for bedrooms 1–5) |
| **Rebuild** | `npm run build-hcv-data` → [`tools/build/build-hcvLookupData.mjs`](tools/build/build-hcvLookupData.mjs) |
| **Generated / runtime** | [`src/programs/hcv/lookup-data.js`](src/programs/hcv/lookup-data.js) (`HCV_BY_LOCALITY`); calc takes TANF L/T |
| **If logic changes** | [`src/programs/hcv/calculator.js`](src/programs/hcv/calculator.js) (`computeHcvProgramMonthlyQ`, sheet Q209/Q211) |
| **Verify** | `npm run verify-hcv`; `verify-tc6`, `verify-tc7`, `verify-tc8` |

### EITC (+ Virginia add-on)

**When this usually changes:** Federal EITC rate table by children / filing status; VA add-on percentage.

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — sheet `EITC Rates` **A6:G13** (not MFJ), **A17:G24** (MFJ) |
| **Rebuild** | `npm run build-eitc-data` → [`tools/build/build-eitcLookupData.mjs`](tools/build/build-eitcLookupData.mjs) |
| **Generated / runtime** | [`src/programs/eitc/lookup-data.js`](src/programs/eitc/lookup-data.js) (`EITC_RATES_NOT_MFJ`, `EITC_RATES_MFJ`) |
| **If logic changes** | [`src/programs/eitc/calculator.js`](src/programs/eitc/calculator.js). The VA add-on (**0.15** on the monthly cliff rows) is hard-coded in the calculator, not in the lookup. |
| **Verify** | `npm run verify-eitc` |

### WIC

**When this usually changes:** Income limits by household; monthly value per WIC person.

| Step | What to touch |
|------|----------------|
| **Source** | Main `wbPath` — `Program specific data` **A109:B116** (limits), **B119** (value per person) |
| **Rebuild** | `npm run build-wic-data` → [`tools/build/build-wicLookupData.mjs`](tools/build/build-wicLookupData.mjs) |
| **Generated / runtime** | [`src/programs/wic/lookup-data.js`](src/programs/wic/lookup-data.js); calc uses TANF max as unearned income |
| **If logic changes** | [`src/programs/wic/calculator.js`](src/programs/wic/calculator.js) (`computeWicMonthlyF` / `computeWicF`, sheet F211/F213) |
| **Verify** | `npm run verify-wic` (loads TANF stack + WIC) |

---

## Quick reference: npm scripts

| Program | Build | Verify |
|---------|-------|--------|
| Child care | `npm run build-child-care-data` | `npm run verify-child-care` |
| EITC | `npm run build-eitc-data` | `npm run verify-eitc` |
| Marketplace | `npm run build-marketplace-data` | `npm run verify-marketplace` |
| Medicaid | `npm run build-medicaid-data` | `npm run verify-medicaid` |
| HCV | `npm run build-hcv-data` | `npm run verify-hcv` |
| SNAP | `npm run build-snap-data` | `npm run verify-snap` |
| TANF | `npm run build-tanf-data` | `npm run verify-tanf` |
| WIC | `npm run build-wic-data` | `npm run verify-wic` |

Multi-program / household:

```bash
npm run verify-tc1
npm run verify-tc6
npm run verify-tc7
npm run verify-tc8
npm run verify-albemarle-snap-1child
npm run diagnose-tc7
```

Requires `npm install` (devDependency: `xlsx`).
