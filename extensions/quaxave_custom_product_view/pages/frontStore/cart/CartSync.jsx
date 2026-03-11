import { useEffect } from 'react';
import { useAppState } from '@components/common/context/app';
import { save, cacheServerState } from '../../../components/common/localCart';

const toPath = url => { try { return new URL(url).pathname; } catch { return url; } };

/**
 * Keeps the header badge in sync with the server cart.
 *
 * On every cart change (page load, qty +/-, remove), mirrors the server cart
 * state into localStorage so the badge always shows the correct total.
 */
export default function CartSync({ cart: ssrCart }) {
  // ssrCart = SSR prop (available on first render)
  // stateCart = AppProvider state (updated after fetchPageData)
  // Use whichever is available, preferring the live state when set
  const stateCart = useAppState()?.cart;
  const cart = stateCart ?? ssrCart;
  const items = cart?.items;
  const totalQty = cart?.totalQty ?? null;

  useEffect(() => {
    if (!items) return;
    const serverState = items.map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: toPath(i.removeApi),
    }));
    if (serverState.length > 0 || totalQty === 0) {
      save(serverState.map(i => ({ sku: i.sku, qty: i.qty })));
      cacheServerState(serverState);
    }
  }, [items]);

  return null;
}

export const layout = {
  areaId: 'content',
  sortOrder: 1,
};

export const query = `
  query Query {
    cart {
      totalQty
      items {
        productSku
        qty
        removeApi
      }
    }
  }
`;
