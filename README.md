# usashipping — Qua Xa Ve

E-commerce store built on [EverShop v1.2.2](https://evershop.io/), an open-source Node.js/React commerce framework. Branded as **Qua Xa Ve** and hosted at https://quaxave.com, the platform focuses on international product shipping with weight-based pricing and multi-vendor product catalog support.

---

## Documents

- [Deployment](dev-docs/AZ_DEPLOYMENT.md)
- [EverShop Settings](dev-docs/EVERSHOP_CHANGE_SETTINGS.md)
- [Google SSO Setup](dev-docs/GOOGLE_SSO_SETUP.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express (via EverShop), GraphQL |
| Database | PostgreSQL 15 |
| Frontend | React, Tailwind CSS, URQL (GraphQL client) |
| Auth | Google OAuth (`@evershop/google_login`) + custom login |
| Deployment | Azure App Service via GitHub Actions |
| Process Manager | PM2 (`ecosystem.config.js`) |
| Dev Environment | Docker Compose (local Postgres), Nix/direnv, mise |

---

## Project Structure

```
usashipping/
├── config/
│   └── default.json             # Extension registry, theme config, scheduled jobs
├── extensions/                  # Custom npm workspace packages (see below)
├── src/modules/priceSync/       # Standalone price sync tools
│   └── tools/testFullSpreadsheet.js
├── themes/usashipping/          # Custom theme (SCSS, React pages, favicon)
├── .github/workflows/           # CI/CD pipeline (Azure App Service)
├── docker-compose.yml           # Local PostgreSQL 15 setup
├── Dockerfile                   # Production container (node:18-alpine)
├── ecosystem.config.js          # PM2 process configuration
└── package.json                 # Root package + npm workspaces
```

---

## Custom Extensions

Extensions are registered and priority-ordered in [`config/default.json`](config/default.json). Each extension can contribute React pages (admin + storefront), GraphQL schema additions, REST API routes, database migrations, background jobs, and processor hooks.

| Priority | Extension | Description |
|---|---|---|
| 10 | `quaxave_custom_login` | Custom login form and checkout customer info step |
| 20 | `google_login` | Google OAuth SSO (via `@evershop/google_login`) |
| 30 | `quaxave_custom_product_view` | Product weight display, category and search page UI |
| 50 | `quaxave_custom_address` | Sender + recipient address separation across cart, customer, and order |
| 60 | `quaxave_fetch_pricing` | Fetches USD→VND exchange rate every 12h, stores in `fx_rate` table |
| 70 | `quaxave_weight_base_shipping` | Weight-based shipping calculator (flat rate, weight tiers, price tiers, external API) |
| 90 | `quaxave_custom_cart` | Cart UI, COD/Zelle payment, admin order management |
| 100 | `quaxave_product_importer` | Import Costco products via Puppeteer scraping (admin Product Import page + scrape/import APIs) |
| 110 | `quaxave_sync_product_pricing` | Product price sync — scrape live Costco prices, stage for admin review (in progress) |

### Extension Structure

Each extension follows this layout:

```
extensions/<name>/
├── package.json
├── bootstrap.js         # Registers processors/hooks on startup
├── api/                 # REST route handlers (route.json + middleware chain)
├── graphql/types/       # GraphQL schema definitions and resolvers
├── migration/           # Versioned DB migrations (Version-x.x.x.js)
├── pages/admin/         # Admin panel React pages
├── pages/frontStore/    # Customer-facing React pages
├── components/          # Reusable React components
├── services/            # Business logic
└── jobs/                # Cron-scheduled background jobs
```

Middleware files use the naming convention: `[context]functionName[auth].js`

---

## Key Features

### Address System
Custom sender + recipient fields on every address entity, supporting international shipping where the shipper and receiver are different contacts.
- Added columns: `sender_full_name`, `sender_telephone` on `cart_address`, `customer_address`, `order_address`
- Migrations: [`extensions/quaxave_custom_address/migration/`](extensions/quaxave_custom_address/migration/)
- GraphQL types extended for Cart, Customer, Order, and Status contexts

### Shipping Engine
Hooks into EverShop's cart processor pipeline and replaces the default shipping fee calculation with a multi-strategy resolver:
1. Flat rate
2. Weight-based tiers
3. Rate per lb
4. Price-based tiers
5. External API call
- REST endpoints: `POST/GET/PUT /shippingZones/:id/methods`
- Service: [`extensions/quaxave_weight_base_shipping/services/newShippingCostMethod.js`](extensions/quaxave_weight_base_shipping/services/newShippingCostMethod.js)

### Exchange Rate (FX)
A cron job fetches USD→VND rates every 12 hours from a public currency API (with fallback source) and stores them in the `fx_rate` table.
- Job: [`extensions/quaxave_fetch_pricing/jobs/fetchRate.js`](extensions/quaxave_fetch_pricing/jobs/fetchRate.js)
- GraphQL query: `fxRate(source: String, target: String): FxRate`

### Price Scraping
Infrastructure for pulling Costco/Walmart product prices from Google Sheets with configurable markup logic.
- Costco markup: 15% (default), Walmart markup: 12%
- Test tool: [`src/modules/priceSync/tools/testFullSpreadsheet.js`](src/modules/priceSync/tools/testFullSpreadsheet.js)

### Payment
Cash on Delivery (COD) with Zelle branding. Auto-triggers order placement when all checkout steps are complete.
- Component: [`extensions/quaxave_custom_cart/pages/frontStore/checkout/CashOnDelivery.jsx`](extensions/quaxave_custom_cart/pages/frontStore/checkout/CashOnDelivery.jsx)

---

## Getting Started

### Prerequisites
- Node.js 20.18.2 (see `.nvmrc`)
- PostgreSQL 15 (or use Docker Compose)
- npm

### Local Development

```bash
# Start PostgreSQL
docker-compose up -d

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Environment Variables

Copy `.env.dev` to `.env` and fill in:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usashipping
DB_USER=postgres
DB_PASSWORD=password
DB_SSLMODE=disable

GOOGLE_LOGIN_CLIENT_ID=your_client_id
GOOGLE_LOGIN_CLIENT_SECRET=your_client_secret
GOOGLE_LOGIN_SUCCESS_REDIRECT_URL=http://localhost:3000
GOOGLE_LOGIN_FAILURE_REDIRECT_URL=http://localhost:3000/account/login

FX_RATE_SOURCE=usd
FX_RATE_TARGET=vnd

COSTCO_SHEET_ID=your_sheet_id
WALMART_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_PATH=path/to/service-account.json
```

### Admin User

```bash
npm run admin:create
npm run admin:change-pass
```

### Build & Start

```bash
npm run build
npm run start
```

---

## Deployment

- Push to `dev` branch → deploys to Azure **dev** environment
- Push to `main` branch → deploys to Azure **production** environment

See [dev-docs/AZ_DEPLOYMENT.md](dev-docs/AZ_DEPLOYMENT.md) for full setup instructions.

---

## Scheduled Jobs

| Job | Schedule | Description |
|---|---|---|
| `fetchRate` | Every 12 hours (`0 */12 * * *`) | Fetches latest USD→VND exchange rate |
| `scrapeAndStagePrices` | Daily at 02:00 (`0 2 * * *`) | Scrapes live Costco prices and stages them for admin review |

> Note: both jobs are currently `enabled: false` in `config/default.json` — automated runs are off.

---

## GraphQL API (Custom Extensions)

| Query | Returns | Description |
|---|---|---|
| `cart(id)` | `Cart` | Fetch cart by UUID |
| `fxRate(source, target)` | `FxRate` | Get exchange rate |
| `shippingZones` | `[ShippingZone]` | List all shipping zones |
| `shippingZone(id)` | `ShippingZone` | Get single shipping zone |
| `currentCustomer` | `Customer` | Logged-in customer profile |
| `order(uuid)` | `Order` | Order details |

---

## Known Gaps / In Progress

- `quaxave_sync_product_pricing` — extension directories exist but implementation is incomplete
- `quaxave_price_scraper` — structure in place, full integration pending
- No third-party payment gateway (Stripe, PayPal) — currently COD only
- No project-level automated tests
