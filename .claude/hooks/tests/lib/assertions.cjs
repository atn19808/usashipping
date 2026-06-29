'use strict';
/** Minimal assertion helpers for the hook test suites. */

function assertExitCode(actual, expected, context = '') {
  if (actual !== expected) {
    throw new Error(`Expected exit code ${expected}, got ${actual}${context ? ` (${context})` : ''}`);
  }
}

/** Hook blocked the tool call (exit 2). */
function assertBlocked(code, msg = '') {
  assertExitCode(code, 2, msg || 'expected hook to BLOCK');
}

/** Hook allowed the tool call (exit 0). */
function assertAllowed(code, msg = '') {
  assertExitCode(code, 0, msg || 'expected hook to ALLOW');
}

function assertContains(str, substring, msg = '') {
  if (typeof str !== 'string' || !str.includes(substring)) {
    const preview = typeof str === 'string' ? str.slice(0, 200) : String(str);
    throw new Error(`${msg ? msg + ': ' : ''}expected output to contain "${substring}"\nGot: ${preview}`);
  }
}

function assertTrue(cond, msg = 'expected condition to be true') {
  if (!cond) throw new Error(msg);
}

module.exports = { assertExitCode, assertBlocked, assertAllowed, assertContains, assertTrue };
