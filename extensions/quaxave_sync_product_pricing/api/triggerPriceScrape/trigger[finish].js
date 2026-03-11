'use strict';

/**
 * API Handler: Manually Trigger Price Scrape Job
 *
 * POST /triggerPriceScrape
 *
 * Fires the scrape job in the background and returns immediately.
 * PRICE_SYNC_ENABLED must be 'true' in env for the job to run.
 */

const { OK, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const scrapeAndStagePrices = require('../../jobs/scrapeAndStagePrices');

module.exports = async (request, response, delegate, next) => {
  if (process.env.PRICE_SYNC_ENABLED !== 'true') {
    response.$body = { error: { status: 403, message: 'PRICE_SYNC_ENABLED is not set to "true"' } };
    response.status(403);
    return next();
  }

  // Fire and forget — do not await
  scrapeAndStagePrices().catch((err) => {
    console.error('[triggerPriceScrape] Background job error:', err.message);
  });

  response.$body = { data: { message: 'Scrape job started in background. Check logs for progress.' } };
  response.status(OK);
  next();
};
