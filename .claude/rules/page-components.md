---
paths: ["extensions/*/pages/**/*"]
---

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