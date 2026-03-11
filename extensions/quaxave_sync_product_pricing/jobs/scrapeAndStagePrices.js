'use strict';

require('dotenv').config();

/**
 * Job: Scrape and Stage Price Changes
 * Directive ref: directives/sync_product_prices.md — Steps 1–4
 *
 * Scheduled daily. Reads price sheets, scrapes live prices, matches store products,
 * and stages pending changes for admin review.
 */

const path = require('path');

const readPriceSheet     = require('../execution/readPriceSheet');
const scrapeCurrentPrices = require('../execution/scrapeCurrentPrices');
const matchProductsInStore = require('../execution/matchProductsInStore');
const savePendingChanges  = require('../execution/savePendingChanges');

module.exports = async function scrapeAndStagePrices() {
  if (process.env.PRICE_SYNC_ENABLED !== 'true') {
    console.log('[scrapeAndStagePrices] PRICE_SYNC_ENABLED is not "true" — skipping');
    return;
  }

  const serviceAccountKeyFile = path.resolve(
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/costco-price-service-account.json'
  );

  console.log('[scrapeAndStagePrices] Starting price sync job');

  // Step 1 — Read price sheets (Costco + Walmart)
  const sheetConfigs = [
    {
      spreadsheetId: process.env.COSTCO_SHEET_ID,
      sheetName: process.env.COSTCO_SHEET_NAME || 'Costco',
      source: 'costco'
    },
    {
      spreadsheetId: process.env.WALMART_SHEET_ID,
      sheetName: process.env.WALMART_SHEET_NAME || 'Walmart',
      source: 'walmart'
    }
  ].filter((c) => c.spreadsheetId); // skip if env var not set

  let allProducts = [];
  for (const config of sheetConfigs) {
    try {
      const products = await readPriceSheet({ ...config, serviceAccountKeyFile });
      allProducts = allProducts.concat(products);
    } catch (err) {
      console.error(`[scrapeAndStagePrices] Failed to read "${config.sheetName}": ${err.message}`);
    }
  }

  if (allProducts.length === 0) {
    console.log('[scrapeAndStagePrices] No products to scrape — exiting');
    return;
  }

  console.log(`[scrapeAndStagePrices] Total products to scrape: ${allProducts.length}`);

  // Step 2 — Scrape live prices
  const scraped = await scrapeCurrentPrices(allProducts);

  const successful = scraped.filter((p) => p.livePrice !== null);
  const failed     = scraped.filter((p) => p.livePrice === null);
  console.log(`\n[scrapeAndStagePrices] Scraped: ${successful.length} ok, ${failed.length} failed`);

  // Step 3 — Match scraped item numbers to EverShop SKUs
  const skus = [...new Set(scraped.map((p) => p.itemNumber).filter(Boolean))];
  const storeMap = await matchProductsInStore(skus);

  // Step 4 — Stage pending price changes
  const summary = await savePendingChanges(scraped, storeMap);

  console.log(`\n[scrapeAndStagePrices] Job complete — staged: ${summary.staged}, skipped: ${summary.skipped}, errors: ${summary.errors}`);
};
