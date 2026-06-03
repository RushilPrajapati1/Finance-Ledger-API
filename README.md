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
# from ../Finanace MCP
DB="postgresql+asyncpg://finledger:finledger@localhost:5432/finledger"
FINLEDGER_DATABASE_URL="$DB" .venv/bin/alembic upgrade head
FINLEDGER_DATABASE_URL="$DB" .venv/bin/finledger create-tenant "My Company"   # copy the key
FINLEDGER_DATABASE_URL="$DB" .venv/bin/uvicorn app.main:app --reload
```

## Run the UI

```bash
npm install
npm run dev          # http://localhost:5173
```

Open the app, paste the tenant API key on the connect screen, then go to
**Simulator → Seed demo portfolio**.

## How it talks to the backend

- The backend ships **no CORS middleware**, so the Vite dev server proxies
  everything under `/api` to `http://localhost:8000` (see `vite.config.ts`).
  Override the target with `FINLEDGER_API_URL=… npm run dev`.
- The API key lives only in this browser's `localStorage` and is sent as the
  `X-API-Key` header. It is never written to the repo.
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
