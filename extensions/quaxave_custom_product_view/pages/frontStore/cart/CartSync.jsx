import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '@components/common/context/app';
import { save, cacheServerState, getCart } from '../../../components/common/localCart';

const toPath = url => { try { return new URL(url).pathname; } catch { return url; } };

/**
 * Keeps the header badge in sync with the server cart and handles the
 * localStorage → server forward sync on first cart page load.
 *
 * Exports its own `query` so it receives `cart` as an SSR prop directly —
 * useAppState().cart is undefined on initial load because cart:null is excluded
 * from the serialized AppState. The SSR prop is always available.
 *
 * Module-level flags survive fetchPageData-caused remounts (the JS bundle is
 * NOT re-evaluated on AJAX navigation).
 *
 *  _syncDone   — skip re-running sync on fetchPageData remounts
 *  _ownRefresh — set just before we call fetchPageData so the unmount cleanup
 *                knows NOT to reset the flags (it's our own remount, not user nav)
 */
let _syncDone = false;
let _ownRefresh = false;

export default function CartSync({ cart: ssrCart }) {
  // stateCart is undefined on initial load; populated by fetchPageData updates
  const stateCart = useAppState()?.cart;
  const AppContextDispatch = useAppDispatch();

  // Use whichever is available: stateCart (post-fetchPageData) or ssrCart (initial SSR)
  const currentCart = stateCart !== undefined ? stateCart : ssrCart;

  // Cleanup: reset flags on real navigation away; dispatch syncing-done on our own remount.
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

  // One-time forward sync: diff currentCart (SSR prop) vs localStorage → push if different.
  // currentCart is null when server has no cart, object when it does.
  useEffect(() => {
    console.log('[CartSync] effect — _syncDone:', _syncDone, 'currentCart:', currentCart);
    if (_syncDone) return;
    if (currentCart === undefined) { console.log('[CartSync] currentCart still undefined, waiting'); return; }
    _syncDone = true;

    const serverItems = (currentCart?.items ?? []).map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: toPath(i.removeApi),
    }));

    const localItems = getCart(); // READ BEFORE any writes
    console.log('[CartSync] serverItems:', serverItems.length, 'localItems:', localItems.length);

    // Mirror server → localStorage and exit when no sync is needed
    const serverMap = new Map(serverItems.map(i => [i.sku, i]));
    const needsSync = localItems.some(li => { const si = serverMap.get(li.sku); return !si || si.qty !== li.qty; });
    const hasRemovals = serverItems.some(s => !localItems.find(i => i.sku === s.sku));
    console.log('[CartSync] needsSync:', needsSync, 'hasRemovals:', hasRemovals);

    if (localItems.length === 0 || (!needsSync && !hasRemovals)) {
      console.log('[CartSync] no sync needed — clearing spinner');
      if (serverItems.length > 0 || (currentCart?.totalQty ?? 0) === 0) {
        save(serverItems.map(i => ({ sku: i.sku, qty: i.qty })));
        cacheServerState(serverItems);
      }
      window.__qxvCartSyncing = false;
      window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      return;
    }

    // Sync needed — signal spinner and send batch request
    console.log('[CartSync] sync needed — firing fetch');
    window.__qxvCartSyncing = true;
    window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: true } }));

    (async () => {
      try {
        const toDelete = serverItems
          .filter(s => !localItems.find(i => i.sku === s.sku))
          .map(s => s.removeApi.split('/').pop());

        const toAdd = localItems
          .filter(li => !serverMap.get(li.sku))
          .map(li => ({ sku: li.sku, qty: li.qty }));

        const toUpdate = localItems
          .filter(li => { const si = serverMap.get(li.sku); return si && si.qty !== li.qty; })
          .map(li => {
            const si = serverMap.get(li.sku);
            const delta = li.qty - si.qty;
            return { itemId: si.removeApi.split('/').pop(), qty: Math.abs(delta), action: delta > 0 ? 'increase' : 'decrease' };
          });

        console.log('[CartSync] toDelete:', toDelete, 'toAdd:', toAdd, 'toUpdate:', toUpdate);
        await fetch('/api/cart/mine/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ toDelete, toAdd, toUpdate }),
        });
        console.log('[CartSync] fetch done — calling fetchPageData');

        const url = new URL(window.location.href);
        url.searchParams.set('ajax', true);
        _ownRefresh = true;
        await AppContextDispatch.fetchPageData(url);

        // fetchPageData resolved — clear spinner directly.
        // The cleanup-based dispatch only fires on unmount which may not happen
        // when fetchPageData re-renders the same route in place.
        console.log('[CartSync] fetchPageData done — clearing spinner');
        _ownRefresh = false;
        window.__qxvCartSyncing = false;
        window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      } catch (e) {
        console.error('[CartSync] sync failed:', e);
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
      removeApi: toPath(i.removeApi),
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
