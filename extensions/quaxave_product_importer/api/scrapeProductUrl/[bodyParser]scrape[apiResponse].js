/**
 * Directive: import_costco_product — Steps 1 & 2
 * Validates the URL (Step 1) then scrapes the product page (Step 2).
 */
const {
  OK,
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const validateDirective = require('../../execution/validateDirective');
const scrapeProductPage = require('../../execution/scrapeProductPage');

module.exports = async (request, response, delegate, next) => {
  const { url } = request.body || {};

  // Step 1 — Validate directive inputs
  try {
    validateDirective(url);
  } catch (e) {
    response.status(INVALID_PAYLOAD);
    response.$body = { error: { status: INVALID_PAYLOAD, message: e.message } };
    return next();
  }

  // Step 2 — Scrape product page
  try {
    const productData = await scrapeProductPage(url);
    response.status(OK);
    response.$body = { data: productData };
    next();
  } catch (e) {
    console.error('[scrapeProductUrl] scrape failed:', e.message);
    response.status(INTERNAL_SERVER_ERROR);
    response.$body = { error: { status: INTERNAL_SERVER_ERROR, message: e.message || 'Scrape failed' } };
    next();
  }
};
