# Directive: Sync Local Database

## Goal

Snapshot the live Azure dev database and restore it into a local Docker PostgreSQL container,
then switch the active `.env` to local credentials. Run this once before a local dev session
to get a fresh copy of real product, category, order, and settings data without competing for
Azure connection slots.

---

## Inputs

| Input | Source | Notes |
|---|---|---|
| `DB_HOST` | `.env` (current) | Azure hostname — read automatically from active `.env` |
| `DB_PORT` | `.env` (current) | Azure port, default `5432` |
| `DB_NAME` | `.env` (current) | Azure database name |
| `DB_USER` | `.env` (current) | Azure username |
| `DB_PASSWORD` | `.env` (current) | Azure password |
| `DB_SSLMODE` | `.env` (current) | Should be `require` for Azure |
| `.env.dev` | filesystem | Local credentials file — must exist at project root |
| `docker-compose.yml` | filesystem | Must exist at project root |

---

## Execution

### Step 1 — Dump Azure Database
**Script:** `execution/dumpAzureDatabase.js`

- MUST read Azure DB credentials from the current `.env` file using `dotenv`
- MUST run `pg_dump` with flags: `--no-owner --no-acl -F c` (custom format, portable)
- MUST write the dump to `./azure_dump.dump` at the project root
- MUST stream pg_dump stdout/stderr to console for visibility
- SHOULD abort with a clear error if `DB_HOST` still points to `localhost` (already on local)
- Returns: `{ dumpPath: string }`

### Step 2 — Start Docker Container
**Script:** `execution/startDockerContainer.js`

- MUST run `docker-compose up -d` from the project root
- MUST poll the local PostgreSQL (credentials from `.env.dev`) until it accepts connections
- MUST time out after 30 seconds and throw if Postgres never becomes ready
- SHOULD log each poll attempt (up to once per second) for visibility
- Returns: `{ ready: true, attempts: number }`

### Step 3 — Restore Dump to Local
**Script:** `execution/restoreDumpToLocal.js`

- Accepts: `{ dumpPath }` from Step 1
- MUST read local DB credentials from `.env.dev`
- MUST run `pg_restore` with flags: `--no-owner --no-acl -F c`
- SHOULD tolerate pg_restore exit code 1 (warnings about pre-existing objects are normal)
- MUST treat exit code > 1 as a hard failure
- Returns: `{ restored: true }`

### Step 4 — Switch Env to Local
**Script:** `execution/switchEnvToLocal.js`

- MUST back up the current `.env` to `.env.azure_backup` (overwrite if exists)
- MUST copy `.env.dev` to `.env`
- SHOULD log the backup path and confirm the switch
- Returns: `{ backedUpTo: string, switchedTo: string }`

---

## Outputs

| Output | Notes |
|---|---|
| `azure_dump.dump` | Point-in-time snapshot at project root (gitignored) |
| `.env.azure_backup` | Backup of Azure credentials (gitignored) |
| `.env` | Now points to `localhost` — restart dev server to apply |
| Console log | Step-by-step progress with timing |

---

## Edge Cases

- **`pg_dump` / `pg_restore` not in PATH**: Install PostgreSQL client tools. On Windows,
  add `C:\Program Files\PostgreSQL\15\bin` to your system PATH.
- **Docker not running**: Step 2 will fail immediately. Start Docker Desktop first.
- **Already on local DB**: Step 1 detects `DB_HOST=localhost` and aborts early with a
  message — no dump is wasted.
- **pg_restore warnings (exit 1)**: Normal when restoring into an existing DB that has
  extension tables (e.g. `uuid-ossp`). The script treats this as success.
- **Azure DB already at connection limit**: The dump itself uses one connection. If the
  limit is already exhausted, stop the Azure App Service temporarily, run the dump, then
  restart.
- **Reverting to Azure**: `cp .env.azure_backup .env` then restart dev server.

---

## Learnings

<!-- Dated entries added after each notable execution -->
