import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ProductList from '../productView/List';

// Icon-tab section (Hot Picks). A row of icon tabs above a single product row.
// All tabs' products are pre-loaded server-side (in `section.tabs[i].products`);
// switching a tab is a local state swap with no network request.
function SkeletonRow({ count }) {
  return (
    <div className="hp-skeleton-row">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}

SkeletonRow.propTypes = { count: PropTypes.number.isRequired };

export default function IconCarousel({ section }) {
  const { heading, tabs, cardsPerRow = 5, viewAllUrl } = section;
  const [active, setActive] = useState(0);
  const current = tabs[active];
  const products = current?.products ?? null;

  return (
    <section className="hp-section hp-icon-carousel">
      <div className="page-width">
        {heading && <h2 className="hp-heading">{heading}</h2>}

        <nav className="hp-icon-tabs" role="tablist" aria-label={heading}>
          {tabs.map((tab, i) => (
            <button
              key={tab.key || i}
              type="button"
              role="tab"
              aria-selected={active === i}
              className={`hp-icon-tab${active === i ? ' active' : ''}`}
              onClick={() => setActive(i)}
            >
              {tab.icon && (
                <img className="hp-icon-img" src={tab.icon} alt="" loading="lazy" />
              )}
              <span className="hp-icon-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="hp-products">
          {products === null ? (
            <SkeletonRow count={cardsPerRow} />
          ) : products.length === 0 ? (
            <p className="hp-empty">Chưa có sản phẩm trong mục này.</p>
          ) : (
            <ProductList products={products} countPerRow={cardsPerRow} />
          )}
        </div>

        {(current?.viewAllUrl || viewAllUrl) && (
          <div className="hp-view-all">
            <a className="hp-view-all-btn" href={current?.viewAllUrl || viewAllUrl}>
              Xem tất cả
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

IconCarousel.propTypes = {
  section: PropTypes.shape({
    heading: PropTypes.string,
    cardsPerRow: PropTypes.number,
    viewAllUrl: PropTypes.string,
    tabs: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        key: PropTypes.string,
        icon: PropTypes.string,
        viewAllUrl: PropTypes.string,
        products: PropTypes.array,
      })
    ).isRequired,
  }).isRequired,
};
