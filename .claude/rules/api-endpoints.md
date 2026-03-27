---
paths: ["extensions/*/api/**/*"]
---

### API Route Convention

Each API endpoint is a directory under `api/` containing:
- `route.json` — defines HTTP method, path, and access (`"public"` or `"private"`). **Endpoints default to `private` if `access` is omitted.**
- `payloadSchema.json` — optional JSON Schema for automatic request validation (via Ajv)
- Handler files with bracket naming for middleware ordering: `[context]bodyParser[auth].js` → `[validateMethod]handler.js`
- Shared middleware between multiple endpoints goes in a folder named `endpoint1+endpoint2/`
- Handler signature: `async (request, response, delegate, next) => {}`
- Set response via `response.$body = { data: ... }` then call `next()`

### Middleware Types

EverShop has four middleware scopes — place files in the corresponding folder:

| Scope | API folder | Pages folder |
|---|---|---|
| All requests (global) | `api/global/` | `pages/global/` |
| Admin only | `api/admin/all/` | `pages/admin/all/` |
| Storefront only | `api/frontStore/all/` | `pages/frontStore/all/` |
| Route-specific | `api/<routeName>/` | `pages/<section>/<routeName>/` |

**Passive middleware** (no `next` param) — the framework calls the next middleware automatically.
**Active middleware** (has `next` param) — you must call `next()` or the request hangs.


### Service Resolvers

Service functions used as cart field resolvers receive context via `this`:
- `this.getData('field_name')` — read cart/entity data
- `this.setError('field', 'message')` — set validation errors