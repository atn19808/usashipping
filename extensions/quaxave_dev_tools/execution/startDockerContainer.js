'use strict';

/**
 * Execution: Start Docker Container
 * Directive ref: directives/sync_local_db.md — Step 2
 *
 * @param {{ projectRoot: string, devEnvPath: string }} config
 * @returns {Promise<{ ready: boolean, attempts: number }>}
 */

const { spawn, execFile } = require('child_process');
const fs = require('fs');
const { Client } = require('pg');

const DOCKER_DESKTOP_PATH = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';

function isDockerRunning() {
  return new Promise((resolve) => {
    execFile('docker', ['info'], { timeout: 5000 }, (err) => resolve(!err));
  });
}

async function ensureDockerRunning() {
  if (await isDockerRunning()) return;

  console.log('[startDockerContainer] Docker not running — launching Docker Desktop...');
  spawn(DOCKER_DESKTOP_PATH, [], { detached: true, stdio: 'ignore' }).unref();

  const timeoutMs = 60000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    process.stdout.write('.');
    if (await isDockerRunning()) {
      console.log('\n[startDockerContainer] Docker daemon is ready');
      return;
    }
  }
  throw new Error('[startDockerContainer] Docker Desktop did not start within 60s');
}

async function startDockerContainer({ projectRoot, devEnvPath }) {
  await ensureDockerRunning();

  console.log('[startDockerContainer] Running docker-compose up -d');

  await new Promise((resolve, reject) => {
    const proc = spawn('docker-compose', ['up', '-d'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.stdout.on('data', (d) => process.stdout.write(d));
    proc.stderr.on('data', (d) => process.stderr.write(d));

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`[startDockerContainer] docker-compose exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`[startDockerContainer] Failed to start docker-compose: ${err.message}`));
    });
  });

  // Read local credentials from .env.dev
  const envContent = fs.readFileSync(devEnvPath, 'utf8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_]+)\s*=\s*"?([^"#\n]*)"?\s*$/);
    if (match) env[match[1]] = match[2].trim();
  }

  const { DB_HOST = 'localhost', DB_PORT = '5432', DB_NAME = 'usashipping', DB_USER = 'postgres', DB_PASSWORD = 'password' } = env;

  console.log('[startDockerContainer] Waiting for Postgres to be ready...');

  const timeoutMs = 60000;
  const pollIntervalMs = 1000;
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < timeoutMs) {
    attempts++;
    const client = new Client({
      host: DB_HOST,
      port: parseInt(DB_PORT, 10),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      connectionTimeoutMillis: 1000,
    });

    try {
      await client.connect();
      await client.end();
      console.log(`[startDockerContainer] Postgres ready after ${attempts} attempt(s)`);
      return { ready: true, attempts };
    } catch {
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  throw new Error(`[startDockerContainer] Postgres did not become ready within ${timeoutMs / 1000}s`);
}

module.exports = startDockerContainer;
