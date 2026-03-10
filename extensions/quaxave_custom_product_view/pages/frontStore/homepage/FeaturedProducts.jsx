import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from 'urql';
import ProductList from '../../../components/frontStore/productView/List';
import mapProductWithCart from '../../../components/common/ProductUtil';

// ── Store config — add new stores here as you onboard them ──────────────────
// `urlKey` must match the category url_key in the admin panel
// `url`    is the "View all" category link
const STORES = [
  { urlKey: 'costco',  label: 'Costco',  url: '/costco'  },
  { urlKey: 'walmart', label: 'Walmart', url: '/walmart' },
];

const PRODUCT_FIELDS = `
  uuid
  productId
  name
  sku
  price {
    regular { value text }
    special { value text }
  }
  weight { text }
  image { alt url: listing }
  url
  inventory { isInStock stockAvailability manageStock }
`;

const STORE_QUERY = `
  query StoreProducts($urlKey: String!) {
    categoryByUrlKey(urlKey: $urlKey) {
      products(filters: [{key: "limit", operation: eq, value: "20"}]) {
        items { ${PRODUCT_FIELDS} }
      }
    }
    cart {
      items { uuid productId qty }
    }
  }
`;

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}

export default function FeaturedProducts({ category, cart: ssrCart }) {
  const [activeStore, setActiveStore] = useState(STORES[0].urlKey);

  // Client-side fetch — fires on tab switch (and on mount to keep cart fresh)
  const [{ data, fetching }] = useQuery({
    query: STORE_QUERY,
    variables: { urlKey: activeStore },
  });

  // Prefer live URQL data; fall back to SSR props only for the initial store
  const items =
    data?.categoryByUrlKey?.products?.items ??
    (activeStore === STORES[0].urlKey ? category?.products?.items ?? [] : []);
  const cart = data?.cart ?? ssrCart;
  const products = mapProductWithCart(items, cart);

  const activeStoreMeta = STORES.find((s) => s.urlKey === activeStore);

  return (
    <div className="store-tabs-section">

      {/* ── Store tab bar ─────────────────────────────────────── */}
      <div className="store-tabs-bar">
        <div className="page-width store-tabs-inner">
          <nav className="store-tabs" role="tablist">
            {STORES.map((store) => (
              <button
                key={store.urlKey}
                role="tab"
                aria-selected={activeStore === store.urlKey}
                className={`store-tab${activeStore === store.urlKey ? ' active' : ''}`}
                onClick={() => setActiveStore(store.urlKey)}
              >
                {store.label}
              </button>
            ))}
          </nav>
          {activeStoreMeta && (
            <a href={activeStoreMeta.url} className="view-all-link">
              Xem tất cả →
            </a>
          )}
        </div>
      </div>

      {/* ── Product grid ──────────────────────────────────────── */}
      <div className="page-width" style={{ paddingTop: '16px', paddingBottom: '32px' }}>
        {fetching ? (
          <SkeletonGrid />
        ) : products.length === 0 ? (
          <p className="text-center" style={{ fontSize: '1.4rem', color: 'var(--color-text-muted)', padding: '40px 0' }}>
            Chưa có sản phẩm trong mục này.
          </p>
        ) : (
          <ProductList products={products} countPerRow={4} />
        )}
      </div>

    </div>
  );
}

FeaturedProducts.propTypes = {
  category: PropTypes.shape({
    products: PropTypes.shape({
      items: PropTypes.array,
    }),
  }),
  cart: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        productId: PropTypes.string,
        qty: PropTypes.number,
        uuid: PropTypes.string,
      })
    ),
  }),
};

FeaturedProducts.defaultProps = {
  category: { products: { items: [] } },
  cart: { items: [] },
};

export const layout = {
  areaId: 'content',
  sortOrder: 15,
};

// SSR: pre-load the first store (Costco) so the page isn't blank on first paint
export const query = `
  query query {
    category: categoryByUrlKey(urlKey: "costco") {
      products(filters: [{key: "limit", operation: eq, value: "20"}]) {
        items {
          uuid
          productId
          name
          sku
          price {
            regular { value text }
            special { value text }
          }
          weight { text }
          image { alt url: listing }
          url
          inventory { isInStock stockAvailability manageStock }
        }
      }
    }
    cart {
      items { uuid productId qty }
    }
  }
`;
