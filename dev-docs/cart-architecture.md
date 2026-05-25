# Cart Architecture — quaxave.com

## Overview

The cart uses a **local-first** pattern: items are stored in localStorage (`qxv_local_cart`) and synced to the server via **debounced background sync** (500ms after each mutation). The cart page sync (CartSync.jsx) serves as a **fallback** to catch any missed syncs.

## Data Flow: Product Page → Cart Page

```
1. User clicks "Add to Cart"
   → addItem(sku, productId) in localCart.js
   → writes to localStorage (qxv_local_cart)
   → dispatches CustomEvent "local-cart-updated"
   → schedules background sync (_scheduleBgSync, 500ms debounce)

2. Background sync fires (_doBackgroundSync)
   → POST /api/cart/mine/sync with { desiredState: [{ sku, qty }] }
   → fire-and-forget (no await, errors silently caught)
   → server computes diff vs current cart_items, applies adds/updates/deletes

3. Header badge (HeaderActions.jsx)
   → useLocalCart() hook listens to "local-cart-updated" CustomEvent
   → also listens to "pageshow" for bfcache restoration (back/forward nav)
   → reads qty from localStorage → updates badge count instantly

4. User clicks cart icon (HeaderActions.jsx)
   → Direct <a href={cartPath}> navigation (no client-side sync on click)

5. Cart page loads (CartSync.jsx) — two paths:

   FAST PATH (background sync already ran):
   → SSR props contain server cart (via detectCurrentCart page middleware)
   → CartSync diffs SSR cart vs localStorage → they match → no-op
   → save() writes server state → localStorage (ensures badge is in sync)
   → cacheServerState() caches removeApi URLs to qxv_server_state

   FALLBACK PATH (background sync didn't complete):
   → SSR cart doesn't match localStorage
   → POST /api/cart/mine/sync with desiredState from localStorage
   → fetchPageData() refreshes the page with updated cart
   → save() + cacheServerState() update localStorage
```

## Key Files

| File | Purpose |
|------|---------|
| `extensions/quaxave_custom_product_view/components/common/localCart.js` | All local cart logic: addItem, removeItem, increaseItem, decreaseItem, save, getCart, useLocalCart hook, background sync (_doBackgroundSync), cacheServerState |
| `extensions/quaxave_custom_product_view/pages/frontStore/all/HeaderActions.jsx` | Cart badge (reads useLocalCart) + direct link to cart page |
| `extensions/quaxave_custom_product_view/pages/frontStore/cart/CartSync.jsx` | Server↔localStorage sync on cart page load (fast path + fallback) |
| `extensions/quaxave_custom_product_view/pages/frontStore/checkoutSuccess/CartClear.jsx` | Clears localStorage cart after successful checkout |
| `extensions/quaxave_custom_product_view/api/getCartItems/` | `GET /api/cart/mine/items` — reads server cart items |
| `extensions/quaxave_custom_product_view/api/syncCart/` | `POST /api/cart/mine/sync` — single endpoint: accepts desiredState, computes server-side diff, applies all changes |
| `extensions/quaxave_custom_cart/pages/frontStore/cart/ShoppingCart.jsx` | Cart page UI |
| `extensions/quaxave_custom_cart/components/frontStore/checkout/cart/items/` | Cart item components (Items.jsx, CartQuantity.jsx) |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cart/mine/items` | GET | Read current server cart items |
| `/api/cart/mine/sync` | POST | **Idempotent** sync — accepts `{ desiredState: [{ sku, qty }] }`, server computes diff vs current cart_items, applies adds/updates/deletes in one call. Calling twice with the same state is a no-op. |

## Critical Rules

### Never use GraphQL for client-side cart reads
`/api/graphql` has NO `detectCurrentCart` middleware → `cartId` is always `undefined` → `cart` query returns `null`. This was the root cause of the **doubling bug** (in the old architecture): empty server items → additive POST → qty doubles on every navigation.

**Always use** `GET /api/cart/mine/items` or `POST /api/cart/mine/sync` instead.

### Sync is idempotent (desiredState pattern)
`POST /api/cart/mine/sync` with `desiredState` computes the diff server-side. Same local+server state = no changes applied. This replaced the old architecture where POST was additive (incrementing qty if SKU existed).

### Session-based cart detection
`detectCurrentCart` queries `cart` table by `sid` (session ID). The "mine" endpoints use this — no `cart_id` in URL needed. If no cart exists, syncHandler creates one via `createNewCart()`.

### SSR has cart access
EverShop SSR page queries run with `detectCurrentCart` page middleware → `cartId` IS available server-side. CartSync.jsx uses `stateCart !== undefined ? stateCart : ssrCart` pattern (stateCart is populated after fetchPageData; ssrCart is always available from SSR props).

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `qxv_local_cart` | Cart items: `[{ sku, productId, qty }]` |
| `qxv_server_state` | Cached server state with removeApi URLs: `[{ sku, qty, removeApi }]` — written by `cacheServerState()` |
