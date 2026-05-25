'use strict';

/**
 * Execution: Write Scraped Prices back to Google Sheet
 *
 * Writes the livePrice result for each scraped row into the "Scraped Price"
 * and "Last Updated" columns, and applies background color formatting:
 *   - Green  — price found, matches sheet price
 *   - Yellow — price found, differs from sheet price (candidate for update)
 *   - Red    — page loaded but no price (members-only, out of stock)
 *   - No-op  — connection/proxy error (don't overwrite the last good value)
 *
 * @param {object} config
 * @param {string} config.spreadsheetId
 * @param {string} config.sheetName
 * @param {string} config.serviceAccountKeyFile
 * @param {Array}  config.results  — items from scrapeCurrentPrices filtered to this source
 */

const { google } = require('googleapis');

async function writeScrapedPrices({ spreadsheetId, sheetName, serviceAccountKeyFile, results }) {
  let authOptions;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8')
    );
    authOptions = { credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
  } else {
    authOptions = { keyFile: serviceAccountKeyFile, scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  const sheets = google.sheets({ version: 'v4', auth });

  // Read header row to locate column indices by name
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`
  });
  const headers = (headerRes.data.values?.[0] || []).map((h) => (h || '').trim().toLowerCase());

  const scrapedPriceCol = headers.findIndex((h) => h === 'scraped price');
  const lastUpdatedCol  = headers.findIndex((h) => h === 'last updated');

  if (scrapedPriceCol === -1) {
    console.warn(`[writeScrapedPrices] No "Scraped Price" column in "${sheetName}" — skipping write-back`);
    return;
  }

  // Get the numeric sheetId needed for formatting requests
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const sheetMeta = meta.data.sheets.find((s) => s.properties.title === sheetName);
  if (!sheetMeta) {
    console.warn(`[writeScrapedPrices] Sheet "${sheetName}" not found in spreadsheet`);
    return;
  }
  const sheetId = sheetMeta.properties.sheetId;

  const today = new Date().toLocaleDateString('en-US'); // e.g. "3/15/2026"
  const valueData = [];
  const formatRequests = [];

  for (const result of results) {
    // Skip rows where the request itself failed (proxy/connection error) —
    // we have no valid new data, so don't clobber the previous scraped value.
    // "Price not found" and "Members-only" are deliberate outcomes — do write those.
    const isConnectionError = result.scrapeError &&
      result.livePrice === null &&
      !result.scrapeError.startsWith('Price not found') &&
      !result.scrapeError.startsWith('Members-only');
    if (isConnectionError) continue;

    const rowNum = result.rowIndex; // 1-based sheet row
    const rowIdx = rowNum - 1;     // 0-based for Sheets API formatting

    // Write the scraped price value:
    //   numeric  — price found
    //   "Sign In" — members-only page (requires login to see price)
    //   "N/A"    — page loaded but no price (out of stock, warehouse-only)
    let scrapedValue;
    if (result.livePrice !== null) {
      scrapedValue = result.livePrice;
    } else if (result.membersOnly) {
      scrapedValue = 'Sign In';
    } else {
      scrapedValue = 'N/A';
    }

    valueData.push({
      range: `${sheetName}!${colLetter(scrapedPriceCol + 1)}${rowNum}`,
      values: [[scrapedValue]]
    });

    // Write last-updated date if the column exists
    if (lastUpdatedCol !== -1) {
      valueData.push({
        range: `${sheetName}!${colLetter(lastUpdatedCol + 1)}${rowNum}`,
        values: [[today]]
      });
    }

    // Determine background color
    let bg;
    if (result.livePrice === null) {
      // Page loaded but no price visible (members-only, unavailable)
      bg = { red: 0.957, green: 0.780, blue: 0.780 }; // light red
    } else if (result.sheetPrice !== null && Math.abs(result.livePrice - result.sheetPrice) > 0.01) {
      // Price found but differs from what's in the sheet
      bg = { red: 1.0, green: 0.949, blue: 0.800 }; // yellow
    } else {
      // Price matches sheet (or no sheet price to compare)
      bg = { red: 0.718, green: 0.882, blue: 0.804 }; // green
    }

    formatRequests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: rowIdx,
          endRowIndex: rowIdx + 1,
          startColumnIndex: scrapedPriceCol,
          endColumnIndex: scrapedPriceCol + 1
        },
        cell: { userEnteredFormat: { backgroundColor: bg } },
        fields: 'userEnteredFormat.backgroundColor'
      }
    });
  }

  if (valueData.length === 0) {
    console.log(`[writeScrapedPrices] "${sheetName}": nothing to write`);
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'USER_ENTERED', data: valueData }
  });

  if (formatRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests }
    });
  }

  const written = formatRequests.length;
  console.log(`[writeScrapedPrices] "${sheetName}": wrote ${written} row(s)`);
}

/** Convert 1-based column number to A1 letter (1→A, 27→AA, etc.) */
function colLetter(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

module.exports = writeScrapedPrices;
