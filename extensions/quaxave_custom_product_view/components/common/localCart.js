/**
 * Local cart — localStorage as source of truth.
 *
 * Flow:
 *  1. Add/remove on product pages → instant localStorage update + CustomEvent
 *  2. Cart click → instant navigation (window.location.href)
 *  3. Cart page load → CartSync reads localStorage first, syncs to server if needed,
 *     then mirrors server state back to localStorage so badge stays in sync.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'qxv_local_cart';
const SERVER_STATE_KEY = 'qxv_server_state';
const EVENT = 'local-cart-updated';

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
    // Re-read localStorage when page is restored from bfcache (back/forward nav)
    const onPageShow = (e) => { if (e.persisted) setCart(load()); };
    window.addEventListener(EVENT, handler);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);
  return cart;
}
