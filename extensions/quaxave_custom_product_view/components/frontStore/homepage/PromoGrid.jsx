import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ProductList from '../productView/List';

// Promo-grid section (By Audience, Favorite Brands). Text tabs above a layout of
// a large promo image on the left and a product grid on the right. Switching a
// tab swaps BOTH the grid (pre-loaded in `section.tabs[i].products`) and the
// promo image (`section.tabs[i].promoImage`) with no network request.
export default function PromoGrid({ section }) {
  const { heading, tabs, cardsPerRow = 4, viewAllUrl } = section;
  const [active, setActive] = useState(0);
  const current = tabs[active];
  const products = current?.products ?? null;
  const hasPromo = Boolean(current?.promoImage);

  return (
    <section className="hp-section hp-promo-grid">
      <div className="page-width">
        <div className="hp-section-head">
          {heading && <h2 className="hp-heading">{heading}</h2>}
          <nav className="hp-text-tabs" role="tablist" aria-label={heading}>
            {tabs.map((tab, i) => (
              <button
                key={tab.key || i}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`hp-text-tab${active === i ? ' active' : ''}`}
                onClick={() => setActive(i)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={`hp-promo-layout${hasPromo ? '' : ' hp-promo-layout--no-image'}`}>
          {current?.promoImage && (
            <a
              className="hp-promo-img"
              href={current.promoLink || current.viewAllUrl || viewAllUrl || '#'}
            >
              <img src={current.promoImage} alt={current.label} loading="lazy" />
            </a>
          )}

          <div className="hp-promo-products">
            {products === null ? (
              <p className="hp-empty">&nbsp;</p>
            ) : products.length === 0 ? (
              <p className="hp-empty">Chưa có sản phẩm trong mục này.</p>
            ) : (
              <ProductList products={products} countPerRow={cardsPerRow} />
            )}
          </div>
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

PromoGrid.propTypes = {
  section: PropTypes.shape({
    heading: PropTypes.string,
    cardsPerRow: PropTypes.number,
    viewAllUrl: PropTypes.string,
    tabs: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        key: PropTypes.string,
        promoImage: PropTypes.string,
        promoLink: PropTypes.string,
        viewAllUrl: PropTypes.string,
        products: PropTypes.array,
      })
    ).isRequired,
  }).isRequired,
};
