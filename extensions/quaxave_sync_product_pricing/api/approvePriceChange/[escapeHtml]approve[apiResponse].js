'use strict';

/**
 * API Handler: Approve Price Change(s)
 * Directive ref: directives/sync_product_prices.md
 *
 * POST /approvePriceChange
 * Body: { ids: number[] }
 *
 * Applies each pending price to the EverShop product table
 * and marks the pending record as approved.
 */

const { OK, INVALID_PAYLOAD, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const applyPriceUpdate = require('../../execution/applyPriceUpdate');

module.exports = async (request, response, delegate, next) => {
  const { ids } = request.body || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    response.$body = { error: { status: 422, message: '`ids` must be a non-empty array' } };
    response.status(INVALID_PAYLOAD);
    return next();
  }

  // Ensure all ids are integers
  const pendingIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (pendingIds.length === 0) {
    response.$body = { error: { status: 422, message: 'No valid integer IDs provided' } };
    response.status(INVALID_PAYLOAD);
    return next();
  }

  try {
    const result = await applyPriceUpdate(pendingIds);
    response.$body = { data: result };
    response.status(OK);
    next();
  } catch (err) {
    console.error('[approvePriceChange] Unexpected error:', err.message);
    response.$body = { error: { status: 500, message: err.message } };
    response.status(INTERNAL_SERVER_ERROR);
    next();
  }
};
