import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '@components/common/context/app';
import { save, cacheServerState, getCart } from '../../../components/common/localCart';

const toPath = url => { try { return new URL(url).pathname; } catch { return url; } };

/**
 * Keeps the header badge in sync with the server cart and handles the
 * localStorage → server forward sync on first cart page load.
 *
 * Uses stateCart from AppState (populated via SSR) instead of fetching
 * /api/cart/mine/items — zero extra network round trips on normal page load.
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

export default function CartSync() {
  const stateCart = useAppState()?.cart;
  const AppContextDispatch = useAppDispatch();

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

  // One-time forward sync: diff stateCart (SSR) vs localStorage → push if different.
  // stateCart is undefined until AppState hydrates; null means server has no cart.
  useEffect(() => {
    if (_syncDone) return;
    if (stateCart === undefined) return; // wait for AppState hydration
    _syncDone = true;

    const serverItems = (stateCart?.items ?? []).map(i => ({
      sku: i.productSku,
      qty: i.qty,
      removeApi: toPath(i.removeApi),
    }));

    const localItems = getCart(); // READ BEFORE any writes

    // Mirror server → localStorage and exit when no sync is needed
    const serverMap = new Map(serverItems.map(i => [i.sku, i]));
    const needsSync = localItems.some(li => { const si = serverMap.get(li.sku); return !si || si.qty !== li.qty; });
    const hasRemovals = serverItems.some(s => !localItems.find(i => i.sku === s.sku));

    if (localItems.length === 0 || (!needsSync && !hasRemovals)) {
      if (serverItems.length > 0 || (stateCart?.totalQty ?? 0) === 0) {
        save(serverItems.map(i => ({ sku: i.sku, qty: i.qty })));
        cacheServerState(serverItems);
      }
      return;
    }

    // Sync needed — signal spinner and send batch request
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

        await fetch('/api/cart/mine/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ toDelete, toAdd, toUpdate }),
        });

        const url = new URL(window.location.href);
        url.searchParams.set('ajax', true);
        _ownRefresh = true;
        await AppContextDispatch.fetchPageData(url);
      } catch (e) {
        _ownRefresh = false;
      }
    })();
  }, [stateCart]);

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
