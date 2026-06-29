'use strict';
/**
 * hook-runner.cjs — spawn a hook as a real child process, pipe a JSON payload
 * to stdin, and capture {code, stdout, stderr, timedOut}. This is the QuaXaVe
 * harness's only automated regression net (the project has no test framework).
 */

const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_TIMEOUT = 10000;

/**
 * @param {string} hookPath absolute path to the hook .cjs
 * @param {object} input    payload sent as JSON on stdin
 * @param {object} [options] { cwd, env, timeout }
 * @returns {Promise<{code:number, stdout:string, stderr:string, timedOut:boolean}>}
 */
function runHook(hookPath, input, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  return new Promise((resolve) => {
    const proc = spawn('node', [hookPath], {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        timedOut = true;
        proc.kill('SIGKILL');
      }
    }, timeout);

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ code: code ?? (timedOut ? -1 : 1), stdout, stderr, timedOut });
    });

    proc.on('error', (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: `${stderr}\n${err.message}`, timedOut });
    });

    if (input !== undefined) proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

/** Absolute path to a hook in .claude/hooks/. */
function getHookPath(hookName) {
  return path.resolve(__dirname, '..', '..', hookName);
}

/** Build a PreToolUse payload. */
function preToolUse(toolName, toolInput) {
  return { hook_event_name: 'PreToolUse', tool_name: toolName, tool_input: toolInput };
}

module.exports = { runHook, getHookPath, preToolUse, DEFAULT_TIMEOUT };
