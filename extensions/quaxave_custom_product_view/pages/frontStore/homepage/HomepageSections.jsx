import React from 'react';
import sectionsConfig from '../../../components/frontStore/homepage/homepageConfig';
import mapProductWithCart from '../../../components/common/ProductUtil';
import IconCarousel from '../../../components/frontStore/homepage/IconCarousel';
import PromoGrid from '../../../components/frontStore/homepage/PromoGrid';
import '../../../components/frontStore/homepage/homepageSections.scss';

// Generic, config-driven homepage renderer. Reads `homepageConfig` and renders
// each section with the variant matching its `type`. All tabs across all
// sections are fetched server-side in one consolidated query (see `query`
// below); this component attaches each tab's products (by alias `s{i}t{j}`) and
// hands them to the variant, which toggles the active tab client-side.
//
// Generalizes the original FeaturedProducts.jsx (Costco/Walmart tabs).

const VARIANTS = {
  'icon-carousel': IconCarousel,
  'promo-grid': PromoGrid,
};

export default function HomepageSections(props) {
  return (
    <>
      {sectionsConfig.map((section, i) => {
        const SectionComponent = VARIANTS[section.type];
        if (!SectionComponent) return null;

        // Attach pre-loaded products to each tab. `null` (missing/not-yet-loaded)
        // is preserved so variants can show a skeleton/empty state.
        const tabs = section.tabs.map((tab, j) => {
          // A missing category/collection resolves its GraphQL root field to
          // null; treat that the same as an empty result ([]) so the variant
          // shows the "no products" message instead of a permanent skeleton/
          // blank. This is pure SSR — there is no later client load to wait
          // for, so a null tab would otherwise stay a skeleton forever (the
          // exact bug that broke the old costco/walmart homepage once those
          // categories were removed).
          const items = props[`s${i}t${j}`]?.products?.items ?? [];
          return {
            ...tab,
            products: mapProductWithCart(items, null),
          };
        });

        return <SectionComponent key={i} section={{ ...section, tabs }} />;
      })}
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 15,
};

// GENERATED from homepageConfig.js — do not edit the literal by hand.
// EverShop's webpack GraphQL extractor (parseGraphqlByFile) only reads a STATIC
// backtick/quote literal for `export const query`, so this cannot be computed at
// runtime. Regenerate after editing homepageConfig.js:
//   node extensions/quaxave_custom_product_view/scripts/genHomepageQuery.cjs
// Aliases s{section}t{tab} must match the props[`s${i}t${j}`] lookup above.
// <homepage-query:start>
export const query = `
  query Query {
    s0t0: categoryByUrlKey(urlKey: "me-va-be") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t1: categoryByUrlKey(urlKey: "vitamin-khoang-chat") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t2: categoryByUrlKey(urlKey: "dau-ca-omega-3") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t3: categoryByUrlKey(urlKey: "xuong-khop") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t4: categoryByUrlKey(urlKey: "thuc-pham-dinh-duong") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t5: categoryByUrlKey(urlKey: "lam-dep") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t6: categoryByUrlKey(urlKey: "tu-thuoc-gia-dinh") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s0t7: categoryByUrlKey(urlKey: "banh-keo") { products(filters: [{ key: "limit", operation: eq, value: "10" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s1t0: collection(code: "audience-children") { products(filters: [{ key: "limit", operation: eq, value: "8" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s2t0: collection(code: "brand-abbott") { products(filters: [{ key: "limit", operation: eq, value: "8" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s2t1: collection(code: "brand-enfamil") { products(filters: [{ key: "limit", operation: eq, value: "8" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
    s2t2: collection(code: "brand-kirkland") { products(filters: [{ key: "limit", operation: eq, value: "8" }]) { items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        } } }
  }
`;
// <homepage-query:end>
