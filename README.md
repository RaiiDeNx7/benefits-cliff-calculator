# Benefits Cliff Calculator

A browser-based calculator for Virginia households to compare **current** vs **new** income and benefit scenarios. It helps visualize how changes in earned income affect monthly program amounts—a common “benefits cliff” use case for counselors and planners.

Calculations mirror the FY2026 Virginia Benefits Cliff Excel workbook. Each benefit program has its own module with lookup tables and a calculator that reproduces the workbook formulas.

## Features

- **Virginia localities** — All Virginia cities and counties supported via locality-specific lookup data.
- **Eight benefit programs** (select any combination):
  - Child Care Subsidy
  - EITC (+ Virginia EITC, shown monthly)
  - Health Insurance Marketplace subsidies
  - Housing Choice Voucher (HCV)
  - Medicaid
  - SNAP
  - TANF
  - WIC
- **Current vs new scenario** — Enter current and new parent earned income; outputs update live as you type.
- **Household totals** — Monthly summary of total household income, selected benefits, and overall resources (benefits + earned income).
- **Per-program breakdown** — Side-by-side Current and New columns for each selected program.

## Quick start

No build step is required for the UI. Open the app in a browser:

1. Clone or download this repository.
2. Serve the project root with any static file server, or open `index.html` directly.
3. Fill in locality, programs, household details, and income fields.

Example with Python:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

For development verification scripts, install Node dependencies first:

```bash
npm install
```

## Project structure

```
├── index.html              # App shell and form markup
├── styles.css              # Layout and VDSS-themed styling
├── src/
│   ├── app.js              # Form wiring, aggregation, output updates
│   ├── config/
│   │   └── data.js         # Localities, benefit list, child age bands
│   ├── programs/           # One folder per benefit program
│   │   ├── child-care/
│   │   ├── eitc/
│   │   ├── marketplace/
│   │   ├── medicaid/
│   │   ├── hcv/
│   │   ├── snap/
│   │   ├── tanf/
│   │   └── wic/
│   │       ├── calculator.js   # Workbook formula logic
│   │       └── lookup-data.js  # Generated/static lookup tables
│   └── shared/
│       └── tanf-view.js    # Shared TANF-VIEW logic (used by SNAP/TANF)
├── tools/
│   ├── build/              # Regenerate lookup-data.js from Excel
│   ├── verify/             # Program-level regression checks
│   │   └── tc/             # Full household test-case regressions
│   └── lib/
│       └── paths.mjs       # Shared paths and VM helpers
└── Test Cases/             # Excel workbooks used for regression testing
```

Scripts load in dependency order from `index.html` (config → lookups → calculators → `app.js`).

## How it works

1. **Inputs** — The form collects locality, selected programs, household size, adult/child details, disability and SSI info, shelter/utilities, tax filing status, and parent vs non-parent earned income (current and new).
2. **Per-program calculators** — Each `src/programs/*/calculator.js` exposes compute functions (e.g. `computeSnapV`) that take a parameter object and return monthly amounts aligned to workbook cells.
3. **Aggregation** — `src/app.js` sums selected program outputs and computes household totals, including exact-cent aggregates for summary rows.

## Verification

Node scripts run calculator code in isolation and compare results to expected workbook values.

**Per-program checks:**

```bash
npm run verify-child-care
npm run verify-eitc
npm run verify-marketplace
npm run verify-medicaid
npm run verify-hcv
npm run verify-snap
npm run verify-tanf
npm run verify-wic
```

**Household test cases** (multi-program scenarios in `Test Cases/`):

```bash
npm run verify-tc6
npm run verify-tc7
npm run verify-tc8
npm run diagnose-tc7   # Debug helper for TC7
```

## Rebuilding lookup data

Some lookup tables are generated from the source Excel workbook at `data/source/Benefits Cliff Calculator with disability + SSI draft FY2026 FPL_copy.xlsx`:

```bash
npm run build-child-care-data
npm run build-eitc-data
npm run build-marketplace-data
npm run build-medicaid-data
npm run build-hcv-data
npm run build-snap-data
npm run build-tanf-data
npm run build-wic-data
```

The workbook is not checked into this repository; place it at the path above before running build scripts. Medicaid spend rates use a separate workbook path (see below).

## Maintaining the calculator

When program rules, rates, or workbook formulas change, see **[MAINTENANCE.md](MAINTENANCE.md)** for per-program checklists: which Excel sheets/cells feed each build, which `lookup-data.js` / `calculator.js` files to touch, cross-dependencies (TANF-VIEW, Medicaid thresholds via Marketplace), and which verify scripts to run.

## Tech stack

- Vanilla HTML, CSS, and JavaScript (no frontend framework)
- Node.js + `xlsx` for build/verify tooling only
- ISC license

## Disclaimer

This tool is for planning and education. Results depend on the accuracy of inputs and the FY2026 rules encoded in the workbook. It does not replace official eligibility determinations from Virginia DSS or individual programs.
