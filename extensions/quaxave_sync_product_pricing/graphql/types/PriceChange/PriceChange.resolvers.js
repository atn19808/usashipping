'use strict';

const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports = {
  Query: {
    pendingPriceChanges: async () => {
      const client = await pool.connect();
      try {
        const { rows } = await client.query(
          `SELECT id, sku, source, product_name, scraped_price, current_price,
                  sheet_price, costco_url, status, scraped_at, resolved_at
             FROM product_price_pending
            WHERE status = 'pending'
            ORDER BY scraped_at DESC`
        );
        return rows.map((r) => ({
          id: r.id,
          sku: r.sku,
          source: r.source,
          productName: r.product_name,
          scrapedPrice: r.scraped_price !== null ? parseFloat(r.scraped_price) : null,
          currentPrice: r.current_price !== null ? parseFloat(r.current_price) : null,
          sheetPrice: r.sheet_price !== null ? parseFloat(r.sheet_price) : null,
          costcoUrl: r.costco_url,
          status: r.status,
          scrapedAt: r.scraped_at ? r.scraped_at.toISOString() : null,
          resolvedAt: r.resolved_at ? r.resolved_at.toISOString() : null,
          delta:
            r.scraped_price !== null && r.current_price !== null
              ? parseFloat((parseFloat(r.scraped_price) - parseFloat(r.current_price)).toFixed(4))
              : null,
          deltaPercent:
            r.scraped_price !== null && r.current_price !== null && parseFloat(r.current_price) !== 0
              ? parseFloat(
                  (
                    ((parseFloat(r.scraped_price) - parseFloat(r.current_price)) /
                      parseFloat(r.current_price)) *
                    100
                  ).toFixed(2)
                )
              : null
        }));
      } finally {
        client.release();
      }
    }
  }
};
