'use strict';
/**
 * hook-io.cjs — tiny shared helpers for QuaXaVe Claude Code hooks.
 *
 * Every hook is a standalone `.cjs` invoked by Claude Code at a lifecycle event.
 * It receives ONE JSON payload on stdin and signals via exit code:
 *   0 = allow / continue   2 = block (stderr is shown to the model)
 *
 * Keep this file dependency-free and small. Hooks must FAIL OPEN — a thrown
 * error should never wedge a session — so callers wrap their logic accordingly.
 */

const fs = require('fs');

/**
 * Read + parse the hook's stdin JSON payload synchronously.
 * Returns {} on empty/invalid input (so a malformed payload fails open).
 * @returns {object}
 */
function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf-8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Absolute project root, from Claude Code's env or cwd. */
function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

module.exports = { readHookInput, projectRoot };
