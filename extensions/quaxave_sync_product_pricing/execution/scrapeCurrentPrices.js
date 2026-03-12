'use strict';

/**
 * Execution: Scrape Current Prices
 * Directive ref: directives/sync_product_prices.md — Step 2
 *
 * Reuses the verified Puppeteer scraper from quaxave_product_importer.
 * Processes products in batches to avoid bot-detection rate limits.
 *
 * @param {Array<{rowIndex,name,link,sheetPrice,source}>} products
 * @param {object} [options]
 * @param {number} [options.batchSize=3]
 * @param {number} [options.batchDelayMs=8000]
 * @returns {Promise<Array<{...product, livePrice, itemNumber, scrapeError}>>}
 */

const scrapeProductPage = require('../../quaxave_product_importer/execution/scrapeProductPage');

async function scrapeCurrentPrices(products, { batchSize = 2, batchDelayMs = 30000 } = {}) {
  const results = [];
  const totalBatches = Math.ceil(products.length / batchSize);

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`\n[scrapeCurrentPrices] Batch ${batchNum}/${totalBatches} (${batch.length} items)`);

    for (const product of batch) {
      console.log(`  [${product.source} row ${product.rowIndex}] ${product.name}`);

      let livePrice = null;
      let itemNumber = null;
      let scrapeError = null;

      try {
        const scraped = await scrapeProductPage(product.link);
        livePrice = scraped.price;
        itemNumber = scraped.itemNumber || null;

        if (livePrice !== null) {
          console.log(`    → $${livePrice}${product.sheetPrice ? ` (sheet: $${product.sheetPrice})` : ''}`);
        } else {
          scrapeError = 'Price not found — product may be out of stock, members-only, or selectors drifted';
          console.log(`    → price not found`);
        }
      } catch (err) {
        scrapeError = err.message;
        console.log(`    → ERROR: ${scrapeError}`);
      }

      results.push({ ...product, livePrice, itemNumber, scrapeError });
    }

    if (i + batchSize < products.length) {
      console.log(`\n[scrapeCurrentPrices] Waiting ${batchDelayMs / 1000}s...`);
      await new Promise((r) => setTimeout(r, batchDelayMs));
    }
  }

  return results;
}

module.exports = scrapeCurrentPrices;
