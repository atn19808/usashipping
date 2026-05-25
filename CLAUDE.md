# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EverShop v1.2.2-based e-commerce store ("Qua Xa Ve") for international product shipping. Custom features are implemented as extensions in `extensions/`, not by modifying EverShop core. See `README.md` for full feature list.

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
