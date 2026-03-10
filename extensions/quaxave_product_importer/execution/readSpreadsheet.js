'use strict';

/**
 * Execution: Read Spreadsheet
 * Directive ref: directives/check_costco_prices.md — Step 1
 *
 * Reads all products from the Costco tracking Google Sheet and returns
 * structured product records with name, link, category, and sheet price.
 *
 * @param {object} config
 * @param {string} config.spreadsheetId
 * @param {string} config.serviceAccountKeyFile  Absolute path to service account JSON
 * @param {string} [config.sheetRange='Costco!A:Z']
 * @returns {Promise<Array<{
 *   rowIndex: number,
 *   name: string,
 *   category: string|null,
 *   link: string,
 *   sheetPrice: number|null
 * }>>}
 */

const { google } = require('googleapis');

async function readSpreadsheet({
  spreadsheetId,
  serviceAccountKeyFile,
  sheetRange = 'Costco!A:Z'
}) {
  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountKeyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetRange
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    throw new Error(`No data found in spreadsheet range: ${sheetRange}`);
  }

  const headers = rows[0].map((h) => (h || '').trim());
  const dataRows = rows.slice(1);

  // Locate columns by header name (case-insensitive)
  const nameCol = headers.findIndex((h) => h.toLowerCase() === 'name');
  const categoryCol = headers.findIndex((h) => h.toLowerCase() === 'category');

  // Price column: "Price" or "Our Price" — take the first match
  const priceCol = headers.findIndex((h) =>
    h.toLowerCase() === 'price' || h.toLowerCase() === 'our price'
  );

  // Link column: if multiple, use the rightmost one (consistent with prior usage)
  const linkColCandidates = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.toLowerCase() === 'link');
  const linkCol = linkColCandidates.length > 0
    ? linkColCandidates[linkColCandidates.length - 1].i
    : -1;

  if (nameCol === -1) throw new Error('Could not find a "Name" column in the spreadsheet headers');
  if (linkCol === -1) throw new Error('Could not find a "Link" column in the spreadsheet headers');

  console.log(`[readSpreadsheet] Headers: ${JSON.stringify(headers)}`);
  console.log(`[readSpreadsheet] nameCol=${nameCol}, linkCol=${linkCol}, categoryCol=${categoryCol}, priceCol=${priceCol}`);

  const products = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowIndex = i + 2; // 1-based, offset by header row

    const name = (row[nameCol] || '').trim();
    const link = (row[linkCol] || '').trim();

    // Skip rows missing name or a valid Costco URL
    if (!name || !link) continue;
    if (!link.startsWith('https://') || !link.includes('costco.com')) continue;

    const category = categoryCol !== -1 ? (row[categoryCol] || '').trim() || null : null;

    let sheetPrice = null;
    if (priceCol !== -1 && row[priceCol]) {
      const raw = String(row[priceCol]).replace(/[$,]/g, '').trim();
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) sheetPrice = parsed;
    }

    products.push({ rowIndex, name, category, link, sheetPrice });
  }

  console.log(`[readSpreadsheet] ${products.length} valid products found (out of ${dataRows.length} data rows)`);
  return products;
}

module.exports = readSpreadsheet;
