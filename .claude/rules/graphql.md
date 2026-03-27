---
paths: ["extensions/*/graphql/**/*"]
---

### GraphQL Convention

Types live in `graphql/types/[TypeName]/`:
- `[TypeName].graphql` — SDL schema definition, uses `extend type Query` to add queries
- `[TypeName].resolvers.js` — resolver map matching the SDL structure

Resolvers use `camelCase()` to convert DB snake_case rows. API URLs in responses are generated via `buildUrl(routeId, params)`.