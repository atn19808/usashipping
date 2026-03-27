/**
 * Local cart — localStorage as source of truth.
 *
 * Flow:
 *  1. Add/remove on product pages → instant localStorage update + CustomEvent
 *     + debounced background sync to server (desiredState)
 *  2. Cart click → instant navigation (window.location.href)
 *  3. Cart page load → CartSync checks if server already matches localStorage.
 *     If background sync already ran: no-op, no fetchPageData.
 *     If not: syncs and calls fetchPageData as fallback.
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

// --- Background sync ---

let _bgSyncTimer = null;

function _doBackgroundSync() {
  if (typeof window === 'undefined') return;
  const items = load();
  if (items.length === 0) return;
  fetch('/api/cart/mine/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ desiredState: items.map(i => ({ sku: i.sku, qty: i.qty })) }),
  }).catch((err) => { console.warn('[localCart] background sync failed:', err); });
}

function _scheduleBgSync() {
  clearTimeout(_bgSyncTimer);
  _bgSyncTimer = setTimeout(_doBackgroundSync, 500);
}

// --- Cart mutations ---

export function addItem(sku, productId) {
  const cart = load();
  const hit = cart.find(i => i.sku === sku);
  save(hit
    ? cart.map(i => i.sku === sku ? { ...i, qty: i.qty + 1 } : i)
    : [...cart, { sku, productId, qty: 1 }]
  );
  _scheduleBgSync();
}
export function increaseItem(sku) {
  save(load().map(i => i.sku === sku ? { ...i, qty: i.qty + 1 } : i));
  _scheduleBgSync();
}
export function decreaseItem(sku) {
  save(load().map(i => i.sku === sku ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
  _scheduleBgSync();
}
export function removeItem(sku) {
  save(load().filter(i => i.sku !== sku));
  _scheduleBgSync();
}
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
