import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Area from '@components/common/Area';
import { get } from '@evershop/evershop/src/lib/util/get';
import { useAppState } from '@components/common/context/app';
import Items from '@components/frontStore/checkout/cart/items/Items';
import { Empty } from '@components/frontStore/checkout/cart/Empty';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Spinner from '@components/common/Spinner';

function Title({ title }) {
  const items = get(useAppState(), 'cart.items', []);
  if (items.length <= 0) return null;

  return (
    <div className="mb-12 text-center shopping-cart-heading">
      <h1 className="shopping-cart-title mb-2">{title}</h1>
      <a href="/" className="underline">
        {_('Continue Shopping')}
      </a>
    </div>
  );
}

Title.propTypes = {
  title: PropTypes.string.isRequired
};

export default function ShoppingCart({ cart, setting }) {
  // After CartSync calls fetchPageData, stateCart is the live AppState cart.
  // The SSR `cart` prop stays at its initial value — use stateCart when available.
  const stateCart = useAppState()?.cart;
  const activeCart = stateCart ?? cart;
  const { totalQty = 0, items = [] } = activeCart || {};

  // Show spinner while CartSync is syncing localStorage → server
  const [cartSyncing, setCartSyncing] = useState(false);
  useEffect(() => {
    // Immediate check: localStorage has items but SSR cart is empty → sync is coming
    try {
      const localItems = JSON.parse(localStorage.getItem('qxv_local_cart') || '[]');
      // Use the initial SSR totalQty for this one-time check; stateCart isn't set yet
      const ssrTotalQty = (cart || {}).totalQty ?? 0;
      console.log('[ShoppingCart] localItems:', localItems.length, 'ssrTotalQty:', ssrTotalQty, 'cart prop:', cart);
      if (localItems.length > 0 && ssrTotalQty === 0) { console.log('[ShoppingCart] showing spinner'); setCartSyncing(true); }
    } catch { /* ignore */ }
    // Also listen for CartSync's runtime signal (covers partial-mismatch cases)
    const handler = (e) => setCartSyncing(e.detail.syncing);
    window.addEventListener('qxv:cart-syncing', handler);
    return () => window.removeEventListener('qxv:cart-syncing', handler);
  }, []);

  // Belt-and-suspenders: clear spinner when live cart data arrives with items.
  // Handles the case where the qxv:cart-syncing event was missed (e.g. timing edge cases).
  useEffect(() => {
    console.log('[ShoppingCart] totalQty changed:', totalQty, 'stateCart:', stateCart, 'cartSyncing:', cartSyncing);
    if (cartSyncing && totalQty > 0) {
      setCartSyncing(false);
    }
  }, [totalQty]);

  if (cartSyncing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
        <Spinner width={40} height={40} />
        <p style={{ color: '#666' }}>{_('Loading your cart...')}</p>
      </div>
    );
  }

  if (totalQty <= 0) {
    return <Empty />;
  } else {
    return (
      <div>
        <div className="cart page-width">
          <Area
            id="shoppingCartTop"
            className="cart-page-top"
            coreComponents={[
              {
                component: { default: Title },
                props: { title: 'Shopping cart' },
                sortOrder: 10,
                id: 'shoppingCartTitle'
              }
            ]}
          />
          <div className="cart-page-middle">
            <div className="grid gap-16 grid-cols-1 md:grid-cols-4">
              <Area
                id="shoppingCartLeft"
                className="col-span-1 md:col-span-3"
                coreComponents={[
                  {
                    component: { default: Items },
                    props: { items, setting },
                    sortOrder: 10,
                    id: 'shoppingCartTitle'
                  }
                ]}
              />
              <Area
                id="shoppingCartRight"
                className="col-span-1 md:col-span-1"
              />
            </div>
          </div>
          <Area id="shoppingCartBottom" className="cart-page-bottom" />
        </div>
      </div>
    );
  }
}

ShoppingCart.propTypes = {
  cart: PropTypes.shape({
    uuid: PropTypes.string
  }),
  setting: PropTypes.shape({
    priceIncludingTax: PropTypes.bool
  }).isRequired
};

ShoppingCart.defaultProps = {
  cart: null
};

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    cart {
      totalQty
      uuid
      items {
        cartItemId
        thumbnail
        qty
        productName
        productSku
        variantOptions
        productUrl
        productPrice {
          value
          text
        }
        productPriceInclTax {
          value
          text
        }
        finalPrice {
          value
          text
        }
        finalPriceInclTax {
          value
          text
        }
        lineTotal {
          value
          text
        }
        lineTotalInclTax {
          value
          text
        }
        productWeight {
          text
        }
        removeApi
        updateQtyApi
        errors
      }
    }
    setting {
      priceIncludingTax
    }
  }
`;
