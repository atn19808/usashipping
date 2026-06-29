'use strict';
const { runHook, getHookPath, preToolUse } = require('../lib/hook-runner.cjs');
const { assertBlocked, assertAllowed, assertContains } = require('../lib/assertions.cjs');

const HOOK = getHookPath('privacy-block.cjs');
const read = (file_path) => preToolUse('Read', { file_path });
const bash = (command) => preToolUse('Bash', { command });

module.exports = {
  name: 'privacy-block',
  tests: [
    { name: 'blocks Read .env', fn: async () => assertBlocked((await runHook(HOOK, read('.env'))).code) },
    { name: 'blocks Read path/to/.env', fn: async () => assertBlocked((await runHook(HOOK, read('config/.env'))).code) },
    { name: 'blocks Read .env.production', fn: async () => assertBlocked((await runHook(HOOK, read('.env.production'))).code) },
    { name: 'blocks Read credentials.json', fn: async () => assertBlocked((await runHook(HOOK, read('config/credentials.json'))).code) },
    { name: 'blocks Google service-account JSON', fn: async () => assertBlocked((await runHook(HOOK, read('secrets/fx-service-account.json'))).code) },
    { name: 'blocks Azure .publishsettings', fn: async () => assertBlocked((await runHook(HOOK, read('usashipping-dev.publishsettings'))).code) },
    { name: 'blocks id_rsa', fn: async () => assertBlocked((await runHook(HOOK, read('/home/me/.ssh/id_rsa'))).code) },
    { name: 'blocks `cat .env` via Bash', fn: async () => assertBlocked((await runHook(HOOK, bash('cat .env'))).code) },
    {
      name: 'allows APPROVED:.env',
      fn: async () => {
        const r = await runHook(HOOK, read('APPROVED:.env'));
        assertAllowed(r.code);
        assertContains(r.stderr, 'user-approved');
      },
    },
    { name: 'allows .env.dev (template)', fn: async () => assertAllowed((await runHook(HOOK, read('.env.dev'))).code) },
    { name: 'allows .env.example (template)', fn: async () => assertAllowed((await runHook(HOOK, read('.env.example'))).code) },
    { name: 'allows `cat .env.dev` via Bash', fn: async () => assertAllowed((await runHook(HOOK, bash('cat .env.dev'))).code) },
    { name: 'allows a normal source file', fn: async () => assertAllowed((await runHook(HOOK, read('extensions/quaxave_custom_cart/bootstrap.js'))).code) },
    // Regression: trailing punctuation on a path token must not defeat the safe-template check...
    { name: 'allows .env.sample with a trailing colon in a command', fn: async () => assertAllowed((await runHook(HOOK, bash('git commit -m "edit .env.sample: add keys"'))).code) },
    { name: 'allows .env.dev with a trailing comma', fn: async () => assertAllowed((await runHook(HOOK, read('.env.dev,'))).code) },
    // ...but a real secret with trailing punctuation is STILL blocked.
    { name: 'still blocks .env.production with trailing colon', fn: async () => assertBlocked((await runHook(HOOK, read('.env.production:'))).code) },
    { name: 'still blocks `cat .env;` (trailing semicolon)', fn: async () => assertBlocked((await runHook(HOOK, bash('cat .env;'))).code) },
  ],
};
