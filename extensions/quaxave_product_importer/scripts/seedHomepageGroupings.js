#!/usr/bin/env node
'use strict';

/**
 * Seed homepage groupings (collections) from product name/feature keywords.
 *
 * Derives membership for the homepage's Hot Picks / Audience / Brand groupings by
 * keyword-matching each product's NAME + DESCRIPTION against seedGroupingsConfig.js.
 * Imported products carry no brand/category/audience field, so keyword matching on
 * the scraped text is the only available signal (see seedGroupingsConfig.js for
 * reliability notes).
 *
 * Usage (from project root `usashipping/`, with PostgreSQL up and .env present):
 *   node extensions/quaxave_product_importer/scripts/seedHomepageGroupings.js [--dry-run] [--reset]
 *
 * Flags:
 *   --dry-run   Report match counts without writing anything.
 *   --reset     Clear existing membership for the managed collections first, so
 *               re-runs reflect keyword edits (incl. removals). Without it, the
 *               script only adds (idempotent via insertOnUpdate).
 *
 * Idempotent: collections are created only if their `code` is missing, and product
 * links use insertOnUpdate against the (collection_id, product_id) unique constraint.
 */

// Load .env BEFORE the connection module is required — it reads process.env.DB_*
// at import time, and a bare `node` run (unlike EverShop's boot) won't have it.
require('dotenv').config();

const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  select,
  insert,
  insertOnUpdate,
  del,
  startTransaction,
  commit,
  rollback
} = require('@evershop/postgres-query-builder');

const groupings = require('./seedGroupingsConfig');

const DRY_RUN = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');

// Build a matcher for a keyword list. Word-boundary + case-insensitive for plain
// alphanumeric keywords (so "men" != "women"/"supplement"); substring fallback for
// keywords containing non-word characters (e.g. "50+").
function makeMatcher(keywords) {
  const tests = keywords.map((kw) => {
    const lower = kw.toLowerCase();
    if (/^[a-z0-9 ]+$/.test(lower)) {
      const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`);
      return (hay) => re.test(hay);
    }
    return (hay) => hay.includes(lower);
  });
  return (hay) => tests.some((t) => t(hay));
}

async function ensureCollection(connection, { code, name }) {
  const existing = await select()
    .from('collection')
    .where('code', '=', code)
    .load(connection);
  if (existing) {
    return { id: existing.collection_id, created: false };
  }
  if (DRY_RUN) {
    return { id: null, created: true };
  }
  await insert('collection')
    .given({ name, description: name, code })
    .execute(connection);
  const created = await select()
    .from('collection')
    .where('code', '=', code)
    .load(connection);
  return { id: created.collection_id, created: true };
}

async function run() {
  console.log('='.repeat(72));
  console.log(`  Seed homepage groupings${DRY_RUN ? '  [DRY RUN]' : ''}${RESET ? '  [RESET]' : ''}`);
  console.log('='.repeat(72));

  // One transaction for the whole run: keeps a single pooled client checked out
  // (the query builder otherwise releases it after each query), and makes the
  // seed atomic. Dry runs roll back so nothing persists.
  const connection = await getConnection();
  await startTransaction(connection);

  // 1. Ensure each grouping's collection exists; remember its id.
  const idByCode = {};
  let createdCount = 0;
  for (const g of groupings) {
    const { id, created } = await ensureCollection(connection, g);
    idByCode[g.code] = id;
    if (created) createdCount += 1;
  }
  console.log(`Collections: ${groupings.length} total, ${createdCount} ${DRY_RUN ? 'would be created' : 'created'}.`);

  // 2. Optionally clear managed memberships so re-runs reflect keyword changes.
  if (RESET && !DRY_RUN) {
    for (const code of Object.keys(idByCode)) {
      if (idByCode[code] != null) {
        await del('product_collection')
          .where('collection_id', '=', idByCode[code])
          .execute(connection);
      }
    }
    console.log('Cleared existing membership for managed collections.');
  }

  // 3. Load enabled products with their name + description text.
  // Build the query statement-by-statement (not a fluent chain): `.on(...)` does
  // not return the main query, so `.where` must be called on the query reference
  // — same pattern as the categoryByUrlKey resolver.
  const productQuery = select().from('product');
  productQuery
    .leftJoin('product_description')
    .on(
      'product_description.product_description_product_id',
      '=',
      'product.product_id'
    );
  productQuery.where('product.status', '=', 1);
  const products = await productQuery.execute(connection);
  console.log(`Products scanned: ${products.length}\n`);

  // 4. Match each product against each grouping and link.
  const counts = {};
  for (const g of groupings) {
    counts[g.code] = 0;
    if (!g.keywords || g.keywords.length === 0) continue; // curated manually
    const match = makeMatcher(g.keywords);
    for (const p of products) {
      const hay = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      if (!match(hay)) continue;
      counts[g.code] += 1;
      if (!DRY_RUN && idByCode[g.code] != null) {
        await insertOnUpdate('product_collection', ['collection_id', 'product_id'])
          .given({ collection_id: idByCode[g.code], product_id: p.product_id })
          .execute(connection);
      }
    }
  }

  // Persist (real run) or discard (dry run). Both release the client.
  if (DRY_RUN) {
    await rollback(connection);
  } else {
    await commit(connection);
  }

  // 5. Report.
  console.log('Matches per grouping:');
  for (const g of groupings) {
    const note = !g.keywords || g.keywords.length === 0 ? '  (curated manually — no keywords)' : '';
    console.log(`  ${g.code.padEnd(24)} ${String(counts[g.code]).padStart(5)}${note}`);
  }
  console.log('\nDone.' + (DRY_RUN ? ' (dry run — nothing written)' : ''));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nFATAL:', err.message);
    process.exit(1);
  });
