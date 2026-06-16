
# FinLedger — Portfolio Simulator (web)

A Vite + React client for the FinLedger double-entry backend. It holds **no
accounting logic** of its own — every balance, transaction, and rule comes from
the ledger API over HTTP. Use it to seed a demo portfolio, post balanced
journal entries, and watch net worth / P&L roll up in real time.

## What's inside

| Page | What it does |
| --- | --- |
| **Portfolio** | Net worth (assets − liabilities) and P&L (revenue − expenses), grouped by currency, plus ledger-integrity and trial-balance health. |
| **Accounts** | Chart of accounts with live balances; create new accounts. |
| **Transactions** | Immutable journal. Compose multi-posting entries with a live per-currency balance check; undo via reversal. |
| **Simulator** | One-click demo portfolio + quick activity buttons (salary, rent, invest, groceries). |
| **Settings** | Backend health, API-key rotation, disconnect. |

## Prerequisites

The FinLedger backend running on `http://localhost:8000` with a tenant API key:

```bash
# from ../Finanace-MCP
DB="postgresql+asyncpg://finledger:finledger@localhost:5432/finledger"
FINLEDGER_DATABASE_URL="$DB" .venv/bin/alembic upgrade head
FINLEDGER_DATABASE_URL="$DB" .venv/bin/finledger create-tenant "My Company"   # copy the key
FINLEDGER_DATABASE_URL="$DB" .venv/bin/uvicorn app.main:app --reload
```

## Run the UI

Put your tenant key in a gitignored `web/.env.local` (the dev proxy injects it —
the browser never holds it):

```bash
# web/.env.local
FINLEDGER_API_URL=http://localhost:8000
FINLEDGER_API_KEY=sk_live_...      # from `finledger create-tenant` / `create-key`
```

```bash
npm install
npm run dev          # http://localhost:5173
```

Open the app — it loads straight in (no key prompt) — then go to **Simulator →
Seed demo portfolio**. (A key is only entered in the UI if you point it at a
custom backend URL in Settings.)

## Deploy (Vercel)

The deployed app holds the tenant key **server-side** — the browser never sees
it. A Vercel edge function (`api/proxy.ts`) proxies every `/api/*` request to the
backend and injects the `X-API-Key` header from a server-only env var.

1. Import this repo into Vercel — Vite is auto-detected (`npm run build` → `dist`).
2. Set these **environment variables** (Project → Settings → Environment
   Variables), for **both Production and Preview** — and note the names have **no
   `VITE_` prefix**, so they are never bundled into the public JS:
   - `FINLEDGER_API_KEY` — a tenant key (`sk_live_…`) that exists in the
     **production (Neon)** database. *(Mint it against Neon, not your local DB:
     `export FINLEDGER_DATABASE_URL=<Neon URL>` then `finledger create-key …`.)*
   - `FINLEDGER_API_URL` — the backend base URL (optional; defaults to the Render
     URL hardcoded in `api/proxy.ts`).
3. Deploy. The site loads straight to the dashboard — **no key prompt**, because
   the edge function authenticates for the browser.

> Routing note: `vercel.json` rewrites `/api/:path* → /api/proxy?path=:path*`, and
> the function reads the real path from the `path` query param. A `[...path].ts`
> catch-all was tried first but only matched single-segment paths on this Vite
> (non-Next) project (so `/api/v1/accounts` 404'd) — the single-function + rewrite
> is the working pattern.

> Access note: Vercel **Deployment Protection** (SSO) is on by default, so the
> site is private until you disable it under Settings → Deployment Protection.

See the backend README's **Deployment** section for the full Render + Neon setup.

## How it talks to the backend

The browser always calls `/api/*` same-origin (the backend ships **no CORS
middleware**). A **server-side proxy** sits in front and injects the tenant key,
so the browser never holds a secret:

- **Dev:** the Vite dev server proxies `/api` → `http://localhost:8000` and adds
  the `X-API-Key` header from `FINLEDGER_API_KEY` (see `vite.config.ts`,
  `loadEnv`). Put `FINLEDGER_API_KEY` (and optionally `FINLEDGER_API_URL`) in a
  gitignored `web/.env.local` — **no `VITE_` prefix**, so it stays Node-side and
  out of the bundle. Restart `npm run dev` after editing it.
- **Production:** the Vercel edge function `api/proxy.ts` proxies `/api/*` to the
  backend and injects `X-API-Key` from the server env var `FINLEDGER_API_KEY`.

Key flow: `browser (no key) → proxy (adds X-API-Key) → backend (requires
X-API-Key)`. The backend's auth is **unchanged** — `X-API-Key` is still required
on every call (that's its security boundary); the proxy simply supplies it
instead of the UI. In `src/api/client.ts`, `usesServerKey()` is true on the
default `/api` base, so no browser key is sent; a `localStorage` key (Settings)
is only used when pointing the app at a **custom backend URL** directly.

- **Money is handled as decimal strings end-to-end** (`src/lib/money.ts`),
  using BigInt-scaled integer math — no floats, ever.
- Every transaction POST carries an `idempotency_key`, and entries are balanced
  per currency before the request is sent.

## Layout

```
src/
├── api/        client.ts (typed fetch wrapper) · types.ts (contract)
├── lib/        money.ts (decimal math, currency table, accounting rules)
├── context/    ConfigContext.tsx (API key / base URL)
├── hooks/      useAsync.ts
├── components/ Layout.tsx · ui.tsx
└── pages/      Setup · Dashboard · Accounts · Transactions · Simulator · Settings
```
