'use strict';

/**
 * API Handler: Manually Trigger Price Scrape Job
 *
 * POST /triggerPriceScrape
 *
 * Fires the scrape job in the background and returns immediately.
 * PRICE_SYNC_ENABLED must be 'true' in env for the job to run.
 */

const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const scrapeAndStagePrices = require('../../jobs/scrapeAndStagePrices');

module.exports = async (request, response, delegate, next) => {
  console.log('[triggerPriceScrape] Handler called, PRICE_SYNC_ENABLED =', process.env.PRICE_SYNC_ENABLED);

  if (process.env.PRICE_SYNC_ENABLED !== 'true') {
    response.$body = { error: { status: 403, message: 'PRICE_SYNC_ENABLED is not set to "true"' } };
    response.status(403);
    return next();
  }

  const retryFailedOnly = request.query.retryFailed === 'true';

  // Fire and forget — do not await
  scrapeAndStagePrices({ retryFailedOnly }).catch((err) => {
    console.error('[triggerPriceScrape] Background job error:', err.message);
  });

  const modeMsg = retryFailedOnly ? 'Retry-failed scrape job started' : 'Scrape job started';
  response.$body = { data: { message: `${modeMsg} in background. Check logs for progress.` } };
  response.status(OK);
  next();
};
