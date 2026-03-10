# Directive: Import Costco Product

## Goal

Scrape a Costco product page and import it as an EverShop product, including all images,
pricing, weight, and description — ready for the admin to review and publish.

---

## Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `url` | string | YES | Full Costco product page URL (must match `*.costco.com`) |
| `name` | string | YES (after scrape) | Can be edited before import |
| `price` | number | YES (after scrape) | USD price |
| `sku` | string | YES (after scrape) | Costco item number used as SKU |
| `weight` | number | NO | Net weight in lbs — may not be present on all products |
| `description` | string | NO | HTML from the product description block |
| `imageUrls` | string[] | NO | Full-resolution image URLs scraped from the carousel |

---

## Execution

### Step 1 — Validate URL
**Script:** `execution/validateDirective.js`

- MUST reject any URL whose hostname does not end with `costco.com`
- MUST reject malformed URLs (non-parseable by `new URL()`)
- Returns: `{ valid: true }` or throws with a descriptive error message

### Step 2 — Scrape Product Page
**Script:** `execution/scrapeProductPage.js`

- MUST launch a Puppeteer browser with anti-detection settings (headless:new, no AutomationControlled flag, real user-agent)
- MUST persist cookies across runs via `--user-data-dir` to avoid repeated cookie banners
- MUST dismiss the OneTrust cookie consent banner if present (`#onetrust-accept-btn-handler`)
- MUST wait for `[automation-id="product-Title"]` before extracting data
- SHOULD extract: `name`, `price`, `itemNumber`, `weight`, `description`, `imageUrls`
- SHOULD strip Costco CDN size query params (`?$...$`) from image URLs to get full-resolution
- MAY scroll 400px and retry image extraction if the carousel has not rendered yet
- Returns: `{ name, price, itemNumber, weight, description, imageUrls }` — any field may be null

**Known selectors (as of early 2025):**
- Name: `[automation-id="product-Title"]`
- Price: `[automation-id="product-price"]` → parse first `\d+\.\d{2}` match
- Item number: `[automation-id="product-ItemNumber"]` → parse digits
- Images: `.product-image-slide img`
- Description: `[automation-id="product-Description"]`
- Weight: `.product-info-specs-table` → regex `net weight N lb/oz/kg`

### Step 3 — Download & Upload Images
**Script:** `execution/downloadAndUploadImages.js`

- Accepts: `imageUrls: string[]`
- For each URL:
  - MUST follow one HTTP redirect if needed
  - MUST timeout after 15 seconds
  - SHOULD skip a failed image and continue (log the error, do not abort)
  - MUST upload using EverShop's `uploadFile` service with destination `products/costco`
  - uploadFile expects: `[{ filename, buffer, minetype, size }]`
  - filename MUST be sanitized via `generateFileName()` before upload
- Returns: `uploadedUrls: string[]` (EverShop static asset URLs for successful uploads only)

### Step 4 — Create EverShop Product
**Script:** `execution/createEverShopProduct.js`

- Accepts: `{ name, sku, price, weight, description, imageUrls }`
- MUST derive `url_key` from name: lowercase, replace non-alphanumeric with `-`, strip leading/trailing `-`
- MUST call `createProduct()` service with all required fields:
  - `name`, `sku`, `price`, `weight`, `qty` (default 100), `status` (1), `visibility` (1), `group_id` (1), `url_key`, `description`, `images`
- MUST return: `{ uuid, productId, editUrl }` where `editUrl = buildUrl('productEdit', { id: uuid })`
- On duplicate SKU: throw with message `"SKU already exists: <sku>"`

---

## Outputs

| Output | Type | Notes |
|---|---|---|
| `scraped` | object | Raw data from Step 2 — shown to admin for review/edit |
| `product.uuid` | string | Created product UUID |
| `product.editUrl` | string | URL to the product edit page in EverShop admin |

---

## Edge Cases

- **Bot detection / Timeout:** Costco uses Akamai Bot Manager. If `waitForSelector` times out,
  the page likely hit a CAPTCHA or rate limit. Strategy: retry after 30s, use the persistent
  cookie profile to maintain session state.
- **Missing price:** Price may be null if the product is members-only or out of stock.
  The admin review step MUST require price before allowing import.
- **Missing images:** Products may have images lazy-loaded. The scroll+retry in Step 2 handles
  most cases. If still empty, product can be imported without images and images added manually.
- **Selector drift:** Costco ships React updates that change `automation-id` values.
  When scrape returns all-null fields, use the Puppeteer MCP server to screenshot and inspect
  the live DOM, then update selectors here and in `execution/scrapeProductPage.js`.
- **Duplicate SKU:** EverShop enforces a unique constraint on `sku`. Step 4 catches this and
  returns a clear error message before product creation fails.
- **Long image downloads:** Large product images (>2MB) may slow the import step.
  Images are downloaded sequentially (not parallel) to avoid memory spikes.

---

## Learnings

**2025-03-09 — Selector discovery on first live test (Kirkland Daily Multi #416076)**
- Costco migrated from `[automation-id]` attributes to a MUI (Material UI) component library.
  No `automation-id` attributes exist on current pages.
- **Name**: `h1` — reliable, confirmed working.
- **Price**: First MUI element matching `/^\$[0-9]/` with text length < 20. Returns "$19.99" correctly.
- **Item #**: `document.body.innerText.match(/Item\s*#?\s*([0-9]{6,})/)` — confirmed "#416076" from body text.
- **Images**: `img[src*="bfasset.costco-static.com"]` filtered by `/__[0-9]/` in path — returns 3 product shots (no icons).
  Strip query string, append `?auto=webp&format=jpg&width=1024&height=1024&fit=bounds&canvas=1024,1024` for full-res.
- **Features**: `.MuiListItemText-root` — returns bullet points ("Multivitamin with Calcium and Vitamin D", etc.)
- **Specs**: `table tr` inside the expanded Specifications accordion.
- **Weight**: Not present on all products — regex scan on body text for "Weight: N lb/oz" may work for some.
- **Accordion expansion**: Must click `[class*="MuiAccordion"] button[aria-expanded="false"]` and wait 1.5s
  before specs are in the DOM.
- **Page load gate**: Use `waitForSelector('h1')` (not `[automation-id="product-Title"]`).

