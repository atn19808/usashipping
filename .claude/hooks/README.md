# QuaXaVe Claude Code hooks — Phase 0 (hard safety floor)

These are the **only** mechanical guardrails in the harness. Per the adoption plan
([docs/research/quaxave-harness-adoption-plan.md](../../docs/research/quaxave-harness-adoption-plan.md)),
governance here is *hooks, not prose*: a hook runs as a real process and can deny a
tool call. The `.claude/rules/*` files are coaching for humans/agents — they do **not** block.

## What actually blocks (exit code 2)

| Hook | Event / matcher | Blocks | Bypass |
|---|---|---|---|
| `git-commit-block.cjs` | PreToolUse · Bash | `git commit` / `push` / `add`. `git push origin dev\|main` warns it **deploys to Azure**. `--amend` is never allowed. | `touch tmp/claude-temp/.commit-skill-active` (set by `/commit`/`/deploy`; not for `--amend`) |
| `path-boundary-block.cjs` | PreToolUse · Edit\|Write\|MultiEdit\|NotebookEdit | writes into `node_modules/@evershop/**` (core is sacred — use patch-package) and writes outside the project root | `touch tmp/claude-temp/.patch-active` (deliberate patch authoring only) |
| `privacy-block.cjs` | PreToolUse · Read\|Edit\|Write\|…\|Bash | reading/writing secrets: `.env`, `credentials*`, Google service-account JSON, `*.publishsettings`, `*.pem/.key`, SSH keys | retry with an `APPROVED:` prefix after the user approves |
| `windows-command-detector.cjs` | PreToolUse · Bash | Windows CMD-isms that break in Git Bash (`dir /b`, `type`, `del`, `copy`, `where`, …). Also rewrites the `\!` bug in `node -e`, and prints non-blocking advisories for Postgres / Puppeteer Chrome friction. | — (use the suggested Unix form) |

Templates `.env.dev` and `.env.example` stay readable. Every hook **fails open** (a thrown
error exits 0) so a bug can never wedge a session.

The coarse `permissions.deny` list in `../settings.json` is a complementary net for
destructive shell commands (`rm -rf /…`, force-push, `git clean -fd`, `media/` deletion) and
core edits. It is glob-based and therefore leaky by nature — the hooks above are the robust layer.

## Tests (the project has no other test framework)

```bash
node .claude/hooks/tests/run-all-tests.cjs
```

Spawns each hook as a child process, pipes a JSON payload to stdin, and asserts the exit code
(`assertBlocked` = 2, `assertAllowed` = 0). Add a suite as `tests/suites/<name>.test.cjs`
exporting `{ name, tests: [{ name, fn }] }`.

## Not yet built (later phases)

EverShop contract lint hooks (route/middleware, config, migration version-bump, patch-package
validity, GraphQL schema-leak) and the Node `evershop-graph` indexer — see the adoption plan.
