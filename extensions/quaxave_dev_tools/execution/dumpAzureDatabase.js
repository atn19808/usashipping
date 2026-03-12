'use strict';

/**
 * Execution: Dump Azure Database
 * Directive ref: directives/sync_local_db.md — Step 1
 *
 * @param {{ envPath: string, outputPath: string }} config
 * @returns {Promise<{ dumpPath: string }>}
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

async function dumpAzureDatabase({ envPath, outputPath }) {
  // Load credentials from current .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_]+)\s*=\s*"?([^"#\n]*)"?\s*$/);
    if (match) env[match[1]] = match[2].trim();
  }

  const { DB_HOST, DB_PORT = '5432', DB_NAME, DB_USER, DB_PASSWORD } = env;

  if (!DB_HOST || DB_HOST === 'localhost' || DB_HOST === '127.0.0.1') {
    throw new Error('[dumpAzureDatabase] DB_HOST is already localhost — already on local DB, skipping dump');
  }

  if (!DB_NAME || !DB_USER || !DB_PASSWORD) {
    throw new Error('[dumpAzureDatabase] Missing DB_NAME, DB_USER, or DB_PASSWORD in .env');
  }

  console.log(`[dumpAzureDatabase] Connecting to ${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER}`);
  console.log(`[dumpAzureDatabase] Writing dump to ${outputPath}`);

  await new Promise((resolve, reject) => {
    const proc = spawn(
      'pg_dump',
      [
        '-h', DB_HOST,
        '-p', DB_PORT,
        '-U', DB_USER,
        '-d', DB_NAME,
        '--no-owner',
        '--no-acl',
        '-F', 'c',
        '-f', outputPath,
      ],
      {
        env: { ...process.env, PGPASSWORD: DB_PASSWORD },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    proc.stdout.on('data', (d) => process.stdout.write(d));
    proc.stderr.on('data', (d) => process.stderr.write(d));

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`[dumpAzureDatabase] pg_dump exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`[dumpAzureDatabase] Failed to start pg_dump: ${err.message}. Is pg_dump in PATH?`));
    });
  });

  const stat = fs.statSync(outputPath);
  console.log(`[dumpAzureDatabase] Dump complete — ${(stat.size / 1024 / 1024).toFixed(1)} MB`);

  return { dumpPath: outputPath };
}

module.exports = dumpAzureDatabase;
