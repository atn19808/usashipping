'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const homeClaude = path.join(os.homedir(), '.claude', 'projects', 'qx-test', 'memory', 'note.md');
const { runHook, getHookPath, preToolUse } = require('../lib/hook-runner.cjs');
const { assertBlocked, assertAllowed, assertContains } = require('../lib/assertions.cjs');

const HOOK = getHookPath('path-boundary-block.cjs');
const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const edit = (file_path) => preToolUse('Edit', { file_path });
const write = (file_path) => preToolUse('Write', { file_path, content: 'x' });
const outside = process.platform === 'win32' ? 'C:/Windows/Temp/qx-out.txt' : '/tmp/qx-out.txt';

module.exports = {
  name: 'path-boundary-block',
  tests: [
    {
      name: 'blocks Edit into node_modules/@evershop core',
      fn: async () => {
        const r = await runHook(HOOK, edit(path.join(ROOT, 'node_modules/@evershop/evershop/src/lib/x.js')));
        assertBlocked(r.code);
        assertContains(r.stderr, 'patch-package');
      },
    },
    {
      name: 'blocks Write outside the project root',
      fn: async () => {
        const r = await runHook(HOOK, write(outside));
        assertBlocked(r.code);
        assertContains(r.stderr, 'project boundary');
      },
    },
    { name: 'allows Edit inside extensions/', fn: async () => assertAllowed((await runHook(HOOK, edit(path.join(ROOT, 'extensions/quaxave_custom_cart/bootstrap.js')))).code) },
    { name: 'allows Write into the OS temp dir (scratchpad)', fn: async () => assertAllowed((await runHook(HOOK, write(path.join(os.tmpdir(), 'qx-scratch', 'x.txt')))).code) },
    { name: 'allows Write into ~/.claude (agent memory)', fn: async () => assertAllowed((await runHook(HOOK, write(homeClaude))).code) },
    { name: 'allows Edit of a relative in-project path', fn: async () => assertAllowed((await runHook(HOOK, edit('config/default.json'))).code) },
    { name: 'allows MultiEdit inside the project', fn: async () => assertAllowed((await runHook(HOOK, preToolUse('MultiEdit', { file_path: path.join(ROOT, 'themes/usashipping/global.scss'), edits: [] }))).code) },
    { name: 'ignores non-write tools (Read core is privacy-block\'s job)', fn: async () => assertAllowed((await runHook(HOOK, preToolUse('Read', { file_path: path.join(ROOT, 'node_modules/@evershop/evershop/x.js') }))).code) },
    {
      name: 'patch marker bypasses the core block',
      fn: async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-patch-'));
        try {
          fs.mkdirSync(path.join(dir, 'tmp', 'claude-temp'), { recursive: true });
          fs.writeFileSync(path.join(dir, 'tmp', 'claude-temp', '.patch-active'), '');
          const r = await runHook(HOOK, edit(path.join(dir, 'node_modules/@evershop/evershop/src/x.js')), { env: { CLAUDE_PROJECT_DIR: dir } });
          assertAllowed(r.code, 'patch marker should allow a deliberate core edit');
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      },
    },
  ],
};
