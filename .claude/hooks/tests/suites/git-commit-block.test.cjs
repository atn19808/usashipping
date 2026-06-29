'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runHook, getHookPath, preToolUse } = require('../lib/hook-runner.cjs');
const { assertBlocked, assertAllowed, assertContains } = require('../lib/assertions.cjs');

const HOOK = getHookPath('git-commit-block.cjs');
const bash = (command) => preToolUse('Bash', { command });

module.exports = {
  name: 'git-commit-block',
  tests: [
    { name: 'blocks `git commit`', fn: async () => assertBlocked((await runHook(HOOK, bash('git commit -m "x"'))).code) },
    { name: 'blocks `git push`', fn: async () => assertBlocked((await runHook(HOOK, bash('git push'))).code) },
    { name: 'blocks `git add .`', fn: async () => assertBlocked((await runHook(HOOK, bash('git add .'))).code) },
    {
      name: 'blocks `git commit --amend` (never bypassable)',
      fn: async () => {
        const r = await runHook(HOOK, bash('git commit --amend'));
        assertBlocked(r.code);
        assertContains(r.stderr, 'cannot be bypassed');
      },
    },
    {
      name: 'push to dev warns it deploys to Azure',
      fn: async () => {
        const r = await runHook(HOOK, bash('git push origin dev'));
        assertBlocked(r.code);
        assertContains(r.stderr, 'DEPLOYS to Azure');
      },
    },
    // Regression: global flags before the subcommand must not evade detection.
    { name: 'blocks `git -C <path> push` (global flag before subcommand)', fn: async () => assertBlocked((await runHook(HOOK, bash('git -C /tmp/x push origin dev'))).code) },
    { name: 'blocks `git --no-pager push`', fn: async () => assertBlocked((await runHook(HOOK, bash('git --no-pager push'))).code) },
    { name: 'blocks `git -c user.email=… commit`', fn: async () => assertBlocked((await runHook(HOOK, bash('git -c user.email=a@b.co commit -m y'))).code) },
    { name: '`git -C <path> push origin dev` still warns it deploys', fn: async () => { const r = await runHook(HOOK, bash('git -C /tmp/x push origin dev')); assertBlocked(r.code); assertContains(r.stderr, 'DEPLOYS to Azure'); } },
    { name: 'allows `git -C <path> status` (read-only despite global flag)', fn: async () => assertAllowed((await runHook(HOOK, bash('git -C /tmp/x status'))).code) },
    { name: 'allows `git status`', fn: async () => assertAllowed((await runHook(HOOK, bash('git status'))).code) },
    { name: 'allows `git diff` + `git log` chain', fn: async () => assertAllowed((await runHook(HOOK, bash('git diff && git log --oneline'))).code) },
    { name: 'allows `git reset HEAD`', fn: async () => assertAllowed((await runHook(HOOK, bash('git reset HEAD file.js'))).code) },
    { name: 'ignores "git commit" inside an echo string', fn: async () => assertAllowed((await runHook(HOOK, bash('echo "remember to git commit later"'))).code) },
    { name: 'ignores non-Bash tools', fn: async () => assertAllowed((await runHook(HOOK, preToolUse('Read', { file_path: 'README.md' }))).code) },
    {
      name: 'allows commit when the marker is active',
      fn: async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-commit-'));
        try {
          fs.mkdirSync(path.join(dir, 'tmp', 'claude-temp'), { recursive: true });
          fs.writeFileSync(path.join(dir, 'tmp', 'claude-temp', '.commit-skill-active'), '');
          const r = await runHook(HOOK, bash('git commit -m "x"'), { env: { CLAUDE_PROJECT_DIR: dir } });
          assertAllowed(r.code, 'marker should bypass commit block');
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      },
    },
    {
      name: 'marker does NOT bypass --amend',
      fn: async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-commit-'));
        try {
          fs.mkdirSync(path.join(dir, 'tmp', 'claude-temp'), { recursive: true });
          fs.writeFileSync(path.join(dir, 'tmp', 'claude-temp', '.commit-skill-active'), '');
          const r = await runHook(HOOK, bash('git commit --amend'), { env: { CLAUDE_PROJECT_DIR: dir } });
          assertBlocked(r.code, '--amend must stay blocked even with marker');
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      },
    },
  ],
};
