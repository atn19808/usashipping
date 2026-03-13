import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ProductList from '../../../components/frontStore/productView/List';
import mapProductWithCart from '../../../components/common/ProductUtil';

// ── Store config — add new stores here as you onboard them ──────────────────
// `urlKey` must match the category url_key in the admin panel
const STORES = [
  { urlKey: 'costco',  label: 'Costco'  },
  { urlKey: 'walmart', label: 'Walmart' },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}

export default function FeaturedProducts({ costco, walmart }) {
  const [activeStore, setActiveStore] = useState(STORES[0].urlKey);

  const storeData = { costco, walmart };
  const current = storeData[activeStore];
  const items = current?.products?.items ?? null;
  const products = mapProductWithCart(items ?? [], null);

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
        </div>
      </div>

      {/* ── Product grid ──────────────────────────────────────── */}
      <div className="page-width" style={{ paddingTop: '16px', paddingBottom: '32px' }}>
        {items === null ? (
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
  costco: PropTypes.shape({ products: PropTypes.shape({ items: PropTypes.array }) }),
  walmart: PropTypes.shape({ products: PropTypes.shape({ items: PropTypes.array }) }),
};

FeaturedProducts.defaultProps = {
  costco: null,
  walmart: null,
};

export const layout = {
  areaId: 'content',
  sortOrder: 15,
};

// Both stores pre-loaded server-side — tab switching uses already-fetched data,
// avoiding client-side HTTP requests that get blocked by the browser's
// 6-connection HTTP/1.1 limit (all slots taken by webpack HMR SSE streams).
export const query = `
  query Query {
    costco: categoryByUrlKey(urlKey: "costco") {
      products(filters: [{key: "limit", operation: eq, value: "49"}]) {
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
    walmart: categoryByUrlKey(urlKey: "walmart") {
      products(filters: [{key: "limit", operation: eq, value: "49"}]) {
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
  }
`;
