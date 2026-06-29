#!/usr/bin/env node
'use strict';
/**
 * privacy-block.cjs — HARD gate (PreToolUse / Read|Edit|Write|Glob|Grep|Bash)
 *
 * Blocks access to sensitive files unless the user approves and the agent
 * retries with an `APPROVED:` prefix. Tuned to QuaXaVe's real secret surface:
 * .env (proxy creds, FX, DB), Google service-account JSON, Azure publish
 * profiles, SSH/private keys. Templates (.env.dev/.env.example) stay readable.
 *
 * Exit: 0 = allow, 2 = block. Fails OPEN on invalid input / internal error.
 * @hook PreToolUse  @matcher Read|Edit|Write|MultiEdit|Glob|Grep|Bash
 */

const path = require('path');
const { readHookInput } = require('./lib/hook-io.cjs');

const APPROVED_PREFIX = 'APPROVED:';

// Readable templates — exempt from the privacy block.
const SAFE_PATTERNS = [
  /\.example$/i,
  /\.sample$/i,
  /\.template$/i,
  /^\.env\.dev$/i, // QuaXaVe: .env.dev is the committed template devs copy from
];

// Sensitive patterns (matched against basename AND full normalized path).
const PRIVACY_PATTERNS = [
  /^\.env$/,                    // .env
  /^\.env\./,                   // .env.local, .env.production, ...
  /\.env$/,                     // path/to/.env
  /\/\.env\./,                  // path/to/.env.local
  /credentials/i,               // credentials.json
  /service[-_]?account.*\.json$/i, // Google service-account JSON (FX/Sheets)
  /\.publishsettings$/i,        // Azure publish profile
  /secrets?\.ya?ml$/i,          // secrets.yaml / secret.yml
  /\.pem$/,                     // private keys
  /\.key$/,                     // private keys
  /id_rsa/,                     // SSH keys
  /id_ed25519/,                 // SSH keys
];

function isSafeFile(p) {
  if (!p) return false;
  return SAFE_PATTERNS.some((re) => re.test(path.basename(p)));
}

function hasApproval(p) {
  return typeof p === 'string' && p.startsWith(APPROVED_PREFIX);
}

function stripApproval(p) {
  return hasApproval(p) ? p.slice(APPROVED_PREFIX.length) : p;
}

function isSensitive(p) {
  if (!p) return false;
  let norm = stripApproval(p).replace(/\\/g, '/');
  try {
    norm = decodeURIComponent(norm);
  } catch {
    /* keep as-is on bad encoding */
  }
  // Strip surrounding markup / sentence punctuation a path token can pick up in
  // prose or commands (e.g. ".env.sample:", "(.env.dev),", "`.env`") so the
  // safe-template check isn't defeated by a trailing ':' or ',' — and so a real
  // secret with trailing punctuation still matches the sensitive patterns.
  norm = norm.replace(/^[(`]+/, '').replace(/[)\].,:;!?`}]+$/, '');
  if (isSafeFile(norm)) return false;
  const base = path.basename(norm);
  return PRIVACY_PATTERNS.some((re) => re.test(base) || re.test(norm));
}

function extractPaths(toolInput) {
  const out = [];
  if (!toolInput) return out;
  for (const field of ['file_path', 'path', 'pattern', 'notebook_path']) {
    if (toolInput[field]) out.push(toolInput[field]);
  }
  if (toolInput.command) {
    const cmd = toolInput.command;
    const approved = cmd.match(/APPROVED:[^\s'"]+/g) || [];
    if (approved.length) {
      out.push(...approved);
    } else {
      (cmd.match(/[^\s'"=]*\.env[^\s'"]*/g) || []).forEach((m) => out.push(m));
      (cmd.match(/[^\s'"]*(?:service[-_]?account[^\s'"]*\.json|\.publishsettings|\.pem|id_rsa|id_ed25519)/gi) || [])
        .forEach((m) => out.push(m));
    }
  }
  return out.filter(Boolean);
}

function blockMessage(p) {
  return [
    '',
    'NOTE: not an error — this block protects sensitive data.',
    '',
    `PRIVACY BLOCK: "${p}" may contain secrets (keys, passwords, tokens, deploy creds).`,
    '',
    `  Ask the user: "I need to access ${path.basename(p)} which may hold secrets. Approve?"`,
    `  If YES: retry with the prefix  ->  APPROVED:${p}`,
    '  If NO:  do not retry; continue without it.',
    '',
  ].join('\n');
}

function main() {
  try {
    const input = readHookInput();
    const paths = extractPaths(input.tool_input);
    for (const p of paths) {
      if (!isSensitive(p)) continue;
      if (hasApproval(p)) {
        console.error(`✓ Privacy: user-approved access to ${path.basename(stripApproval(p))}`);
        continue;
      }
      console.error(blockMessage(p));
      process.exit(2);
    }
    process.exit(0);
  } catch (err) {
    console.error(`privacy-block error: ${err.message}`);
    process.exit(0); // fail open
  }
}

main();

module.exports = { isSafeFile, isSensitive, hasApproval, stripApproval, extractPaths };
