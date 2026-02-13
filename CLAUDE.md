# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with Turbopack (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
docker-compose up --build   # Run app + MongoDB 7 via Docker
```

No test framework is configured.

## Architecture

**Pocketbook** — Receipt management & invoice generation tool. Users upload receipts, AI extracts data via Gemini, receipts are grouped into reports, and PDF invoices are generated.

### Tech Stack

Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS v4, Mongoose 9, Gemini AI (`@google/genai`), Puppeteer (PDF gen), Google Drive OAuth (`googleapis`), Frankfurter API (exchange rates).

### Data Flow

1. Upload receipt image/PDF → Gemini extracts structured data → user edits → saved to MongoDB
2. Receipts assigned to categories and optional reports
3. Reports group receipts → generate expense report or client invoice PDFs via Puppeteer
4. Google Drive integration for optional file backup

### Source Layout

- `src/app/` — Next.js App Router pages and API routes
- `src/components/ui/` — shadcn-style base components (Button, Input, Card, Badge, Select, Textarea)
- `src/components/layout/` — Navbar
- `src/components/receipt/` — Dropzone, ReceiptForm, VoiceInput
- `src/lib/models/` — Mongoose schemas (Receipt, Report, Category, Settings)
- `src/lib/pdf/` — Puppeteer HTML→PDF generators (expense-report.ts, client-invoice.ts)
- `src/lib/` — Service modules (db.ts, gemini.ts, exchange-rate.ts, google-drive.ts, seed.ts, types.ts, constants.ts, utils.ts)
- `src/hooks/` — use-audio-recorder.ts (Web Audio API mic recording)

### API Routes (`src/app/api/`)

| Route | Methods | Purpose |
|---|---|---|
| `/api/receipts` | GET, POST | List (paginated/filtered) & create |
| `/api/receipts/[id]` | GET, PUT, DELETE | Single receipt CRUD |
| `/api/reports` | GET, POST | List & create |
| `/api/reports/[id]` | GET, PUT, DELETE | Single report CRUD |
| `/api/categories` | GET, POST | List & create (auto-seeds 10 defaults) |
| `/api/categories/[id]` | PUT, DELETE | Update/delete |
| `/api/settings` | GET, PUT | Singleton settings (masks API key on GET) |
| `/api/ai/extract` | POST | Gemini receipt extraction |
| `/api/ai/voice` | POST | Voice input interpretation |
| `/api/invoices/generate` | POST | PDF generation (expense report or client invoice) |
| `/api/exchange-rate` | GET | Frankfurter API proxy |
| `/api/dashboard` | GET | Dashboard aggregation stats |
| `/api/drive/auth` | GET | Google OAuth initiation |
| `/api/drive/callback` | GET | OAuth callback |
| `/api/drive/status` | GET | Drive connection check |

### Page Routes

`/` (dashboard), `/upload`, `/receipts`, `/receipts/[id]`, `/reports`, `/reports/[id]`, `/invoices`, `/settings`

### Key Data Models

- **Receipt** — vendorName, date, lineItems[], totals, currency, optional converted amounts, fileData (Buffer), category ref, optional report ref
- **Report** — name, description, status (draft/finalized), date range
- **Category** — name, color, isDefault (10 seeded defaults)
- **Settings** — Singleton: geminiApiKey, defaultCurrency, Google Drive tokens, invoice numbering, business info

## Conventions

- **Path alias**: `@/*` maps to `src/*`
- **DB connection**: Cached Mongoose singleton in `src/lib/db.ts` using `global.mongoose`
- **Model registration**: `mongoose.models.X || mongoose.model("X", schema)` pattern
- **Settings**: Always singleton — read/update the first document
- **Categories**: Auto-seeded on first API call via `seedCategories()`
- **File storage**: Receipt files stored as Buffer in MongoDB, base64-encoded for JSON transport
- **Exchange rates**: Cached in-memory (historical rates are immutable)
- **Gemini API key**: Stored in MongoDB Settings, NOT in env vars
- **Tailwind v4**: Configured via `@import "tailwindcss"` and `@theme` blocks in `globals.css` — no tailwind.config file
- **Next.js 16 params**: Route handler `params` is `Promise<{id: string}>` and must be awaited
- **Suspense**: `useSearchParams()` requires a Suspense boundary wrapper
- **PDF response**: Buffer must be wrapped with `new Uint8Array(buffer)` for NextResponse
- **Docker**: Standalone output mode, Chromium pre-installed for Puppeteer
- **Env vars**: Only MONGODB_URI, Google OAuth creds, and NEXT_PUBLIC_APP_URL — see `.env.example`
