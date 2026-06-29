#!/usr/bin/env node
'use strict';
/**
 * windows-command-detector.cjs — HARD gate (PreToolUse / Bash)
 *
 * QuaXaVe dev is Windows 11 / PowerShell, but Claude Code runs Bash commands in
 * Git Bash (MINGW64). Windows CMD-isms silently misbehave there. This hook
 * BLOCKS (exit 2) those, rewrites the `\!` escaping bug in `node -e "..."`, and
 * emits NON-blocking advisories for QuaXaVe's documented Postgres/Chrome friction.
 *
 * Exit: 0 = allow, 2 = block. Fails OPEN on internal error.
 * @hook PreToolUse  @matcher Bash
 */

const { readHookInput } = require('./lib/hook-io.cjs');

// Windows CMD commands that break in Git Bash — hard block with the Unix fix.
const CMD_PATTERNS = [
  { pattern: /^dir\s+\/[a-zA-Z]/, name: 'dir with flags', unix: 'find <path> -type f  (or: ls <path>)' },
  { pattern: /^type\s+/, name: 'type (view file)', unix: 'cat file.txt' },
  { pattern: /^copy\s+/, name: 'copy', unix: 'cp src dst' },
  { pattern: /^move\s+/, name: 'move', unix: 'mv src dst' },
  { pattern: /^del\s+/, name: 'del', unix: 'rm file.txt' },
  { pattern: /^rmdir\s+\/[sS]/, name: 'rmdir /s', unix: 'rm -rf path' },
  { pattern: /^where\s+/, name: 'where', unix: 'which <cmd>' },
  { pattern: /^set\s+\w+=.*/, name: 'set (env var)', unix: 'export VAR=value' },
  { pattern: /^cls$/, name: 'cls', unix: 'clear' },
  { pattern: /^ren\s+/, name: 'ren (rename)', unix: 'mv old new' },
  { pattern: /^attrib\s+/, name: 'attrib', unix: 'chmod ...' },
  { pattern: /^findstr\s+/, name: 'findstr', unix: 'grep pattern file' },
];

// QuaXaVe-specific NON-blocking advisories (exit 0, just a stderr nudge).
const ADVISORIES = [
  {
    pattern: /\b(pg_dump|pg_restore|psql|createdb|dropdb)\b/,
    note: 'PostgreSQL CLI: on Windows ensure "C:\\Program Files\\PostgreSQL\\15\\bin" is on PATH (the sync_local_db footgun), or call the binary by full path.',
  },
  {
    pattern: /\bnode\b[^\n]*\b(smokeTestStealth|scrapeProductPage|puppeteer)\b/,
    note: 'Puppeteer run: confirm the scraper resolves the stable system Chrome path (not the bundled canary) — the documented Windows "spawn UNKNOWN" fix.',
  },
];

function blockMessage(command, match) {
  const cmd = command.length > 80 ? `${command.slice(0, 80)}...` : command;
  return [
    '## ⚠️ Windows CMD syntax detected',
    '',
    `**Command:** \`${match.name}\`  ·  **You ran:** \`${cmd}\``,
    '',
    'Claude Code runs Bash commands in Git Bash (MINGW64), not Windows CMD.',
    `**Use instead:** \`${match.unix}\``,
  ].join('\n');
}

function main() {
  try {
    const input = readHookInput();
    if (input.tool_name !== 'Bash') process.exit(0);

    const command = input.tool_input?.command || '';

    // Fix `\!` in node -e double-quoted commands (bash history-escape -> invalid JS escape).
    if (/node\s+(?:-[^\s]*\s+)*-e\s+"[^"]*\\!/.test(command)) {
      console.log(JSON.stringify({ updatedInput: { command: command.replace(/\\!/g, '!') } }));
      process.exit(0);
    }

    const match = CMD_PATTERNS.find((p) => p.pattern.test(command));
    if (match) {
      console.error(blockMessage(command, match));
      process.exit(2);
    }

    // Non-blocking advisories.
    const advisory = ADVISORIES.find((a) => a.pattern.test(command));
    if (advisory) console.error(`[advisory] ${advisory.note}`);

    process.exit(0);
  } catch (err) {
    console.error(`windows-command-detector error: ${err.message}`);
    process.exit(0); // fail open
  }
}

main();
