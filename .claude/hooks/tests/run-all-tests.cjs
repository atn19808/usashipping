#!/usr/bin/env node
'use strict';
/**
 * run-all-tests.cjs — discover and run every suites/*.test.cjs.
 *
 * Each suite module exports: { name, tests: [{ name, fn }] }  (fn may be async).
 * Exit 1 if any test fails. With no project test framework, this IS QuaXaVe's
 * regression net for the hooks. Run:  node .claude/hooks/tests/run-all-tests.cjs
 */

const fs = require('fs');
const path = require('path');

if (!process.env.CLAUDE_PROJECT_DIR) {
  process.env.CLAUDE_PROJECT_DIR = path.resolve(__dirname, '..', '..', '..');
}

const win = process.platform === 'win32';
const PASS = win ? '[PASS]' : '✓';
const FAIL = win ? '[FAIL]' : '✗';

async function runTest(test) {
  const start = Date.now();
  try {
    await test.fn();
    return { name: test.name, passed: true, ms: Date.now() - start };
  } catch (err) {
    return { name: test.name, passed: false, ms: Date.now() - start, error: err.message || String(err) };
  }
}

async function main() {
  const suitesDir = path.join(__dirname, 'suites');
  const files = fs.existsSync(suitesDir)
    ? fs.readdirSync(suitesDir).filter((f) => f.endsWith('.test.cjs'))
    : [];

  let passed = 0;
  let failed = 0;
  const start = Date.now();

  for (const file of files) {
    let suite;
    try {
      suite = require(path.join(suitesDir, file));
    } catch (err) {
      console.log(`\n  ${FAIL} failed to load suite ${file}: ${err.message}`);
      failed++;
      continue;
    }
    console.log(`\n  ${suite.name || file}`);
    for (const test of suite.tests || []) {
      const r = await runTest(test);
      if (r.passed) {
        passed++;
        console.log(`    ${PASS} ${r.name} (${r.ms}ms)`);
      } else {
        failed++;
        console.log(`    ${FAIL} ${r.name} (${r.ms}ms)\n        ${r.error}`);
      }
    }
  }

  const total = passed + failed;
  console.log('\n' + '='.repeat(48));
  console.log(failed === 0 ? ` PASSED  all ${passed} tests` : ` FAILED  ${failed} of ${total} tests failed`);
  console.log(` ${total} tests in ${Date.now() - start}ms`);
  console.log('='.repeat(48) + '\n');

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
