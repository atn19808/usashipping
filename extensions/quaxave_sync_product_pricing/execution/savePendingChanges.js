'use strict';

/**
 * Execution: Save Pending Price Changes
 * Directive ref: directives/sync_product_prices.md — Step 4
 *
 * For each product where the live price differs from the current EverShop price,
 * upserts a 'pending' record into product_price_pending. The partial unique index
 * ensures only one pending record per (sku, source) at any time — a fresh scrape
 * replaces the old pending record.
 *
 * Products with scrape errors or no itemNumber are silently skipped.
 *
 * @param {Array} scrapedProducts  Enriched products from scrapeCurrentPrices
 * @param {Object} storeMap        Result from matchProductsInStore: { [sku]: { uuid, currentPrice } }
 * @returns {Promise<{ staged: number, skipped: number, errors: number }>}
 */

const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

async function savePendingChanges(scrapedProducts, storeMap) {
  let staged = 0;
  let skipped = 0;
  let errors = 0;

  const client = await pool.connect();
  try {
    for (const product of scrapedProducts) {
      const sku = product.itemNumber;

      // Skip: no SKU, scrape failed, or price not available
      if (!sku || product.livePrice === null || product.scrapeError) {
        skipped++;
        continue;
      }

      // Skip: product not yet in EverShop (not imported)
      const storeProduct = storeMap[sku];
      if (!storeProduct) {
        skipped++;
        continue;
      }

      // Skip: price has not changed
      if (Math.abs(product.livePrice - storeProduct.currentPrice) < 0.005) {
        skipped++;
        continue;
      }

      try {
        // Delete any existing pending record for this sku+source, then insert fresh one.
        // (Cannot use ON CONFLICT UPDATE on a partial index directly in all PG versions.)
        await client.query(
          `DELETE FROM product_price_pending WHERE sku=$1 AND source=$2 AND status='pending'`,
          [sku, product.source]
        );
        await client.query(
          `INSERT INTO product_price_pending
             (sku, source, product_name, scraped_price, current_price, sheet_price, costco_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sku,
            product.source,
            product.name,
            product.livePrice,
            storeProduct.currentPrice,
            product.sheetPrice,
            product.link
          ]
        );
        staged++;
        console.log(
          `[savePendingChanges] Staged ${product.source} SKU ${sku}: $${storeProduct.currentPrice} → $${product.livePrice}`
        );
      } catch (err) {
        errors++;
        console.error(`[savePendingChanges] Failed to stage SKU ${sku}: ${err.message}`);
      }
    }
  } finally {
    client.release();
  }

  console.log(`[savePendingChanges] Done — staged: ${staged}, skipped: ${skipped}, errors: ${errors}`);
  return { staged, skipped, errors };
}

module.exports = savePendingChanges;
