const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS product_price_pending (
      id          SERIAL PRIMARY KEY,
      sku         VARCHAR(255) NOT NULL,
      source      VARCHAR(50)  NOT NULL,
      product_name VARCHAR(500),
      scraped_price  NUMERIC(12, 4),
      current_price  NUMERIC(12, 4),
      sheet_price    NUMERIC(12, 4),
      costco_url     TEXT,
      status      VARCHAR(20) NOT NULL DEFAULT 'pending',
      scraped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )`
  );

  // Only one pending record per SKU+source at a time
  await execute(
    connection,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_price_pending_active
     ON product_price_pending (sku, source)
     WHERE status = 'pending'`
  );

  await execute(
    connection,
    `CREATE INDEX IF NOT EXISTS idx_price_pending_status
     ON product_price_pending (status, scraped_at DESC)`
  );
};
