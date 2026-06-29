#!/usr/bin/env node
'use strict';

/**
 * Localize product display names to Vietnamese (Vietnamese-primary content).
 * Sets product_description.name = Vietnamese title and preserves the original
 * English name in short_description (kept for reference + English search).
 *
 * Usage (from project root, with Postgres up):
 *   node extensions/quaxave_product_importer/scripts/localizeProductNames.js --list   # dump current products as JSON
 *   node extensions/quaxave_product_importer/scripts/localizeProductNames.js          # apply titles from productTitlesVi.js
 *
 * Idempotent: applies name=vi, short_description=en from the SKU-keyed map.
 */

require('dotenv').config();
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  select,
  update,
  startTransaction,
  commit,
  rollback
} = require('@evershop/postgres-query-builder');

const LIST = process.argv.includes('--list');

async function loadProducts(connection) {
  // All products (enabled + disabled) — we localize the whole catalog.
  const q = select().from('product');
  q.leftJoin('product_description').on(
    'product_description.product_description_product_id',
    '=',
    'product.product_id'
  );
  return q.execute(connection);
}

async function run() {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const products = await loadProducts(connection);

    if (LIST) {
      const rows = products.map((p) => ({
        product_id: p.product_id,
        sku: p.sku,
        name: p.name,
        short_description: p.short_description ?? null
      }));
      console.log(JSON.stringify(rows, null, 2));
      await rollback(connection);
      return;
    }

    const titles = require('./productTitlesVi');
    const bySku = {};
    products.forEach((p) => { bySku[p.sku] = p; });

    let updated = 0;
    const missing = [];
    for (const sku of Object.keys(titles)) {
      const p = bySku[sku];
      if (!p) { missing.push(sku); continue; }
      const { vi, en } = titles[sku];
      await update('product_description')
        .given({ name: vi, short_description: en })
        .where('product_description_product_id', '=', p.product_id)
        .execute(connection);
      updated += 1;
    }

    await commit(connection);
    console.log(`Updated ${updated} product name(s) to Vietnamese.`);
    if (missing.length) {
      console.log(`SKUs in map not found in DB (skipped): ${missing.join(', ')}`);
    }
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
