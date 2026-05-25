---
paths: ["extensions/*/migration/**/*"]
---

### Database Migrations

Files named `Version-X.Y.Z.js` in `migration/` export an async function receiving a DB connection:

```javascript
module.exports = exports = async (connection) => {
    await execute(connection, `ALTER TABLE ... ADD COLUMN ...`);
};
```