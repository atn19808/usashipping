'use strict';

/**
 * Keyword rules for seeding homepage groupings (collections).
 *
 * Used by seedHomepageGroupings.js. Each entry becomes a Collection (created if
 * its `code` doesn't exist), and any product whose NAME + DESCRIPTION text
 * matches one of `keywords` is linked to it.
 *
 * Why collections (not categories) for everything, incl. Hot Picks: these groups
 * don't exist yet and must be created fresh, so the "reuse the existing category
 * tree" rationale for hybrid doesn't apply — collections keep the seeder uniform
 * and every API it touches is confirmed. The homepage renderer still supports
 * `source: 'category'` per tab if you later want to point one at a real category.
 *
 * Matching is WORD-BOUNDARY and case-insensitive (so "men" won't match "women"
 * or "supplement"). Keywords containing non-word characters (e.g. "50+") fall
 * back to a substring match.
 *
 * Reliability (see import data — products only carry name + a features list):
 *   - Brands: strong (Costco names lead with the brand).
 *   - Hot Picks categories: good, may need keyword tuning.
 *   - Audiences: weak — expect to top these up manually in admin.
 *
 * `code` values are the contract with homepageConfig.js. Edit keywords freely and
 * re-run the seeder (idempotent; use --reset to also drop stale memberships).
 */

module.exports = [
  // ── Hot Picks (icon-carousel) ──────────────────────────────────────────────
  // "Hot Pick" itself is editorial (curated bestsellers) — no reliable keyword,
  // so it's left empty for you to curate manually in admin.
  { code: 'hp-hot-pick',    name: 'Hot Pick',                keywords: [] },
  { code: 'hp-vitamin',     name: 'Vitamin & Khoáng Chất',   keywords: ['vitamin', 'multivitamin', 'mineral', 'calcium', 'magnesium', 'zinc', 'vitamin d', 'vitamin c', 'b12'] },
  { code: 'hp-omega3',      name: 'Dầu Cá Omega-3',          keywords: ['fish oil', 'omega-3', 'omega 3', 'omega3', 'krill oil', 'dha', 'epa'] },
  { code: 'hp-joint',       name: 'Xương Khớp',              keywords: ['joint', 'glucosamine', 'chondroitin', 'collagen', 'bone health', 'msm', 'cartilage'] },
  { code: 'hp-nutrition',   name: 'Thực Phẩm Dinh Dưỡng',    keywords: ['protein', 'nutrition shake', 'meal replacement', 'ensure', 'glucerna', 'fiber', 'probiotic', 'supplement'] },
  { code: 'hp-medicine',    name: 'Tủ Thuốc Gia Đình',       keywords: ['allergy', 'pain relief', 'ibuprofen', 'acetaminophen', 'tylenol', 'advil', 'cold', 'cough', 'antacid', 'aspirin', 'antihistamine'] },
  { code: 'hp-mom-baby',    name: 'Mẹ & Bé',                 keywords: ['baby', 'infant', 'formula', 'diaper', 'prenatal', 'toddler', 'pediasure', 'enfamil', 'similac'] },
  { code: 'hp-beauty',      name: 'Làm Đẹp',                 keywords: ['shampoo', 'conditioner', 'lotion', 'moisturizer', 'serum', 'skin care', 'cream', 'soap', 'body wash', 'sunscreen'] },
  { code: 'hp-toys',        name: 'Đồ Chơi',                 keywords: ['toy', 'lego', 'playset', 'doll', 'puzzle', 'building blocks'] },
  { code: 'hp-electronics', name: 'Điện Tử',                 keywords: ['tv', 'television', 'laptop', 'tablet', 'headphone', 'earbuds', 'monitor', 'speaker', 'smartwatch'] },

  // ── Audiences (promo-grid) — WEAK signal; tune/curate in admin ──────────────
  { code: 'audience-elderly',  name: 'Người cao tuổi',        keywords: ['senior', 'elderly', '50+', 'aging', 'memory support'] },
  { code: 'audience-men',      name: 'Nam giới',              keywords: ["men's", 'for men', 'prostate', 'testosterone'] },
  { code: 'audience-women',    name: 'Phụ nữ',                keywords: ["women's", 'for women', 'feminine', 'menopause'] },
  { code: 'audience-pregnant', name: 'Phụ nữ mang thai',      keywords: ['prenatal', 'pregnancy', 'pregnant', 'maternity', 'folic acid'] },
  { code: 'audience-children', name: 'Trẻ em',                keywords: ['kids', 'children', "children's", 'pediasure', 'toddler', 'infant', 'baby'] },

  // ── Brands (promo-grid) — STRONG signal ─────────────────────────────────────
  { code: 'brand-abbott',          name: 'Abbott',             keywords: ['abbott', 'ensure', 'glucerna', 'similac', 'pedialyte', 'zoneperfect', 'pediasure'] },
  { code: 'brand-enfamil',         name: 'Enfamil',            keywords: ['enfamil'] },
  { code: 'brand-kirkland',        name: 'Kirkland Signature', keywords: ['kirkland'] },
  { code: 'brand-sports-research', name: 'Sports Research',    keywords: ['sports research'] },
  { code: 'brand-nature-made',     name: 'Nature Made',        keywords: ['nature made'] },
  { code: 'brand-dove',            name: 'Dove',               keywords: ['dove'] },
  { code: 'brand-crest',           name: 'Crest',              keywords: ['crest'] },
];
