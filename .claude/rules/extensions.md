---
paths: ["extensions/**/*"]
---

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