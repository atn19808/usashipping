'use strict';

const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');

module.exports = {
  Query: {
    pendingPriceChanges: async () => {
      const { rows } = await pool.query(
        `SELECT id, sku, source, product_name, scraped_price, current_price,
                sheet_price, costco_url, status, scraped_at, resolved_at
           FROM product_price_pending
          WHERE status = 'pending'
          ORDER BY scraped_at DESC`
      );
      return rows.map((r) => {
        const row = camelCase(r);
        const scraped = r.scraped_price !== null ? parseFloat(r.scraped_price) : null;
        const current = r.current_price !== null ? parseFloat(r.current_price) : null;
        return {
          ...row,
          scrapedPrice: scraped,
          currentPrice: current,
          sheetPrice: r.sheet_price !== null ? parseFloat(r.sheet_price) : null,
          scrapedAt: r.scraped_at ? r.scraped_at.toISOString() : null,
          resolvedAt: r.resolved_at ? r.resolved_at.toISOString() : null,
          delta: scraped !== null && current !== null
            ? parseFloat((scraped - current).toFixed(4)) : null,
          deltaPercent: scraped !== null && current !== null && current !== 0
            ? parseFloat(((scraped - current) / current * 100).toFixed(2)) : null,
        };
      });
    }
  }
};
