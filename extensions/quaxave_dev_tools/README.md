# quaxave_dev_tools — manual dev/ops scripts (NOT a runtime extension)

This folder is a **local-developer convenience**, intentionally **not registered** in
`config/default.json → system.extensions[]`. EverShop does not load it — there are no
routes, GraphQL, or `bootstrap.js`. Run the scripts by hand.

## Sync a fresh copy of the Azure dev DB into local Docker

Flow (dump Azure → restore into local Docker → switch `.env` to local). Full SOP in
[`directives/sync_local_db.md`](directives/sync_local_db.md):

| Script | Step |
|---|---|
| `execution/dumpAzureDatabase.js` | `pg_dump` the Azure DB (creds from the active `.env`) to `./azure_dump.dump` |
| `execution/startDockerContainer.js` | `docker-compose up -d` and wait for local Postgres |
| `execution/restoreDumpToLocal.js` | `pg_restore` the dump into local Postgres (creds from `.env.dev`) |
| `execution/switchEnvToLocal.js` | back up the current `.env` to `.env.azure_backup`, then copy `.env.dev` → `.env` |

`jobs/syncLocalDb.js` is deliberately **not** in `system.jobs[]` — an automated
Azure-dump job must never run on a schedule. Revert to Azure with `cp .env.azure_backup .env`.

Requires the PostgreSQL client tools (`pg_dump` / `pg_restore`) on PATH and Docker running.
