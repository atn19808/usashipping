'use strict';

/**
 * Execution: Switch Env to Local
 * Directive ref: directives/sync_local_db.md — Step 4
 *
 * @param {{ projectRoot: string }} config
 * @returns {Promise<{ backedUpTo: string, switchedTo: string }>}
 */

const path = require('path');
const fs = require('fs');

async function switchEnvToLocal({ projectRoot }) {
  const envPath        = path.join(projectRoot, '.env');
  const devEnvPath     = path.join(projectRoot, '.env.dev');
  const backupEnvPath  = path.join(projectRoot, '.env.azure_backup');

  if (!fs.existsSync(devEnvPath)) {
    throw new Error(`[switchEnvToLocal] .env.dev not found at ${devEnvPath}`);
  }

  // Back up current .env
  fs.copyFileSync(envPath, backupEnvPath);
  console.log(`[switchEnvToLocal] Backed up .env → ${backupEnvPath}`);

  // Copy .env.dev → .env
  fs.copyFileSync(devEnvPath, envPath);
  console.log(`[switchEnvToLocal] Switched .env to local credentials (from .env.dev)`);
  console.log(`[switchEnvToLocal] To revert: cp .env.azure_backup .env`);

  return { backedUpTo: backupEnvPath, switchedTo: envPath };
}

module.exports = switchEnvToLocal;
