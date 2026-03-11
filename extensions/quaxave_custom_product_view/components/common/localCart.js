/**
 * Local cart — localStorage as source of truth, sync to server on cart navigation.
 *
 * Flow:
 *  1. Add/remove on product pages → instant localStorage update + CustomEvent
 *  2. Cart click → syncAndNavigate: diff-syncs server cart to match localStorage
 *     (DELETE removed, POST new, PATCH qty changes), then navigates.
 *  3. Cart page load → CartSync writes server cart back to localStorage so badge stays in sync.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'qxv_local_cart';
const SERVER_STATE_KEY = 'qxv_server_state';
const EVENT = 'local-cart-updated';

let _syncPromise = null;

function load() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
export function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
}

/** Called by CartSync on cart page load to cache server item removeApis. */
export function cacheServerState(serverState) {
  localStorage.setItem(SERVER_STATE_KEY, JSON.stringify(serverState));
}


export function getCart() { return load(); }
export function getItemQty(sku) { return load().find(i => i.sku === sku)?.qty ?? 0; }

export function addItem(sku, productId) {
  const cart = load();
  const hit = cart.find(i => i.sku === sku);
  save(hit
    ? cart.map(i => i.sku === sku ? { ...i, qty: i.qty + 1 } : i)
    : [...cart, { sku, productId, qty: 1 }]
  );
}
export function increaseItem(sku) {
  save(load().map(i => i.sku === sku ? { ...i, qty: i.qty + 1 } : i));
}
export function decreaseItem(sku) {
  save(load().map(i => i.sku === sku ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
}
export function removeItem(sku) { save(load().filter(i => i.sku !== sku)); }
export function clearCart() { save([]); }
export function getTotalQty() { return load().reduce((s, i) => s + i.qty, 0); }

export function useLocalCart() {
  const [cart, setCart] = useState(load);
  useEffect(() => {
    const handler = e => setCart(e.detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return cart;
}

/** Fetch current server cart items via session-authenticated REST endpoint. */
async function fetchServerCartItems() {
  try {
    const res = await fetch('/api/cart/mine/items', {
      method: 'GET',
      credentials: 'same-origin',
    });
    const json = await res.json();
    return json?.data?.items ?? [];
  } catch {
    return null;
  }
}

/**
 * Diff-sync: bring the server cart into exact alignment with localStorage,
 * then navigate. Idempotent — running it twice is a no-op.
 *
 * Strategy (no blind delete-all + re-add):
 *  - Items only in localStorage → POST (add)
 *  - Items only on server → DELETE (remove)
 *  - Items in both with same qty → skip
 *  - Items in both with different qty → PATCH delta (increase/decrease)
 */
export async function syncAndNavigate(destUrl) {
  const localItems = load();

  if (!_syncPromise) {
    _syncPromise = (async () => {
      const serverItems = await fetchServerCartItems();

      // If server state is unreadable, skip sync to avoid corrupting cart
      if (serverItems === null) return;

      const serverMap = new Map(serverItems.map(i => [i.sku, i]));

      // Remove server items not present in localStorage
      for (const [sku, serverItem] of serverMap) {
        if (!localItems.find(i => i.sku === sku)) {
          await fetch(`/api/cart/mine/items/${serverItem.uuid}`, {
            method: 'DELETE', credentials: 'same-origin',
          }).catch(() => {});
        }
      }

      // Add or adjust each localStorage item on the server
      for (const localItem of localItems) {
        const serverItem = serverMap.get(localItem.sku);
        if (!serverItem) {
          await fetch('/api/cart/mine/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ sku: localItem.sku, qty: localItem.qty }),
          }).catch(() => {});
        } else if (serverItem.qty !== localItem.qty) {
          const delta = localItem.qty - serverItem.qty;
          await fetch(`/api/cart/mine/items/${serverItem.uuid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              action: delta > 0 ? 'increase' : 'decrease',
              qty: Math.abs(delta),
            }),
          }).catch(() => {});
        }
      }
    })().finally(() => { _syncPromise = null; });
  }

  await _syncPromise;
  window.location.href = destUrl;
}
