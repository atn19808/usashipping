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
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const range = `${sheetName}!A:Z`;

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = response.data.values;

  if (!rows || rows.length < 2) {
    console.warn(`[readPriceSheet] No data in "${sheetName}" tab`);
    return [];
  }

  const headers = rows[0].map((h) => (h || '').trim().toLowerCase());

  const nameCol  = headers.findIndex((h) => h === 'name');
  const priceCol = headers.findIndex((h) => h === 'price' || h === 'our price');
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

    products.push({
      rowIndex: i + 1, // 1-based sheet row (header is row 1)
      name,
      link,
      sheetPrice,
      source
    });
  }

  console.log(`[readPriceSheet] "${sheetName}": ${products.length} products`);
  return products;
}

module.exports = readPriceSheet;
