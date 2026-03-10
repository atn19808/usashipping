'use strict';

/**
 * Execution: Validate Directive Inputs
 * Directive ref: directives/import_costco_product.md — Step 1
 *
 * @param {string} url
 * @returns {{ valid: true }}
 * @throws {Error} with descriptive message on validation failure
 */
function validateDirective(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('url is required');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!parsed.hostname.endsWith('costco.com')) {
    throw new Error('Only costco.com URLs are accepted');
  }

  return { valid: true };
}

module.exports = validateDirective;
