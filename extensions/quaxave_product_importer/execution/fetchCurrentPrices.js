'use strict';

/**
 * Execution: Fetch Current Prices from Costco
 * Directive ref: directives/check_costco_prices.md — Step 2
 *
 * Scrapes the live price for each product by reusing scrapeProductPage.js.
 * Products are processed in batches to avoid bot detection.
 *
 * @param {Array<{rowIndex: number, name: string, category: string|null, link: string, sheetPrice: number|null}>} products
 * @param {object} [options]
 * @param {number} [options.batchSize=3]
 * @param {number} [options.batchDelayMs=8000]
 * @returns {Promise<Array<{
 *   rowIndex: number,
 *   name: string,
 *   category: string|null,
 *   link: string,
 *   sheetPrice: number|null,
 *   livePrice: number|null,
 *   itemNumber: string|null,
 *   scrapeError: string|null
 * }>>}
 */

const scrapeProductPage = require('./scrapeProductPage');

async function fetchCurrentPrices(products, { batchSize = 3, batchDelayMs = 8000 } = {}) {
  const results = [];
  const totalBatches = Math.ceil(products.length / batchSize);

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`\n[fetchCurrentPrices] Batch ${batchNum}/${totalBatches} — ${batch.length} products`);

    for (const product of batch) {
      console.log(`  [row ${product.rowIndex}] ${product.name}`);
      console.log(`    URL: ${product.link}`);

      let livePrice = null;
      let itemNumber = null;
      let scrapeError = null;

      try {
        const scraped = await scrapeProductPage(product.link);
        livePrice = scraped.price;
        itemNumber = scraped.itemNumber || null;

        if (livePrice !== null) {
          console.log(`    Live price: $${livePrice}`);
        } else {
          console.log(`    Live price: (not found)`);
          scrapeError = 'Price not found on page — product may be members-only, out of stock, or selectors drifted';
        }
      } catch (err) {
        scrapeError = err.message;
        console.log(`    ERROR: ${scrapeError}`);
      }

      results.push({
        ...product,
        livePrice,
        itemNumber,
        scrapeError
      });
    }

    // Delay between batches (skip after the last batch)
    if (i + batchSize < products.length) {
      console.log(`\n[fetchCurrentPrices] Waiting ${batchDelayMs / 1000}s before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    }
  }

  return results;
}

module.exports = fetchCurrentPrices;
