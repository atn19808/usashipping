'use strict';

/**
 * API Handler: Dismiss Price Change(s)
 * Directive ref: directives/sync_product_prices.md
 *
 * POST /dismissPriceChange
 * Body: { ids: number[] }
 *
 * Marks pending price records as 'dismissed' — no product price change occurs.
 */

const { OK, INVALID_PAYLOAD, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports = async (request, response, delegate, next) => {
  const { ids } = request.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    response.$body = { error: { status: 422, message: '`ids` must be a non-empty array' } };
    response.status(INVALID_PAYLOAD);
    return next();
  }

  const pendingIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (pendingIds.length === 0) {
    response.$body = { error: { status: 422, message: 'No valid integer IDs provided' } };
    response.status(INVALID_PAYLOAD);
    return next();
  }

  try {
    const result = await pool.query(
      `UPDATE product_price_pending
          SET status='dismissed', resolved_at=NOW()
        WHERE id = ANY($1) AND status='pending'
        RETURNING id`,
      [pendingIds]
    );
    const dismissed = result.rowCount;
    const skipped = pendingIds.length - dismissed;
    console.log(`[dismissPriceChange] Dismissed: ${dismissed}, skipped (already resolved): ${skipped}`);
    response.$body = { data: { dismissed, skipped } };
    response.status(OK);
    next();
  } catch (err) {
    console.error('[dismissPriceChange] Unexpected error:', err.message);
    response.$body = { error: { status: 500, message: err.message } };
    response.status(INTERNAL_SERVER_ERROR);
    next();
  }
};
