import { useEffect, useState } from 'react';
import { useAppState, useAppDispatch } from '@components/common/context/app';
import { save, cacheServerState, getCart } from '../../../components/common/localCart';

const toPath = url => { try { return new URL(url).pathname; } catch { return url; } };

/**
 * Keeps the header badge in sync with the server cart and handles the
 * localStorage → server forward sync on first cart page load.
 *
 * Fully client-side — no SSR query. Fetches server cart from
 * /api/cart/mine/items (~50ms direct DB, no cart processor chain).
 *
 * Critical ordering rule: localStorage must be read BEFORE any save() call.
 * If we mirror server → local first, getCart() returns server state and the
 * diff check always sees "nothing to sync" — forward sync never fires.
 *
 * Module-level flags survive fetchPageData-caused remounts (the JS bundle is
 * NOT re-evaluated on AJAX navigation).
 *
 *  _fetchDone / _syncDone    — skip re-running on fetchPageData remounts
 *  _ownRefresh               — set just before we call fetchPageData so the
 *                              unmount cleanup knows NOT to reset the flags
 *                              (it's our own remount, not a user navigation)
 */
let _fetchDone = false;
let _syncDone = false;
let _ownRefresh = false; // true while fetchPageData triggered by this component is in-flight

export default function CartSync() {
  const [apiItems, setApiItems] = useState(null);
  const stateCart = useAppState()?.cart;
  const AppContextDispatch = useAppDispatch();

  // Register cleanup: reset module flags when user navigates away from cart.
  // Skip reset if this unmount was caused by our OWN fetchPageData (_ownRefresh).
  useEffect(() => {
    // If this mount was triggered by our own fetchPageData, clear the flag and
    // do nothing else — fetch and sync are already done for this page visit.
    if (_ownRefresh) {
      _ownRefresh = false;
    }
    return () => {
      if (!_ownRefresh) {
        // Real navigation away — reset so next cart visit starts fresh
        _fetchDone = false;
        _syncDone = false;
      } else {
        // Our own fetchPageData completing — signal ShoppingCart to clear its spinner.
        // Dispatch the event while ShoppingCart is still mounted so its handler fires.
        window.__qxvCartSyncing = false;
        window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: false } }));
      }
    };
  }, []);

  // Fetch server cart on mount — direct DB query, bypasses slow processor chain
  useEffect(() => {
    if (_fetchDone) return;
    _fetchDone = true;
    fetch('/api/cart/mine/items', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        setApiItems(data?.data?.items ?? []);
      })
      .catch(() => {
        setApiItems([]);
      });
  }, []);

  // One-time forward sync: push localStorage → server if different
  useEffect(() => {
    if (apiItems === null) return;
    if (_syncDone) return;
    _syncDone = true;

    const serverState = apiItems.map(i => ({
      sku: i.sku,
      qty: i.qty,
      removeApi: `/api/cart/mine/items/${i.uuid}`,
    }));

    const localItems = getCart(); // READ BEFORE any writes

    if (localItems.length > 0) {
      const serverMap = new Map(serverState.map(i => [i.sku, i]));
      const needsSync = localItems.some(li => {
        const si = serverMap.get(li.sku);
        return !si || si.qty !== li.qty;
      });
      const hasRemovals = serverState.some(s => !localItems.find(i => i.sku === s.sku));

      if (needsSync || hasRemovals) {
        // Signal to cart UI that sync is in progress
        window.__qxvCartSyncing = true;
        window.dispatchEvent(new CustomEvent('qxv:cart-syncing', { detail: { syncing: true } }));

        // Batch sync — single POST applies all changes in one DB transaction
        // instead of N sequential requests. O(1) round trips vs O(N).
        (async () => {
          try {
            const toDelete = serverState
              .filter(s => !localItems.find(i => i.sku === s.sku))
              .map(s => s.removeApi.split('/').pop()); // extract uuid from path

            const toAdd = localItems
              .filter(li => !serverMap.get(li.sku))
              .map(li => ({ sku: li.sku, qty: li.qty }));

            const toUpdate = localItems
              .filter(li => {
                const si = serverMap.get(li.sku);
                return si && si.qty !== li.qty;
              })
              .map(li => {
                const si = serverMap.get(li.sku);
                const delta = li.qty - si.qty;
                return {
                  itemId: si.removeApi.split('/').pop(), // extract uuid from path
                  qty: Math.abs(delta),
                  action: delta > 0 ? 'increase' : 'decrease',
                };
              });

            await fetch('/api/cart/mine/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ toDelete, toAdd, toUpdate }),
            });

            const url = new URL(window.location.href);
            url.searchParams.set('ajax', true);
            _ownRefresh = true; // signal: the upcoming unmount is ours, don't reset flags
            await AppContextDispatch.fetchPageData(url);
          } catch (e) {
            _ownRefresh = false;
          }
        })();
        return;
      }
    }

    // No sync needed — mirror server → localStorage immediately
    save(serverState.map(i => ({ sku: i.sku, qty: i.qty })));
    cacheServerState(serverState);
  }, [apiItems]);

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
