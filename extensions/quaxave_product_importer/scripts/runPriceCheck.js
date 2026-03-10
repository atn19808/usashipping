#!/usr/bin/env node
'use strict';

/**
 * Runner: Check Costco Prices Against Google Sheet
 * Directive: directives/check_costco_prices.md
 *
 * Usage (from project root `usashipping/`):
 *   node extensions/quaxave_product_importer/scripts/runPriceCheck.js
 *
 * Optional env vars:
 *   SPREADSHEET_ID      Override the default spreadsheet ID
 *   SHEET_RANGE         Override the sheet range (default: Costco!A:Z)
 *   OUTPUT_DIR          Override output directory (default: .temp)
 *   BATCH_SIZE          Products per scraping batch (default: 3)
 *   BATCH_DELAY_MS      Delay between batches in ms (default: 8000)
 *   SERVICE_ACCOUNT_KEY Path to Google service account JSON
 */

const path = require('path');

// Project root is three levels up from this script
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

const readSpreadsheet = require('../execution/readSpreadsheet');
const fetchCurrentPrices = require('../execution/fetchCurrentPrices');
const generatePriceReport = require('../execution/generatePriceReport');

const CONFIG = {
  spreadsheetId: process.env.SPREADSHEET_ID || '1fxkYVfTY-3gz_KbJgcUT0Ul8hoqj18vJHYNN6trZp-I',
  sheetRange: process.env.SHEET_RANGE || 'Costco!A:Z',
  serviceAccountKeyFile: process.env.SERVICE_ACCOUNT_KEY
    || path.join(PROJECT_ROOT, 'config', 'costco-price-service-account.json'),
  outputDir: process.env.OUTPUT_DIR
    || path.join(PROJECT_ROOT, '.temp'),
  batchSize: parseInt(process.env.BATCH_SIZE || '3', 10),
  batchDelayMs: parseInt(process.env.BATCH_DELAY_MS || '8000', 10)
};

async function run() {
  console.log('='.repeat(72));
  console.log('  Costco Price Check');
  console.log('='.repeat(72));
  console.log(`  Spreadsheet : ${CONFIG.spreadsheetId}`);
  console.log(`  Sheet range : ${CONFIG.sheetRange}`);
  console.log(`  Batch size  : ${CONFIG.batchSize} (${CONFIG.batchDelayMs}ms delay between batches)`);
  console.log(`  Output dir  : ${CONFIG.outputDir}`);
  console.log('='.repeat(72));
  console.log('');

  // ── Step 1: Read spreadsheet ────────────────────────────────────────────────
  console.log('STEP 1 — Reading Google Sheet...');
  const products = await readSpreadsheet({
    spreadsheetId: CONFIG.spreadsheetId,
    serviceAccountKeyFile: CONFIG.serviceAccountKeyFile,
    sheetRange: CONFIG.sheetRange
  });

  if (products.length === 0) {
    console.log('\nNo valid products found in spreadsheet. Exiting.');
    process.exit(0);
  }

  console.log(`\nFound ${products.length} products to check.\n`);

  // ── Step 2: Scrape live prices ─────────────────────────────────────────────
  console.log('STEP 2 — Fetching current prices from Costco...');
  const enrichedProducts = await fetchCurrentPrices(products, {
    batchSize: CONFIG.batchSize,
    batchDelayMs: CONFIG.batchDelayMs
  });

  // ── Step 3: Generate report ────────────────────────────────────────────────
  console.log('\nSTEP 3 — Generating price report...');
  const { jsonPath, mdPath, summary } = generatePriceReport(enrichedProducts, {
    outputDir: CONFIG.outputDir,
    spreadsheetId: CONFIG.spreadsheetId
  });

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(72));
  console.log('  RESULTS');
  console.log('='.repeat(72));
  console.log(`  Total products  : ${summary.totalProducts}`);
  console.log(`  Matched         : ${summary.matched}`);
  console.log(`  Increased       : ${summary.increased}`);
  console.log(`  Decreased       : ${summary.decreased}`);
  console.log(`  No sheet price  : ${summary.noSheetPrice}`);
  console.log(`  Scrape failed   : ${summary.scrapeFailed}`);
  console.log('');
  console.log(`  JSON : ${jsonPath}`);
  console.log(`  MD   : ${mdPath}`);
  console.log('='.repeat(72));
}

run().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
