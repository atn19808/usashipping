'use strict';

/**
 * Execution: Restore Dump to Local
 * Directive ref: directives/sync_local_db.md — Step 3
 *
 * @param {{ dumpPath: string, devEnvPath: string }} config
 * @returns {Promise<{ restored: boolean }>}
 */

const { spawn } = require('child_process');
const fs = require('fs');
const { Client } = require('pg');

async function restoreDumpToLocal({ dumpPath, devEnvPath }) {
  // Read local credentials from .env.dev
  const envContent = fs.readFileSync(devEnvPath, 'utf8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_]+)\s*=\s*"?([^"#\n]*)"?\s*$/);
    if (match) env[match[1]] = match[2].trim();
  }

  const { DB_HOST = 'localhost', DB_PORT = '5432', DB_NAME = 'usashipping', DB_USER = 'postgres', DB_PASSWORD = 'password' } = env;

  // Drop and recreate DB for a clean restore (avoids conflicts with pre-existing data)
  console.log(`[restoreDumpToLocal] Dropping and recreating ${DB_NAME} for clean restore...`);
  const admin = new Client({
    host: DB_HOST, port: parseInt(DB_PORT, 10),
    database: 'postgres', user: DB_USER, password: DB_PASSWORD,
  });
  await admin.connect();
  await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`, [DB_NAME]);
  await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
  await admin.query(`CREATE DATABASE "${DB_NAME}"`);
  await admin.end();
  console.log(`[restoreDumpToLocal] Database recreated`);

  console.log(`[restoreDumpToLocal] Restoring ${dumpPath} → ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  const exitCode = await new Promise((resolve, reject) => {
    const proc = spawn(
      'pg_restore',
      [
        '-h', DB_HOST,
        '-p', DB_PORT,
        '-U', DB_USER,
        '-d', DB_NAME,
        '--no-owner',
        '--no-acl',
        '-F', 'c',
        dumpPath,
      ],
      {
        env: { ...process.env, PGPASSWORD: DB_PASSWORD },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    proc.stdout.on('data', (d) => process.stdout.write(d));
    proc.stderr.on('data', (d) => process.stderr.write(d));

    proc.on('close', (code) => resolve(code));
    proc.on('error', (err) => {
      reject(new Error(`[restoreDumpToLocal] Failed to start pg_restore: ${err.message}. Is pg_restore in PATH?`));
    });
  });

  if (exitCode !== 0) {
    throw new Error(`[restoreDumpToLocal] pg_restore exited with code ${exitCode} — restore failed`);
  }

  console.log('[restoreDumpToLocal] Restore complete');
  return { restored: true };
}

module.exports = restoreDumpToLocal;
