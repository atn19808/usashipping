#!/usr/bin/env node
'use strict';

/**
 * Delete products by SKU (child rows cascade via FK ON DELETE CASCADE).
 *
 * Usage (from project root, Postgres up):
 *   node extensions/quaxave_product_importer/scripts/deleteProducts.cjs SKU1 SKU2 ...
 */

require('dotenv').config();
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  select,
  del,
  startTransaction,
  commit,
  rollback
} = require('@evershop/postgres-query-builder');

const skus = process.argv.slice(2).filter(Boolean);

async function run() {
  if (skus.length === 0) {
    console.error('No SKUs given. Usage: deleteProducts.cjs SKU1 SKU2 ...');
    process.exit(1);
  }
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    let deleted = 0;
    for (const sku of skus) {
      const p = await select()
        .from('product')
        .where('sku', '=', sku)
        .load(connection);
      if (!p) {
        console.log(`skip (not found): ${sku}`);
        continue;
      }
      await del('product').where('sku', '=', sku).execute(connection);
      console.log(`deleted: ${sku} (product_id ${p.product_id})`);
      deleted += 1;
    }
    await commit(connection);
    console.log(`Done. Deleted ${deleted} product(s).`);
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
