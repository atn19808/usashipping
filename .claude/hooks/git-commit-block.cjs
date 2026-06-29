#!/usr/bin/env node
'use strict';
/**
 * git-commit-block.cjs — HARD gate (PreToolUse / Bash)
 *
 * Blocks `git commit`, `git push`, and `git add` unless the /commit (or /deploy)
 * skill marker exists. `git commit --amend` is NEVER allowed (no bypass).
 *
 * Detection parses each shell statement's git invocation and SKIPS git global
 * options that precede the subcommand (`-C <path>`, `-c k=v`, `--no-pager`, …),
 * so `git -C /path push` can't slip past a naive `git push` regex.
 *
 * QuaXaVe note: `git push origin dev|main` IS a deploy (dev -> Azure dev,
 * main -> Azure prod) and gets an extra-loud warning.
 *
 * Exit: 0 = allow, 2 = block. Fails OPEN on internal error.
 * @hook PreToolUse  @matcher Bash
 */

const fs = require('fs');
const path = require('path');
const { readHookInput, projectRoot } = require('./lib/hook-io.cjs');

const MARKER_REL = 'tmp/claude-temp/.commit-skill-active';
const MARKER = path.join(projectRoot(), 'tmp', 'claude-temp', '.commit-skill-active');

const ALLOWED_SUBCOMMANDS = new Set([
  'status', 'diff', 'log', 'show', 'branch', 'stash', 'remote', 'fetch',
  'rev-parse', 'describe', 'tag', 'blame', 'check-ignore', 'ls-files',
  'ls-tree', 'restore', 'shortlog', 'whatchanged', 'config',
]);

// git GLOBAL options that may appear BEFORE the subcommand. Some consume the
// next token as their argument (so we must skip two tokens, not one).
const GLOBAL_FLAG_WITH_ARG = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix']);
const GLOBAL_FLAG_BOOL = new Set([
  '-p', '--paginate', '-P', '--no-pager', '--bare', '--no-replace-objects',
  '--literal-pathspecs', '--glob-pathspecs', '--noglob-pathspecs', '--icase-pathspecs', '--no-optional-locks',
]);

const REASONS = {
  'git commit': 'Commits must be explicitly requested by the user (use the /commit skill).',
  'git push': 'Pushes must be explicitly requested by the user.',
  'git add': 'Staging files must be explicitly requested by the user (use the /commit skill).',
};

function tokenize(s) {
  return s.match(/"[^"]*"|'[^']*'|\S+/g) || [];
}

/**
 * Parse each shell statement that invokes git → [{ subcommand, args }].
 * Skips leading git global options so the real subcommand is found regardless
 * of `-C`/`-c`/`--no-pager`/etc. positioning.
 */
function parseGitInvocations(command) {
  const invs = [];
  for (const stmt of command.split(/&&|\|\||[;\n|]/)) {
    const m = stmt.trim().match(/^git\b(.*)$/s);
    if (!m) continue;
    const tokens = tokenize(m[1]);
    let i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      if (GLOBAL_FLAG_WITH_ARG.has(t)) { i += 2; continue; }            // flag + its argument
      if (/^(--git-dir|--work-tree|--namespace|--exec-path|--super-prefix)=/.test(t)) { i += 1; continue; } // --flag=value
      if (/^-c./.test(t)) { i += 1; continue; }                         // -ckey=val joined form (rare)
      if (GLOBAL_FLAG_BOOL.has(t)) { i += 1; continue; }
      if (t.startsWith('-')) { i += 1; continue; }                      // unknown global flag — skip defensively
      break;                                                            // first non-flag token = subcommand
    }
    if (i < tokens.length) invs.push({ subcommand: tokens[i], args: tokens.slice(i + 1) });
  }
  return invs;
}

function isReadOnly(g) {
  return ALLOWED_SUBCOMMANDS.has(g.subcommand)
    || (g.subcommand === 'reset' && g.args[0] === 'HEAD')
    || (g.subcommand === 'add' && (g.args.includes('--dry-run') || g.args.includes('-n')));
}

function findBlocked(invs) {
  // --amend first — never bypassable, even with the marker.
  for (const g of invs) {
    if (g.subcommand === 'commit' && g.args.includes('--amend')) return { name: 'git commit --amend', amend: true };
  }
  for (const g of invs) {
    if (g.subcommand === 'commit') return { name: 'git commit' };
    if (g.subcommand === 'push') return { name: 'git push', deploy: g.args.some((a) => /(^|:)(dev|main)$/.test(a)) };
    if (g.subcommand === 'add' && !(g.args.includes('--dry-run') || g.args.includes('-n'))) return { name: 'git add' };
  }
  return null;
}

function markerActive() {
  try {
    return fs.existsSync(MARKER);
  } catch {
    return false;
  }
}

function amendMessage() {
  return [
    '[BLOCKED] git commit --amend — Amending is NEVER allowed; create a NEW commit. Amend corrupts history when HEAD has moved.',
    '',
    'This block cannot be bypassed.',
  ].join('\n');
}

function blockMessage(blocked) {
  return [
    `[BLOCKED] ${blocked.name} — ${REASONS[blocked.name]}`,
    blocked.deploy ? '\n⚠️  This push targets dev/main — it DEPLOYS to Azure. Be certain the user asked for a deploy.' : '',
    '',
    'If the user EXPLICITLY asked you to commit/push/deploy, activate the bypass first:',
    `  1. mkdir -p "$(git rev-parse --show-toplevel)/tmp/claude-temp" && touch "$(git rev-parse --show-toplevel)/${MARKER_REL}"`,
    '  2. Retry your git command',
    `  3. When done: rm -f "$(git rev-parse --show-toplevel)/${MARKER_REL}"`,
    '',
    'If the user did NOT ask — do NOT create the bypass. Report your changes and wait.',
    'Always allowed: status, diff, log, show, branch, fetch, restore, reset HEAD.',
  ].filter(Boolean).join('\n');
}

function main() {
  try {
    const input = readHookInput();
    if (input.tool_name !== 'Bash') process.exit(0);

    const command = input.tool_input?.command || '';
    if (!/\bgit\b/.test(command)) process.exit(0);

    const invs = parseGitInvocations(command);
    if (invs.length === 0) process.exit(0);
    if (invs.every(isReadOnly)) process.exit(0);

    const blocked = findBlocked(invs);
    if (!blocked) process.exit(0);

    if (blocked.amend) {
      console.error(amendMessage());
      process.exit(2);
    }
    if (markerActive()) process.exit(0);

    console.error(blockMessage(blocked));
    process.exit(2);
  } catch (err) {
    console.error(`git-commit-block error: ${err.message}`);
    process.exit(0); // fail open
  }
}

main();

module.exports = { parseGitInvocations, isReadOnly, findBlocked };
