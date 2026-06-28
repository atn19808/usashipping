// Homepage section config — the single source of truth for the homepage layout.
//
// Each entry is a section rendered top-to-bottom. `type` selects the variant:
//   - 'icon-carousel' -> IconCarousel  (icon tab row + one product row)        e.g. Hot Picks
//   - 'promo-grid'    -> PromoGrid      (text tabs + promo image left + grid)   e.g. By Audience, Brands
//
// Per-tab fields:
//   label      (string)            tab label shown to the user
//   source     'category'|'collection'  which GraphQL root field backs the tab
//   key        (string)            category url_key  OR  collection code
//   count      (number)            max products to load for the tab
//   icon       (string, optional)  asset path for icon-carousel tabs   e.g. '/images/homepage/icons/vitamin.svg'
//   promoImage (string, optional)  asset path for promo-grid tabs      e.g. '/images/homepage/promo/abbott.jpg'
//   promoLink  (string, optional)  link target for the promo image
//   viewAllUrl (string, optional)  "Xem tất cả" link (omitted for now — wire to the collection
//                                  listing route once confirmed; a missing value hides the button)
//
// Backed by Collections seeded via quaxave_product_importer/scripts/seedHomepageGroupings.js.
// Only groupings that currently have products are listed below; the rest are seeded but empty
// and can be added as tabs once the catalog grows. Empty (pending products) groupings:
//   Hot Picks  : hp-hot-pick (curate in admin), hp-joint, hp-medicine, hp-beauty, hp-toys, hp-electronics
//   Audiences  : audience-elderly, audience-men, audience-women, audience-pregnant
//   Brands     : brand-sports-research, brand-nature-made, brand-dove, brand-crest
//
// TODO (Phase 5): add tab icons (/images/homepage/icons/*) and promo images (/images/homepage/promo/*).
//
// CommonJS (module.exports) so the codegen script (scripts/genHomepageQuery.cjs) can require it;
// HomepageSections.jsx still imports it via Babel's default interop.

module.exports = [
  // ── Section 1: Hot Picks (icon-carousel) ───────────────────────────────────
  {
    type: 'icon-carousel',
    heading: 'Quà tặng Tinh thần',
    cardsPerRow: 5,
    // Backed by product-type CATEGORIES (seedCategories.js). Each product has one
    // primary category (product.category_id); edit a product's Category in admin
    // to re-classify. `key` = category url_key.
    tabs: [
      { label: 'Mẹ & Bé',              source: 'category', key: 'me-va-be',            count: 10 },
      { label: 'Vitamin & Khoáng Chất', source: 'category', key: 'vitamin-khoang-chat', count: 10 },
      { label: 'Dầu Cá Omega-3',        source: 'category', key: 'dau-ca-omega-3',      count: 10 },
      { label: 'Xương Khớp',            source: 'category', key: 'xuong-khop',          count: 10 },
      { label: 'Thực Phẩm Dinh Dưỡng',  source: 'category', key: 'thuc-pham-dinh-duong', count: 10 },
      { label: 'Làm Đẹp',              source: 'category', key: 'lam-dep',             count: 10 },
      { label: 'Tủ Thuốc Gia Đình',     source: 'category', key: 'tu-thuoc-gia-dinh',   count: 10 },
      { label: 'Bánh Kẹo',             source: 'category', key: 'banh-keo',            count: 10 },
    ],
  },

  // ── Section 2: Products by Audience (promo-grid) ────────────────────────────
  // Only "Trẻ em" is populated today (baby/nutrition-heavy catalog). More tabs
  // light up as audience products are added / curated.
  {
    type: 'promo-grid',
    heading: 'Sản phẩm theo đối tượng',
    cardsPerRow: 4,
    tabs: [
      { label: 'Trẻ em', source: 'collection', key: 'audience-children', count: 8 },
    ],
  },

  // ── Section 3: Favorite Brands (promo-grid) ─────────────────────────────────
  {
    type: 'promo-grid',
    heading: 'Thương hiệu yêu thích',
    cardsPerRow: 4,
    tabs: [
      { label: 'Abbott',             source: 'collection', key: 'brand-abbott',   count: 8 },
      { label: 'Enfamil',            source: 'collection', key: 'brand-enfamil',  count: 8 },
      { label: 'Kirkland Signature', source: 'collection', key: 'brand-kirkland', count: 8 },
    ],
  },
];
