# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EverShop v1.2.2-based e-commerce store ("Qua Xa Ve") for international product shipping. Custom features are implemented as extensions in `extensions/`, not by modifying EverShop core. See `README.md` for full feature list.

## Commands

```bash
npm run dev          # Start dev server (port 3000, requires PostgreSQL running)
npm run build        # Production build
npm run start        # Start production server
npm run admin:create # Create admin user (interactive)
npm run admin:change-pass  # Change admin password

docker-compose up -d # Start local PostgreSQL 15
```

No test framework or linter is configured at the project level.

## Architecture

### Extension System

All custom code lives in `extensions/` (npm workspaces). Extensions are registered with priority in `config/default.json` under `system.extensions`. EverShop loads them at boot — **never modify EverShop core in `node_modules`**.

Each extension can provide any combination of:
- `bootstrap.js` — registers processors/hooks at startup
- `api/` — REST endpoints
- `graphql/types/` — GraphQL schema extensions
- `migration/` — database migrations
- `pages/admin/` and `pages/frontStore/` — React page components
- `components/` — reusable React components
- `services/` — business logic
- `jobs/` — cron-scheduled background tasks

### Processor/Hook System

Extensions modify core behavior by registering processors in `bootstrap.js`:

```javascript
const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
module.exports = () => {
    addProcessor('cartFields', myProcessorFunction, priority);
};
```

Lower priority numbers execute first. Processors receive data, transform it, and return modified data.

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

### API Route Convention

Each API endpoint is a directory under `api/` containing:
- `route.json` — defines HTTP method, path, and access (`"public"` or `"private"`). **Endpoints default to `private` if `access` is omitted.**
- `payloadSchema.json` — optional JSON Schema for automatic request validation (via Ajv)
- Handler files with bracket naming for middleware ordering: `[context]bodyParser[auth].js` → `[validateMethod]handler.js`
- Shared middleware between multiple endpoints goes in a folder named `endpoint1+endpoint2/`
- Handler signature: `async (request, response, delegate, next) => {}`
- Set response via `response.$body = { data: ... }` then call `next()`

### GraphQL Convention

Types live in `graphql/types/[TypeName]/`:
- `[TypeName].graphql` — SDL schema definition, uses `extend type Query` to add queries
- `[TypeName].resolvers.js` — resolver map matching the SDL structure

Resolvers use `camelCase()` to convert DB snake_case rows. API URLs in responses are generated via `buildUrl(routeId, params)`.

### Page Components

Pages export three things:
1. Default React component
2. `layout` — `{ areaId: 'content', sortOrder: 10 }` determines where it renders
3. `query` — GraphQL query whose results are passed as props

All component queries on a page are **consolidated into a single GraphQL request** server-side; results are injected as props automatically.

To pass middleware-computed values (e.g. a URL param) into the GraphQL query, use the context bridge:

```javascript
// In middleware:
const { setContextValue } = require('@evershop/evershop/src/lib/util/contextHelper');
setContextValue(request, 'productId', request.params.id);

// In component query:
export const query = `
  query Query {
    product(id: getContextValue('productId')) { name sku }
  }
`;
```

For client-side data fetching after hydration, use URQL's `useQuery` hook.

Shared components between multiple page routes go in a folder named `page1+page2/` — no `route.json` in those folders.

Checkout pages register steps via `useCheckoutSteps()`/`useCheckoutStepsDispatch()` hooks.

### Database Migrations

Files named `Version-X.Y.Z.js` in `migration/` export an async function receiving a DB connection:

```javascript
module.exports = exports = async (connection) => {
    await execute(connection, `ALTER TABLE ... ADD COLUMN ...`);
};
```

### Event System

Extensions can react to core actions via the event/subscriber system.

**Emit an event** (from a service or middleware):
```javascript
const { emit } = require('@evershop/evershop/src/lib/event');
await emit('order_placed', { order: { id: 1 } });
```

**Subscribe to an event** — create a file at `subscribers/<event_name>/handler.js`:
```javascript
module.exports = async function handler(data) {
  // data contains the emitted payload
};
```

Events are stored in the DB and executed asynchronously. Key built-in events:
`product_created`, `product_updated`, `category_created`, `category_updated`,
`order_created`, `order_placed`, `inventory_updated`, `customer_registered`

### Key Imports

```javascript
// Database
const { pool, getConnection } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert, update, del, execute, startTransaction, commit, rollback } = require('@evershop/postgres-query-builder');

// Utilities
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { toPrice } = require('@evershop/evershop/src/modules/checkout/services/toPrice');
const { OK, INVALID_PAYLOAD, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const { emit } = require('@evershop/evershop/src/lib/event');
const { setContextValue, getContextValue } = require('@evershop/evershop/src/lib/util/contextHelper');
```

### Service Resolvers

Service functions used as cart field resolvers receive context via `this`:
- `this.getData('field_name')` — read cart/entity data
- `this.setError('field', 'message')` — set validation errors

## Configuration

- `config/default.json` — extension registry, theme, scheduled jobs, address schema
- `.env` — database credentials, Google OAuth, FX rate config (copy from `.env.dev`)
- Theme: `themes/usashipping/` — SCSS globals, page overrides, static assets

## Deployment

- Push to `dev` → Azure dev environment
- Push to `main` → Azure production
- CI/CD: `.github/workflows/az_appservice.yml` runs `npm install && npm run build`
