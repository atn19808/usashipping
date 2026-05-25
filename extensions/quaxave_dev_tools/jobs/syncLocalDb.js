'use strict';

/**
 * Job: Sync Local Database
 * Directive ref: directives/sync_local_db.md — Steps 1–4
 *
 * Usage:
 *   node extensions/quaxave_dev_tools/jobs/syncLocalDb.js
 */

const path = require('path');

const dumpAzureDatabase    = require('../execution/dumpAzureDatabase');
const startDockerContainer = require('../execution/startDockerContainer');
const restoreDumpToLocal   = require('../execution/restoreDumpToLocal');
const switchEnvToLocal     = require('../execution/switchEnvToLocal');

const PROJECT_ROOT  = path.resolve(__dirname, '../../..');
const ENV_PATH      = path.join(PROJECT_ROOT, '.env');
const DEV_ENV_PATH  = path.join(PROJECT_ROOT, '.env.dev');
const DUMP_PATH     = path.join(PROJECT_ROOT, 'azure_dump.dump');

async function syncLocalDb() {
  console.log('[syncLocalDb] Starting local DB sync');
  const start = Date.now();

  // Step 1 — Dump Azure database
  console.log('\n[syncLocalDb] Step 1 — Dump Azure database');
  const { dumpPath } = await dumpAzureDatabase({ envPath: ENV_PATH, outputPath: DUMP_PATH });

  // Step 2 — Start Docker container and wait for Postgres to be ready
  console.log('\n[syncLocalDb] Step 2 — Start Docker container');
  await startDockerContainer({ projectRoot: PROJECT_ROOT, devEnvPath: DEV_ENV_PATH });

  // Step 3 — Restore dump into local Postgres
  console.log('\n[syncLocalDb] Step 3 — Restore dump to local');
  await restoreDumpToLocal({ dumpPath, devEnvPath: DEV_ENV_PATH });

  // Step 4 — Switch .env to local credentials
  console.log('\n[syncLocalDb] Step 4 — Switch .env to local');
  const { backedUpTo } = await switchEnvToLocal({ projectRoot: PROJECT_ROOT });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n[syncLocalDb] Done in ${elapsed}s`);
  console.log('[syncLocalDb] Restart the dev server: npm run dev');
  console.log(`[syncLocalDb] To revert to Azure: cp ${backedUpTo} ${ENV_PATH}`);
}

syncLocalDb().catch((err) => {
  console.error(`\n[syncLocalDb] Fatal: ${err.message}`);
  process.exit(1);
});
