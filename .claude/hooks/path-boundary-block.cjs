#!/usr/bin/env node
'use strict';
/**
 * path-boundary-block.cjs — HARD gate (PreToolUse / Edit|Write|MultiEdit|NotebookEdit)
 *
 * Two boundaries, security-critical (no APPROVED: override):
 *   1. EverShop core is sacred — block edits/writes into node_modules/@evershop/**.
 *      The ONLY sanctioned way to change core is patch-package. A deliberate
 *      patch can bypass via the tmp/claude-temp/.patch-active marker.
 *   2. No writes outside the project root.
 *
 * Exit: 0 = allow, 2 = block. Fails OPEN on internal error.
 * @hook PreToolUse  @matcher Edit|Write|MultiEdit|NotebookEdit
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { readHookInput, projectRoot } = require('./lib/hook-io.cjs');

const PATCH_MARKER = path.join(projectRoot(), 'tmp', 'claude-temp', '.patch-active');

// Only gate write-class tools. Reading EverShop core is legitimate and constant;
// this hook protects against WRITES, not reads. (Defense-in-depth even if the
// settings matcher is ever broadened.)
const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);

function patchModeActive() {
  try {
    return fs.existsSync(PATCH_MARKER);
  } catch {
    return false;
  }
}

/** Normalize for comparison: MSYS->drive, forward slashes, lowercase (Windows-friendly). */
function normalize(p) {
  if (!p) return '';
  let s = p.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  // Git Bash /c/Users/... -> c:/Users/...
  const msys = s.match(/^\/([a-zA-Z])\/(.*)$/);
  if (msys) s = `${msys[1]}:/${msys[2]}`;
  return s.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function resolveTarget(p, root) {
  const decoded = (() => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  })();
  const msys = decoded.match(/^\/([a-zA-Z])\/(.*)$/);
  const fixed = msys ? `${msys[1]}:/${msys[2]}` : decoded;
  const abs = path.isAbsolute(fixed) ? path.resolve(fixed) : path.resolve(root, fixed);
  return normalize(abs);
}

function isWithin(target, dir) {
  return target === dir || target.startsWith(dir + '/');
}

/**
 * Dirs that writes are allowed into: the project root PLUS Claude's own managed
 * areas — ~/.claude (agent memory/config) and the OS temp dir (scratchpad). These
 * are legitimate out-of-root write targets; everything else is blocked.
 */
function buildAllowlist() {
  return [projectRoot(), path.join(os.homedir(), '.claude'), os.tmpdir()]
    .map(normalize)
    .filter(Boolean);
}

function extractTargets(toolInput) {
  const out = [];
  if (!toolInput) return out;
  if (toolInput.file_path) out.push(toolInput.file_path);
  if (toolInput.notebook_path) out.push(toolInput.notebook_path);
  if (Array.isArray(toolInput.edits)) {
    for (const e of toolInput.edits) if (e && e.file_path) out.push(e.file_path);
  }
  return out.filter(Boolean);
}

function coreBlockMessage(p) {
  return [
    `[BLOCKED] Edit to EverShop core: ${p}`,
    '',
    'node_modules/@evershop/** is vendor code — editing it directly is lost on the next `npm install`.',
    'The sanctioned way to change core is patch-package:',
    '  1. Make your edit in node_modules/@evershop/evershop, then run:  npx patch-package @evershop/evershop',
    '  2. Commit the regenerated patches/@evershop+evershop+1.2.2.patch',
    '',
    'If you are intentionally authoring a patch, activate the bypass first:',
    '  mkdir -p tmp/claude-temp && touch tmp/claude-temp/.patch-active   (remove it when done)',
  ].join('\n');
}

function boundaryBlockMessage(p, root) {
  return [
    `[BLOCKED] Write outside the project boundary: ${p}`,
    '',
    `Writes must stay within the project root (${root}), ~/.claude, or the OS temp dir.`,
    'Use the scratchpad for temp files; do not write to arbitrary filesystem locations.',
  ].join('\n');
}

function main() {
  try {
    const input = readHookInput();
    if (!WRITE_TOOLS.has(input.tool_name)) process.exit(0);
    const allow = buildAllowlist();
    const targets = extractTargets(input.tool_input);

    for (const t of targets) {
      const resolved = resolveTarget(t, projectRoot());
      if (!resolved) continue;

      if (/\/node_modules\/@evershop\//.test(resolved)) {
        if (patchModeActive()) continue; // deliberate patch authoring
        console.error(coreBlockMessage(t));
        process.exit(2);
      }

      if (!allow.some((dir) => isWithin(resolved, dir))) {
        console.error(boundaryBlockMessage(t, projectRoot()));
        process.exit(2);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(`path-boundary-block error: ${err.message}`);
    process.exit(0); // fail open
  }
}

main();

module.exports = { normalize, resolveTarget, isWithin, extractTargets, buildAllowlist };
