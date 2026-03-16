'use strict';

/**
 * Execution: Read Price Sheet
 * Directive ref: directives/sync_product_prices.md — Step 1
 *
 * Reads Costco and Walmart tabs from Google Sheets. Supports any URL (not just costco.com)
 * so the same script handles both vendors.
 *
 * @param {object} config
 * @param {string} config.spreadsheetId
 * @param {string} config.serviceAccountKeyFile
 * @param {string} config.sheetName            Tab name (e.g. "Costco" or "Walmart")
 * @param {string} config.source               'costco' | 'walmart'
 * @returns {Promise<Array<{
 *   rowIndex: number,
 *   name: string,
 *   link: string,
 *   sheetPrice: number|null,
 *   source: string
 * }>>}
 */

const { google } = require('googleapis');

async function readPriceSheet({ spreadsheetId, serviceAccountKeyFile, sheetName, source }) {
  // Prefer env var (base64-encoded JSON) so the key file doesn't need to be on disk in production.
  // Set GOOGLE_SERVICE_ACCOUNT_JSON in Azure App Configuration as:
  //   base64(cat config/costco-price-service-account.json)
  let authOptions;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8')
    );
    authOptions = { credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] };
  } else {
    authOptions = { keyFile: serviceAccountKeyFile, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] };
  }

  const auth = new google.auth.GoogleAuth(authOptions);

  const sheets = google.sheets({ version: 'v4', auth });
  const range = `${sheetName}!A:Z`;

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = response.data.values;

  if (!rows || rows.length < 2) {
    console.warn(`[readPriceSheet] No data in "${sheetName}" tab`);
    return [];
  }

  const headers = rows[0].map((h) => (h || '').trim().toLowerCase());

  const nameCol         = headers.findIndex((h) => h === 'name');
  const priceCol        = headers.findIndex((h) => h === 'price' || h === 'our price');
  const scrapedPriceCol = headers.findIndex((h) => h === 'scraped price');
  // Use the rightmost "link" column (sheet may have multiple)
  const linkCol  = headers.map((h, i) => ({ h, i }))
    .filter(({ h }) => h === 'link')
    .map(({ i }) => i)
    .at(-1) ?? -1;

  if (nameCol === -1) {
    throw new Error(`[readPriceSheet] No "Name" column found in "${sheetName}" tab`);
  }
  if (linkCol === -1) {
    throw new Error(`[readPriceSheet] No "Link" column found in "${sheetName}" tab`);
  }

  const products = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = (row[nameCol] || '').trim();
    const link = (row[linkCol] || '').trim();

    if (!name || !link || !link.startsWith('http')) continue;

    let sheetPrice = null;
    if (priceCol !== -1 && row[priceCol]) {
      const parsed = parseFloat(String(row[priceCol]).replace(/[$,]/g, ''));
      if (!isNaN(parsed)) sheetPrice = parsed;
    }

    let existingScrapedPrice = null;
    // null  = empty / never scraped / connection error (retry eligible)
    // 'ok'  = has a numeric price (skip on retry)
    // 'members-only' = "Sign In" sentinel written by scraper (skip on retry)
    // 'unavailable'  = "N/A" sentinel written by scraper (skip on retry)
    let scrapedPriceStatus = null;
    if (scrapedPriceCol !== -1 && row[scrapedPriceCol]) {
      const raw = String(row[scrapedPriceCol]).trim();
      const parsed = parseFloat(raw.replace(/[$,]/g, ''));
      if (!isNaN(parsed)) {
        existingScrapedPrice = parsed;
        scrapedPriceStatus = 'ok';
      } else if (/sign\s*in/i.test(raw)) {
        scrapedPriceStatus = 'members-only';
      } else if (/n\/a|unavailable/i.test(raw)) {
        scrapedPriceStatus = 'unavailable';
      }
    }

    products.push({
      rowIndex: i + 1, // 1-based sheet row (header is row 1)
      name,
      link,
      sheetPrice,
      existingScrapedPrice,
      scrapedPriceStatus,
      source
    });
  }

  console.log(`[readPriceSheet] "${sheetName}": ${products.length} products`);
  return products;
}

module.exports = readPriceSheet;
