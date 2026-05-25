---
paths:
  - "extensions/quaxave_custom_product_view/components/common/localCart*"
  - "extensions/quaxave_custom_product_view/pages/frontStore/cart/**/*"
  - "extensions/quaxave_custom_product_view/pages/frontStore/all/HeaderActions*"
  - "extensions/quaxave_custom_product_view/api/getCartItems/**/*"
  - "extensions/quaxave_custom_product_view/api/syncCart/**/*"
  - "extensions/quaxave_custom_cart/**/*"
  - "extensions/quaxave_custom_product_view/pages/frontStore/checkoutSuccess/CartClear*"
---

### Cart System

The cart uses a local-first pattern with server sync. Read the full architecture before making changes:

@import dev-docs/cart-architecture.md

**Critical:** Never use `/api/graphql` for client-side cart reads — it lacks `detectCurrentCart` middleware and will return null. Use `GET /api/cart/mine/items` instead.
