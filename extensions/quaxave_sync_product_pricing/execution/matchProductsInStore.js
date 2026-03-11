'use strict';

/**
 * Execution: Match Products in EverShop Store
 * Directive ref: directives/sync_product_prices.md — Step 3
 *
 * Queries the EverShop product table to find which scraped products already exist
 * in the store (matched by Costco item # = product SKU).
 *
 * @param {string[]} skus  Array of Costco item numbers / SKUs to look up
 * @returns {Promise<Object.<string, { uuid: string, currentPrice: number }>>}
 *          Map of sku → { uuid, currentPrice }. Only matched products are included.
 */

const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

async function matchProductsInStore(skus) {
  if (!skus || skus.length === 0) return {};

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT uuid, sku, price FROM product WHERE sku = ANY($1)',
      [skus]
    );

    const map = {};
    for (const row of result.rows) {
      map[row.sku] = {
        uuid: row.uuid,
        currentPrice: parseFloat(row.price)
      };
    }

    console.log(`[matchProductsInStore] ${result.rows.length}/${skus.length} SKUs matched in store`);
    return map;
  } finally {
    client.release();
  }
}

module.exports = matchProductsInStore;
