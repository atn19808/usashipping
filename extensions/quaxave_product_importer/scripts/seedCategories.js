#!/usr/bin/env node
'use strict';

/**
 * Create product-type categories (bachhoamy-style taxonomy) and assign each
 * product to ONE primary category. This replaces the keyword-collection guessing
 * for the homepage's product-type ("Hot Picks") sections with explicit,
 * admin-editable category membership.
 *
 * Usage (from project root, Postgres up):
 *   node extensions/quaxave_product_importer/scripts/seedCategories.js [--dry-run] [--reset]
 *
 * Idempotent: categories are created by url_key only if missing; each product's
 * category membership is reset to the single mapped category. `--reset` also
 * clears membership for products not in the map.
 */

require('dotenv').config();
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  select,
  insert,
  update,
  startTransaction,
  commit,
  rollback
} = require('@evershop/postgres-query-builder');

const DRY_RUN = process.argv.includes('--dry-run');

// Product-type categories (top-level). url_key is the contract with homepageConfig.
const CATEGORIES = [
  { url_key: 'dau-ca-omega-3', name: 'Dầu Cá Omega-3' },
  { url_key: 'me-va-be', name: 'Mẹ & Bé' },
  { url_key: 'vitamin-khoang-chat', name: 'Vitamin & Khoáng Chất' },
  { url_key: 'thuc-pham-dinh-duong', name: 'Thực Phẩm Dinh Dưỡng' },
  { url_key: 'xuong-khop', name: 'Xương Khớp' },
  { url_key: 'lam-dep', name: 'Làm Đẹp' },
  { url_key: 'tu-thuoc-gia-dinh', name: 'Tủ Thuốc Gia Đình' },
  { url_key: 'banh-keo', name: 'Bánh Kẹo' }
];

// SKU → category url_key. One primary category per product (best-fit).
const ASSIGN = {
  // ── Mẹ & Bé (milk powder / infant formula) ──
  'FAC403-W-50035705': 'me-va-be',
  'FAC407-W-14018005': 'me-va-be',
  'FAC406-W-24100207': 'me-va-be',
  'FAC403-C-100851125': 'me-va-be',
  'FAC404-C-100852045': 'me-va-be',
  'FAC405-W-17179640': 'me-va-be',
  'FAC404-W-559964668': 'me-va-be',
  'FAC407-C-4000036684': 'me-va-be',
  'FAC405-C-4000032472': 'me-va-be',
  'FAC402-C-100332452': 'me-va-be',
  'FAC401-C-100675007': 'me-va-be',
  'FAC406-C-100810650': 'me-va-be',
  // ── Vitamin & Khoáng Chất ──
  'FAC011-C-11487038': 'vitamin-khoang-chat',
  'FAC012-C-11672433': 'vitamin-khoang-chat',
  'FAC001-C-11491625': 'vitamin-khoang-chat',
  'FAC010-C-19954': 'vitamin-khoang-chat',
  'FAC008-C-100309168': 'vitamin-khoang-chat',
  'FAC006-C-10015954': 'vitamin-khoang-chat',
  'FAC002-C-11491606': 'vitamin-khoang-chat',
  'FAC007-C-100369190': 'vitamin-khoang-chat',
  'FAC004-C-100022642': 'vitamin-khoang-chat',
  'FAC009-C-11467951': 'vitamin-khoang-chat',
  'FAC003-C-100458954': 'vitamin-khoang-chat',
  'FAC018-C-100029983': 'vitamin-khoang-chat',
  'FAC019-C-100121461': 'vitamin-khoang-chat',
  'FAC020-C-100405668': 'vitamin-khoang-chat',
  'FAC013-C-100316316': 'vitamin-khoang-chat',
  'FAC005-C-100112668': 'vitamin-khoang-chat',
  'FAC204-W-152665513': 'vitamin-khoang-chat',
  'FAC202-W-346132861': 'vitamin-khoang-chat',
  'FAC201-W-416677311': 'vitamin-khoang-chat',
  // ── Dầu Cá Omega-3 ──
  'FAC016-C-100149465': 'dau-ca-omega-3',
  'FAC017-C-11072245': 'dau-ca-omega-3',
  '100406405': 'dau-ca-omega-3',
  // ── Xương Khớp ──
  'FAC014-C-11245398': 'xuong-khop',
  'FAC035-C-100777841': 'xuong-khop',
  'FAC015-C-100293064': 'xuong-khop',
  // ── Thực Phẩm Dinh Dưỡng ──
  'FAC401-W-13347560892': 'thuc-pham-dinh-duong',
  'FAC402-W-400928784': 'thuc-pham-dinh-duong',
  'FAC021-C-4000100002': 'thuc-pham-dinh-duong',
  'FAC020-C-4000099948': 'thuc-pham-dinh-duong',
  // ── Làm Đẹp (skincare + collagen) ──
  '1938952': 'lam-dep',
  'FAC032-C-4000176534': 'lam-dep',
  'FAC033-C-4000183060': 'lam-dep',
  'FAC302-W-5600977032': 'lam-dep',
  'FAC301-W-11150564530': 'lam-dep',
  'FAC203-W-326513010': 'lam-dep',
  'FAC030-C-100778338': 'lam-dep',
  'FAC031-C-4000062580': 'lam-dep',
  'FAC043-C-100152773': 'lam-dep',
  'FAC042-C-100987475': 'lam-dep',
  'FAC041-C-100367277': 'lam-dep',
  'FAC040-C-11673449': 'lam-dep',
  '967816': 'lam-dep',
  // ── Tủ Thuốc Gia Đình ──
  'FAC034-C-100452562': 'tu-thuoc-gia-dinh',
  'FAC045-C-100214394': 'tu-thuoc-gia-dinh',
  'FAC036-C-100474749': 'tu-thuoc-gia-dinh',
  'FAC044-C-100388781': 'tu-thuoc-gia-dinh',
  'FAC046-C-100375370': 'tu-thuoc-gia-dinh',
  // ── Bánh Kẹo ──
  'FAC501-W-26356642': 'banh-keo',
  'FAC504-C-100333887': 'banh-keo',
  'FAC503-C-100381533': 'banh-keo',
  'FAC502-C-100394712': 'banh-keo',
  'FAC505-C-100402650': 'banh-keo',
  'FAC501-C-100383408': 'banh-keo',
  'FAC502-W-45212007': 'banh-keo'
};

async function ensureCategory(connection, cat, position) {
  const q = select('category.category_id').from('category');
  q.leftJoin('category_description').on(
    'category_description.category_description_category_id',
    '=',
    'category.category_id'
  );
  q.where('category_description.url_key', '=', cat.url_key);
  const existing = await q.execute(connection);
  if (existing.length) return { id: existing[0].category_id, created: false };
  if (DRY_RUN) return { id: null, created: true };

  const res = await insert('category')
    .given({ status: true, include_in_nav: true, position, show_products: true })
    .execute(connection);
  const id = res.insertId;
  await insert('category_description')
    .given({
      category_description_category_id: id,
      name: cat.name,
      url_key: cat.url_key,
      // Empty EditorJS doc — core CategoryInfo renders <Editor rows={description}>
      // and crashes (rows.map) if description is null.
      description: '[]'
    })
    .execute(connection);
  return { id, created: true };
}

async function run() {
  console.log('='.repeat(72));
  console.log(`  Seed product-type categories${DRY_RUN ? '  [DRY RUN]' : ''}`);
  console.log('='.repeat(72));

  const connection = await getConnection();
  await startTransaction(connection);
  try {
    // 1. Ensure categories.
    const idByKey = {};
    let created = 0;
    for (let i = 0; i < CATEGORIES.length; i += 1) {
      const { id, createdNow } = await ensureCategory(connection, CATEGORIES[i], i)
        .then((r) => ({ id: r.id, createdNow: r.created }));
      idByKey[CATEGORIES[i].url_key] = id;
      if (createdNow) created += 1;
    }
    console.log(`Categories: ${CATEGORIES.length} total, ${created} ${DRY_RUN ? 'would be created' : 'created'}.`);

    // 2. Load products (sku → id).
    const products = await select('product_id')
      .select('sku')
      .from('product')
      .execute(connection);
    const idBySku = {};
    products.forEach((p) => { idBySku[p.sku] = p.product_id; });

    // 3. Assign each mapped product to its single primary category.
    const counts = {};
    const missing = [];
    for (const sku of Object.keys(ASSIGN)) {
      const productId = idBySku[sku];
      const categoryId = idByKey[ASSIGN[sku]];
      if (!productId) { missing.push(sku); continue; }
      counts[ASSIGN[sku]] = (counts[ASSIGN[sku]] || 0) + 1;
      if (DRY_RUN || categoryId == null) continue;
      // This EverShop version uses a single product.category_id (one category/product).
      await update('product')
        .given({ category_id: categoryId })
        .where('product_id', '=', productId)
        .execute(connection);
    }

    if (DRY_RUN) await rollback(connection);
    else await commit(connection);

    console.log('\nProducts per category:');
    CATEGORIES.forEach((c) => {
      console.log(`  ${c.url_key.padEnd(22)} ${String(counts[c.url_key] || 0).padStart(4)}`);
    });
    if (missing.length) console.log(`\nSKUs in map not found in DB: ${missing.join(', ')}`);
    console.log('\nDone.' + (DRY_RUN ? ' (dry run — nothing written)' : ''));
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => { console.error('FATAL:', err.message); process.exit(1); });
