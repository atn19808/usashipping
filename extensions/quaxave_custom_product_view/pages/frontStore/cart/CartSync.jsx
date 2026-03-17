import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '@components/common/context/app';
import { save, cacheServerState, getCart } from '../../../components/common/localCart';

/**
 * Keeps the header badge in sync with the server cart and handles the
 * localStorage → server forward sync on first cart page load.
 *
 * Fast path (background sync already ran on product page):
 *   server cart = localStorage → no sync, no fetchPageData → instant cart page.
 *
 * Fallback (user navigated directly or background sync not done yet):
 *   diff local vs server → POST desiredState → fetchPageData to refresh UI.
 *
 * Module-level flags survive fetchPageData re-renders (JS bundle is not
 * re-evaluated on AJAX navigation).
 */
let _syncDone = false;
let _ownRefresh = false;

export default function CartSync({ cart: ssrCart }) {
  const stateCart = useAppState()?.cart;
  const AppContextDispatch = useAppDispatch();

  // stateCart is undefined on initial load (null cart excluded from AppState);
  // populated after fetchPageData. ssrCart is always available from SSR prop.
  const currentCart = stateCart !== undefined ? stateCart : ssrCart;

  // Cleanup: reset flags on real navigation away from cart page.
  useEffect(() => {
    if (_ownRefresh) {
      _ownRefresh = false;
    }
    return () => {
      if (!_ownRefresh) {
        _syncDone = false;
      } else {
        window.__qxvCartSyncing = false;
        window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      }
    };
  }, []);

  // One-time forward sync: diff currentCart (SSR) vs localStorage → push if different.
  useEffect(() => {
    if (_syncDone) return;
    if (currentCart === undefined) return;
    _syncDone = true;

    const serverItems = (currentCart?.items ?? []).map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: i.removeApi,
    }));

    const localItems = getCart();

    // Fast path: server already matches localStorage (background sync ran)
    const serverMap = new Map(serverItems.map(i => [i.sku, i]));
    const needsSync = localItems.some(li => { const si = serverMap.get(li.sku); return !si || si.qty !== li.qty; });
    const hasRemovals = serverItems.some(s => !localItems.find(i => i.sku === s.sku));

    if (localItems.length === 0 || (!needsSync && !hasRemovals)) {
      if (serverItems.length > 0 || (currentCart?.totalQty ?? 0) === 0) {
        save(serverItems.map(i => ({ sku: i.sku, qty: i.qty })));
        cacheServerState(serverItems);
      }
      window.__qxvCartSyncing = false;
      window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      return;
    }

    // Fallback: sync needed — send desiredState and refresh
    window.__qxvCartSyncing = true;
    window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: true } }));

    (async () => {
      try {
        await fetch('/api/cart/mine/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ desiredState: localItems.map(i => ({ sku: i.sku, qty: i.qty })) }),
        });

        const url = new URL(window.location.href);
        url.searchParams.set('ajax', true);
        _ownRefresh = true;
        await AppContextDispatch.fetchPageData(url);

        _ownRefresh = false;
        window.__qxvCartSyncing = false;
        window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      } catch (e) {
        _ownRefresh = false;
        window.__qxvCartSyncing = false;
        window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      }
    })();
  }, [currentCart]);

  // Mirror server → localStorage after any fetchPageData (qty changes, removals, post-sync refresh)
  useEffect(() => {
    if (!stateCart) return;
    const stateItems = stateCart.items ?? [];
    const serverState = stateItems.map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: i.removeApi,
    }));
    if (serverState.length > 0 || stateCart.totalQty === 0) {
      save(serverState.map(i => ({ sku: i.sku, qty: i.qty })));
      cacheServerState(serverState);
    }
  }, [stateCart]);

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
