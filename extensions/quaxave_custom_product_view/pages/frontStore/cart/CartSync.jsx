import { useEffect } from 'react';
import { useAppState } from '@components/common/context/app';
import { save, cacheServerState } from '../../../components/common/localCart';

/**
 * Watches the live app state cart (updated by EverShop after every +/-/remove)
 * and mirrors it to localStorage so the badge count stays in sync.
 *
 * Also caches removeApi URLs so syncAndNavigate can delete server items later.
 */
export default function CartSync() {
  const cart = useAppState()?.cart;
  const items = cart?.items;
  const totalQty = cart?.totalQty ?? null;

  useEffect(() => {
    // Guard: skip if items is missing or empty array from a transitional render.
    // An empty array is only valid when the cart is truly empty (items is []).
    // We distinguish a real empty cart by checking the totalQty from app state.
    if (!items) return;
    const toPath = url => { try { return new URL(url).pathname; } catch { return url; } };
    const serverState = items.map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: toPath(i.removeApi),
    }));
    // Only write to localStorage if items is non-empty, or if the server
    // confirms the cart is truly empty (totalQty === 0).
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
