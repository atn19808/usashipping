# Directive: Check Costco Prices Against Google Sheet

## Goal

Read all products from the Costco tracking Google Sheet, scrape their current live prices
from Costco.com, and compare them against the prices stored in the sheet. Output a full
report flagging mismatches, increases, and decreases.

---

## Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `spreadsheetId` | string | YES | Google Sheets document ID |
| `sheetRange` | string | NO | Defaults to `Costco!A:Z` — reads all columns |
| `serviceAccountKeyFile` | string | YES | Path to Google service account JSON with Sheets read access |
| `outputDir` | string | NO | Directory for report files — defaults to `.temp/` at project root |
| `batchSize` | number | NO | Products per Puppeteer batch — defaults to 3 |
| `batchDelayMs` | number | NO | Delay between batches (ms) — defaults to 8000 |

---

## Execution

### Step 1 — Read Spreadsheet
**Script:** `execution/readSpreadsheet.js`

- MUST authenticate to Google Sheets API v4 using the service account key file
- MUST read the full range (default `Costco!A:Z`) from the configured spreadsheet
- MUST auto-detect column indices from header row (row 1):
  - Name column: header = `"Name"` (case-insensitive)
  - Link column: header = `"Link"` — if multiple, use the last one (rightmost)
  - Price column: header = `"Price"` or `"Our Price"` (case-insensitive) — may be absent
- MUST filter out rows with no name or no valid Costco URL
  - Valid Costco URL: contains `costco.com` and starts with `https://`
- Returns: `Product[]` where each product is `{ rowIndex, name, category, link, sheetPrice }`
  - `sheetPrice` is `null` if no price column exists or the cell is empty
  - `category` is `null` if no Category column exists

### Step 2 — Fetch Current Prices from Costco
**Script:** `execution/fetchCurrentPrices.js`

- Accepts: `Product[]` from Step 1
- MUST reuse `execution/scrapeProductPage.js` from the same extension for page scraping
  — do NOT duplicate the Puppeteer logic (selectors, anti-detection, etc.)
- MUST process products in batches of `batchSize` (default 3) with `batchDelayMs` delay between batches
  to avoid rate limiting / bot detection
- For each product:
  - Call `scrapeProductPage(url)` → `{ name, price, itemNumber, ... }`
  - `price` is the live Costco price (USD number or `null`)
  - On any error, record `livePrice: null` and `scrapeError: error.message`
- Returns: `EnrichedProduct[]` — original product fields + `{ livePrice, itemNumber, scrapeError }`

### Step 3 — Generate Price Report
**Script:** `execution/generatePriceReport.js`

- Accepts: `EnrichedProduct[]` from Step 2 and config `{ outputDir }`
- MUST compute per-product price comparison:
  - `status`: `"match"` | `"increase"` | `"decrease"` | `"no_sheet_price"` | `"scrape_failed"`
  - `delta`: `livePrice - sheetPrice` (null if either is null)
  - `deltaPercent`: `(delta / sheetPrice) * 100` (null if either is null)
- MUST create `outputDir` if it does not exist
- MUST write two files:
  1. `<outputDir>/price-check-<YYYY-MM-DD>.json` — full machine-readable results
  2. `<outputDir>/price-check-<YYYY-MM-DD>.md` — human-readable markdown summary
- The JSON file MUST include:
  - `generatedAt` (ISO timestamp)
  - `spreadsheetId`
  - `totalProducts`, `matched`, `increased`, `decreased`, `noSheetPrice`, `scrapeFailed`
  - `products[]` — full detail for every product
- The Markdown file MUST include:
  - Run date, spreadsheet ID, summary table
  - Sections: Price Increases, Price Decreases, Scrape Failures, Matched
- Returns: `{ jsonPath, mdPath, summary }`

---

## Outputs

| Output | Type | Notes |
|---|---|---|
| `<outputDir>/price-check-<date>.json` | file | Full results for every product |
| `<outputDir>/price-check-<date>.md` | file | Human-readable markdown report |
| `summary` | object | `{ totalProducts, matched, increased, decreased, noSheetPrice, scrapeFailed }` |

---

## Edge Cases

- **No Price column in sheet:** All products get `status: "no_sheet_price"`. Report still includes
  live prices scraped from Costco — useful for populating the sheet for the first time.
- **Bot detection on scrape:** Same as import_costco_product.md — persistent cookie profile at
  `/tmp/costco-scraper-profile` helps. Failed scrapes are recorded, not retried, to avoid
  hammering Costco. Re-run the script later for just the failures.
- **Members-only / out-of-stock products:** Price will be `null` from scraper. Recorded as
  `status: "scrape_failed"` with note in error field.
- **Multiple Link columns:** The rightmost `Link` column is used (consistent with testFullSpreadsheet.js
  which used the second one).
- **Price format in sheet:** Sheet prices may be stored as `"$19.99"` strings or plain numbers.
  Step 1 strips `$` and commas before parsing.

---

## Learnings

**2026-03-09 — Initial implementation**
- Reuses `execution/scrapeProductPage.js` from the import DOE — no separate Puppeteer setup needed.
- Google Sheets service account JSON is at `./config/costco-price-service-account.json` relative
  to the project root (`usashipping/`).
- Spreadsheet ID: `1fxkYVfTY-3gz_KbJgcUT0Ul8hoqj18vJHYNN6trZp-I`
- Sheet tab name: `Costco`, range `A:J` was used in testFullSpreadsheet.js — extended to `A:Z`
  to capture any future columns without code changes.
- Output goes to `.temp/` folder at project root to keep results out of version control.
