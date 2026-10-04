# AssetVault

Personal wealth and legacy planning: track assets and liabilities across
currencies, name nominees, set up a dead man's switch, store documents, and
plan budgets, taxes and loans.

- **Frontend:** React 19 (CRA + craco), Tailwind 3, shadcn/ui (Radix), Recharts, Framer Motion
- **Backend:** FastAPI, MongoDB (Motor), APScheduler, Stripe
- **Theme:** Fuse v22 design language: zinc neutrals, `#1565C0` primary, Geist font, dark sidebar, light/dark/system scheme

## Layout

```
backend/
  server.py            FastAPI app (uvicorn server:app), CORS, startup/shutdown
  scheduler.py         Background jobs (scheduled messages, DMS reminders)
  core/                config + db client, Pydantic models, auth dependencies
  services/            shared logic: valuation, subscriptions, audit, net worth,
                       loan maths, portfolio, demo seed data
  routers/             one APIRouter per area (assets, nominees, tax_blueprint, …)
frontend/src/
  App.js               auth provider and lazy-loaded routes
  components/Layout.js Fuse app shell (sidebar, toolbar, scheme switcher)
  context/             ThemeContext (Fuse tokens), AppContext (currency, prefs)
  pages/               one file per screen
  index.css            Fuse design tokens (CSS variables) for light and dark
docs/                  feature specs and implementation notes
tests/                 API test scripts (run against a deployed backend)
```

## Theming

All colours come from CSS variables in `frontend/src/index.css`
(`--fuse-bg`, `--fuse-surface`, `--fuse-text`, `--fuse-primary`, …), with a
dark variant under `.dark`. `useTheme().theme` returns those variables, so
inline styles such as `style={{ color: theme.text }}` follow the selected
scheme. Tailwind exposes the primary scale as `primary-50` … `primary-950`.
Prefer these tokens over hex values in new code.

## Running locally

Backend (Python 3.12):

```bash
cd backend
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn server:app --reload --port 8001
```

Frontend (Node 20, Yarn 1 via Corepack):

```bash
cd frontend
corepack yarn install
corepack yarn start
```

## Environment

`backend/.env`: `MONGO_URL`, `DB_NAME` (required); `CORS_ORIGINS`,
`ENVIRONMENT` (`production` enables cross-site cookies), `FRONTEND_URL`,
`APP_URL`, `AUTH_BACKEND_URL`, `ADMIN_EMAIL`, `DEFAULT_CURRENCY`,
`EMERGENT_LLM_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRODUCT_ID`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_FAMILY`.

`frontend/.env`: `REACT_APP_BACKEND_URL` (required), `REACT_APP_AUTH_URL`.
