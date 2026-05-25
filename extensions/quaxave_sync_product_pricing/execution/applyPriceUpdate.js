'use strict';

/**
 * Execution: Apply Price Update to EverShop Store
 * Directive ref: directives/sync_product_prices.md — (called by approvePriceChange API)
 *
 * Updates the product price directly in the database and marks the pending record
 * as approved. Uses direct SQL for performance (no full updateProduct service overhead
 * for a bulk price sync operation).
 *
 * @param {number[]} pendingIds  IDs from product_price_pending to approve
 * @returns {Promise<{ approved: number, failed: number }>}
 */

const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

async function applyPriceUpdate(pendingIds) {
  if (!pendingIds || pendingIds.length === 0) return { approved: 0, failed: 0 };

  const client = await pool.connect();
  let approved = 0;
  let failed = 0;

  try {
    await client.query('BEGIN');

    for (const id of pendingIds) {
      try {
        // Fetch the pending record
        const { rows } = await client.query(
          `SELECT sku, scraped_price FROM product_price_pending WHERE id=$1 AND status='pending'`,
          [id]
        );
        if (rows.length === 0) {
          console.warn(`[applyPriceUpdate] Pending record ${id} not found or already resolved`);
          failed++;
          continue;
        }

        const { sku, scraped_price } = rows[0];

        // Update the product price
        const update = await client.query(
          `UPDATE product SET price=$1, updated_at=NOW() WHERE sku=$2 RETURNING uuid`,
          [scraped_price, sku]
        );
        if (update.rowCount === 0) {
          console.warn(`[applyPriceUpdate] Product SKU "${sku}" not found in store`);
          failed++;
          continue;
        }

        // Mark pending record as approved
        await client.query(
          `UPDATE product_price_pending SET status='approved', resolved_at=NOW() WHERE id=$1`,
          [id]
        );

        console.log(`[applyPriceUpdate] Approved SKU ${sku} → $${scraped_price}`);
        approved++;
      } catch (err) {
        console.error(`[applyPriceUpdate] Failed for pending ID ${id}: ${err.message}`);
        failed++;
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { approved, failed };
}

module.exports = applyPriceUpdate;
