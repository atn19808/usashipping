/**
 * Local cart — localStorage as source of truth, sync to server on cart navigation.
 *
 * Flow:
 *  1. Add/remove on product pages → instant localStorage update + CustomEvent
 *  2. Cart page load → CartSync writes server cart to localStorage (reverse sync)
 *     and caches removeApi URLs for each server item.
 *  3. Cart click → syncAndNavigate: deletes server items (using cached removeApis),
 *     POSTs fresh items from localStorage, then navigates.
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

function loadServerState() {
  try { return JSON.parse(localStorage.getItem(SERVER_STATE_KEY)) || []; }
  catch { return []; }
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

/**
 * Reset server cart to exactly match localStorage, then navigate.
 * Uses cached removeApis (written by CartSync on the last cart page visit)
 * to delete existing server items before POSTing fresh ones.
 */
export async function syncAndNavigate(destUrl) {
  const items = load();

  if (!_syncPromise) {
    _syncPromise = (async () => {
      // 1. Delete all server items using cached removeApis
      const serverState = loadServerState();
      for (const item of serverState) {
        try {
          await fetch(item.removeApi, { method: 'DELETE', credentials: 'same-origin' });
        } catch {}
      }
      // Clear the cache so a failed delete doesn't repeat on the next sync
      localStorage.removeItem(SERVER_STATE_KEY);

      // 2. POST fresh items from localStorage
      for (const item of items) {
        await fetch('/api/cart/mine/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ sku: item.sku, qty: item.qty }),
        });
      }
    })().finally(() => { _syncPromise = null; });
  }

  await _syncPromise;
  window.location.href = destUrl;
}
