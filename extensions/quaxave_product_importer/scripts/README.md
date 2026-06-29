# product-importer scripts

One-off, **manually-run** Node scripts for catalog + homepage data setup. None run
automatically (no cron, no bootstrap) — invoke them by hand from the project root with
PostgreSQL up and `.env` present:

```
node extensions/quaxave_product_importer/scripts/<script>.js [flags]
```

## Catalog / homepage seeders (idempotent — safe to re-run)

| Script | Purpose | Flags |
|---|---|---|
| `localizeProductNames.js` | Set each product's display name to Vietnamese (English kept in `short_description`); reads titles from `productTitlesVi.js`. | `--list` dumps current products as JSON |
| `productTitlesVi.js` | Data only — the SKU → Vietnamese-title map consumed by `localizeProductNames.js`. | — |
| `seedCategories.js` | Create the Vietnamese category taxonomy and assign each product one primary category. | `--dry-run`, `--reset` |
| `seedGroupingsConfig.js` | Data only — keyword rules for the homepage collections (consumed by `seedHomepageGroupings.js`). | — |
| `seedHomepageGroupings.js` | Create homepage collections (Hot Picks / brands / audiences) and link products by keyword-matching name + description. | `--dry-run`, `--reset` |

Idempotent (create-if-missing + `insertOnUpdate`). These are the tooling that built the
live Vietnamese homepage taxonomy — kept versioned so the catalog setup is reproducible
on a fresh DB or after a re-import.

**Typical order for a fresh catalog:** import products → `localizeProductNames` → `seedCategories` → `seedHomepageGroupings`.

## ⚠️ Destructive

| Script | Purpose |
|---|---|
| `deleteProducts.cjs` | **Deletes products by SKU** (child rows cascade via FK). Manual, explicit SKU list only — never wire into any automated/build path. |
