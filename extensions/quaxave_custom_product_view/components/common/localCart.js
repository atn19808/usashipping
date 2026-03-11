/**
 * Local cart — localStorage as source of truth, background sync to server.
 *
 * Flow:
 *  1. Add/remove → instant localStorage update + CustomEvent
 *  2. 500ms after last cart change → background sync fires automatically
 *  3. Cart click → navigate immediately, sync runs in background
 *  4. Cart page calls waitForSync() to refresh once items land in DB
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'qxv_local_cart';
const SYNCED_KEY  = 'qxv_cart_synced';
const EVENT = 'local-cart-updated';

let _debounceTimer = null;
let _syncPromise   = null;

function _cartHash(items) {
  return items.map(i => `${i.sku}:${i.qty}`).sort().join('|');
}
function _isSynced(items) {
  try { return sessionStorage.getItem(SYNCED_KEY) === _cartHash(items); }
  catch { return false; }
}
function _markSynced(items) {
  try { sessionStorage.setItem(SYNCED_KEY, _cartHash(items)); } catch {}
}
async function _doSync(items) {
  if (!items.length) { _markSynced(items); return; }
  await Promise.allSettled(
    items.map(item => fetch('/api/cart/mine/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, qty: item.qty }),
      credentials: 'same-origin',
    }))
  );
  _markSynced(items);
}
function _scheduleSync() {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    _debounceTimer = null;
    const items = load();
    if (!_isSynced(items)) {
      _syncPromise = _doSync(items).finally(() => { _syncPromise = null; });
    }
  }, 500);
}

function load() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
  _scheduleSync();
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

/** Resolves when any in-progress sync finishes (or immediately if none pending) */
export function waitForSync() {
  return _syncPromise || Promise.resolve();
}

/** Await sync, clear localStorage, then navigate — cart page renders correct state in one load. */
export async function syncAndNavigate(destUrl) {
  const items = load();
  if (items.length && !_isSynced(items)) {
    if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
    if (!_syncPromise) _syncPromise = _doSync(items).finally(() => { _syncPromise = null; });
    await _syncPromise;
  }
  clearCart();
  window.location.href = destUrl;
}
