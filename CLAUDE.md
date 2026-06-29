# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EverShop v1.2.2-based e-commerce store ("Qua Xa Ve") for international product shipping. Custom features are implemented as extensions in `extensions/`, not by modifying EverShop core. See `README.md` for full feature list.

## AI harness — what actually blocks (read this)

Governance in this repo is split between **mechanical gates** and **coaching**. Do not confuse them:

- **MECHANICAL (these block tool calls — exit 2):** the `.cjs` hooks in `.claude/hooks/` (`git-commit-block`, `path-boundary-block`, `privacy-block`, `windows-command-detector`) plus the coarse `permissions.deny` list in `.claude/settings.json`. These are the *only* things that stop an action. They are unit-tested: `node .claude/hooks/tests/run-all-tests.cjs`. See [.claude/hooks/README.md](.claude/hooks/README.md).
- **COACHING (advisory — nothing enforces these):** every file under `.claude/rules/` and `.claude/commands/`. They describe conventions; an agent can ignore them. They are guidance, not guarantees.

Consequence: never assume a rule is "enforced." If a constraint matters, it must be a hook (see the roadmap in [docs/research/quaxave-harness-adoption-plan.md](docs/research/quaxave-harness-adoption-plan.md)). Hooks fail **open** by design — a hook error never blocks work.

Notable hook behaviors: commits/pushes require an explicit `tmp/claude-temp/.commit-skill-active` marker; `git push origin dev|main` is a **deploy to Azure**; editing `node_modules/@evershop/**` is blocked (use `patch-package`, or `tmp/claude-temp/.patch-active` for deliberate patches); secret files (`.env`, credentials, `*.publishsettings`) need an `APPROVED:` retry.

## Commands

```bash
npm run dev          # Start dev server (port 3000, requires PostgreSQL running)
npm run build        # Production build
npm run start        # Start production server
npm run admin:create # Create admin user (interactive)
npm run admin:change-pass  # Change admin password

docker-compose up -d # Start local PostgreSQL 15
```

No test framework or linter is configured at the project level.

## Architecture


### Key Imports

```javascript
// Database
const { pool, getConnection } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert, update, del, execute, startTransaction, commit, rollback } = require('@evershop/postgres-query-builder');

// Utilities
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { toPrice } = require('@evershop/evershop/src/modules/checkout/services/toPrice');
const { OK, INVALID_PAYLOAD, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const { emit } = require('@evershop/evershop/src/lib/event');
const { setContextValue, getContextValue } = require('@evershop/evershop/src/lib/util/contextHelper');
```

## Configuration

- `config/default.json` — extension registry, theme, scheduled jobs, address schema
- `.env` — database credentials, Google OAuth, FX rate config (copy from `.env.dev`)
- Theme: `themes/usashipping/` — SCSS globals, page overrides, static assets

## Deployment

- Push to `dev` → Azure dev environment
- Push to `main` → Azure production
- CI/CD: `.github/workflows/az_appservice.yml` runs `npm install && npm run build`
