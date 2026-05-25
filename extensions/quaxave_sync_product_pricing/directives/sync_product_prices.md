# Directive: Sync Product Prices

## Goal

Scrape live prices from Costco and Walmart product pages on a daily schedule and stage any
price differences as pending records. The admin reviews pending changes in the EverShop admin
and approves or dismisses them — only approved changes update the store's product prices.

---

## Inputs

| Input | Source | Notes |
|---|---|---|
| `COSTCO_SHEET_ID` | env | Google Sheets spreadsheet ID for Costco products |
| `WALMART_SHEET_ID` | env | Google Sheets spreadsheet ID for Walmart products |
| `COSTCO_SHEET_NAME` | env | Tab name, default `Costco` |
| `WALMART_SHEET_NAME` | env | Tab name, default `Walmart` |
| `GOOGLE_SERVICE_ACCOUNT_PATH` | env | Absolute path to service account JSON key |
| `PRICE_SYNC_ENABLED` | env | Must be `"true"` to allow the job to run |

---

## Execution

### Step 1 — Read Price Sheet
**Script:** `execution/readPriceSheet.js`

- MUST read both Costco and Walmart sheet tabs from their respective spreadsheet IDs
- MUST find Name, Link, and Price columns by header name (case-insensitive)
- MUST skip rows with no name, no URL, or a URL that is not a valid http/https link
- SHOULD return `{ rowIndex, name, link, sheetPrice, source }` per product
- MAY return `sheetPrice: null` if the price column is missing or unparseable
- Returns combined array from all configured tabs

### Step 2 — Scrape Current Prices
**Script:** `execution/scrapeCurrentPrices.js`

- Accepts: `products[]` from Step 1
- MUST import `scrapeProductPage` from `quaxave_product_importer/execution/scrapeProductPage.js`
- MUST process in batches of 3 with 8s delay between batches (anti-bot)
- SHOULD log each product's row index, name, and result
- MAY skip a product on scrape error — set `livePrice: null, scrapeError: message`
- Returns: products enriched with `{ livePrice, itemNumber, scrapeError }`

### Step 3 — Match Products in Store
**Script:** `execution/matchProductsInStore.js`

- Accepts: scraped products (those with a non-null `itemNumber`)
- MUST query: `SELECT uuid, sku, price FROM product WHERE sku = ANY($1)`
- Returns: map of `{ [sku]: { uuid, currentPrice } }` for matched products only
- Products not yet in EverShop are silently skipped (they haven't been imported yet)

### Step 4 — Save Pending Changes
**Script:** `execution/savePendingChanges.js`

- Accepts: scraped products + store match map
- For each product where `livePrice !== null` AND `livePrice !== currentPrice`:
  - MUST upsert into `product_price_pending` with `status = 'pending'`
  - The partial unique index ensures only one pending row per (sku, source) at a time
  - If a pending row already exists for that sku+source, REPLACE it (fresh scrape wins)
- Products with scrape errors are logged but NOT staged
- Returns: `{ staged: N, skipped: N, errors: N }`

---

## Outputs

| Output | Notes |
|---|---|
| `product_price_pending` rows | Queryable via `pendingPriceChanges` GraphQL query |
| Console log | Summary: X products scraped, Y staged, Z errors |

---

## Edge Cases

- **PRICE_SYNC_ENABLED is not `"true"`**: Job exits immediately with a log message. Safe to
  deploy before the service account is configured.
- **Scrape bot detection**: Costco Akamai may block headless browsers. The persistent
  cookie profile (`/tmp/costco-scraper-profile`) reduces this over repeated runs. If all
  prices are null after a run, the selectors may have drifted — check the Learnings section
  of `quaxave_product_importer/directives/import_costco_product.md`.
- **Promotional prices**: Costco sometimes shows a temporary lower price. The pending/approve
  flow protects against accidentally writing a promo price as the permanent price.
- **Stale pending records**: If admin never approves, records accumulate. Records older than
  30 days with `status='pending'` can be cleaned up manually or via a future purge job.
- **Product not in EverShop**: Products in the sheet but not yet imported are skipped in
  Step 3. Import them first via `quaxave_product_importer` (the separate import workflow).

---

## Learnings

<!-- Dated entries added after each notable execution -->

