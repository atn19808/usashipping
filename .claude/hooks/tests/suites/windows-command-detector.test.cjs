'use strict';
const { runHook, getHookPath, preToolUse } = require('../lib/hook-runner.cjs');
const { assertBlocked, assertAllowed, assertContains } = require('../lib/assertions.cjs');

const HOOK = getHookPath('windows-command-detector.cjs');
const bash = (command) => preToolUse('Bash', { command });

module.exports = {
  name: 'windows-command-detector',
  tests: [
    { name: 'blocks `dir /b`', fn: async () => assertBlocked((await runHook(HOOK, bash('dir /b /s .'))).code) },
    { name: 'blocks `type file.txt`', fn: async () => assertBlocked((await runHook(HOOK, bash('type package.json'))).code) },
    { name: 'blocks `del file`', fn: async () => assertBlocked((await runHook(HOOK, bash('del foo.txt'))).code) },
    { name: 'blocks `copy a b`', fn: async () => assertBlocked((await runHook(HOOK, bash('copy a.txt b.txt'))).code) },
    { name: 'blocks `where node`', fn: async () => assertBlocked((await runHook(HOOK, bash('where node'))).code) },
    { name: 'blocks `rmdir /s`', fn: async () => assertBlocked((await runHook(HOOK, bash('rmdir /s /q build'))).code) },
    { name: 'allows `ls -la`', fn: async () => assertAllowed((await runHook(HOOK, bash('ls -la'))).code) },
    { name: 'allows `cat file`', fn: async () => assertAllowed((await runHook(HOOK, bash('cat package.json'))).code) },
    { name: 'allows `npm run build`', fn: async () => assertAllowed((await runHook(HOOK, bash('npm run build'))).code) },
    {
      name: 'rewrites `\\!` in node -e and allows',
      fn: async () => {
        const r = await runHook(HOOK, bash('node -e "if (1\\!==2) console.log(1)"'));
        assertAllowed(r.code);
        assertContains(r.stdout, 'updatedInput');
      },
    },
    {
      name: 'advises (non-blocking) on pg_dump',
      fn: async () => {
        const r = await runHook(HOOK, bash('pg_dump mydb > dump.sql'));
        assertAllowed(r.code);
        assertContains(r.stderr, 'PATH');
      },
    },
    { name: 'ignores non-Bash tools', fn: async () => assertAllowed((await runHook(HOOK, preToolUse('Read', { file_path: 'x' }))).code) },
  ],
};
