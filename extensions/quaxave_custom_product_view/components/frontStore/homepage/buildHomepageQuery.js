// Builds the consolidated homepage GraphQL query from the section config.
//
// One aliased field per tab so every tab of every section is fetched in the
// single server-side request EverShop consolidates for the page. Tab clicks
// then toggle already-loaded data client-side (no per-click HTTP), matching the
// approach used by FeaturedProducts.jsx.
//
// Alias scheme: `s{sectionIndex}t{tabIndex}` — the renderer reads results back
// by the same key (props[`s${i}t${j}`]).
//
// Per-tab `source` selects the GraphQL root field:
//   - 'category'   -> categoryByUrlKey(urlKey: "<key>")  (custom resolver in this extension)
//   - 'collection' -> collection(code: "<key>")          (core catalog resolver)
// Both expose `.products(filters: [...])`.
//
// The card fields are INLINED per tab (not a shared `...Fragment`): EverShop's
// build-time query extractor (parseGraphqlByFile) mangles a fragment that is
// spread by many aliases in one query, so we repeat the selection instead — the
// same approach the proven FeaturedProducts.jsx uses. These fields are exactly
// what the custom ProductList + AddtoCartOrQtyButton need.

const CARD_FIELDS = `items {
          uuid
          productId
          name
          sku
          price { regular { value text } special { value text } }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        }`;

function buildTabField(alias, tab) {
  const limit = String(tab.count ?? 10);
  const productsBlock = `products(filters: [{ key: "limit", operation: eq, value: "${limit}" }]) { ${CARD_FIELDS} }`;

  if (tab.source === 'collection') {
    return `${alias}: collection(code: "${tab.key}") { ${productsBlock} }`;
  }
  // Default: category (reuses the proven categoryByUrlKey path)
  return `${alias}: categoryByUrlKey(urlKey: "${tab.key}") { ${productsBlock} }`;
}

function buildHomepageQuery(config) {
  const fields = config
    .flatMap((section, i) =>
      section.tabs.map((tab, j) => '    ' + buildTabField(`s${i}t${j}`, tab))
    )
    .join('\n');

  return `query Query {\n${fields}\n  }`;
}

// CommonJS so both the (Babel-compiled) renderer and the plain-node codegen script can use it.
module.exports = buildHomepageQuery;
