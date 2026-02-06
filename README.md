# Pocketbook

Self-hosted receipt management and invoice generation. Upload receipts, let AI extract the data, organize into reports, convert currencies, and generate professional PDFs.

## Features

- **AI Receipt Extraction** — Upload a receipt image or PDF, Gemini AI auto-extracts vendor, date, line items, total, currency, and category
- **Voice Input** — Press the mic button and describe changes to receipt fields; Gemini interprets your speech and updates the form
- **Historical Exchange Rates** — Automatic currency conversion using the receipt date via the Frankfurter API (ECB data, free, no API key)
- **Reports** — Organize receipts into named reports (e.g. "Berlin Trip Q1", "Client ABC")
- **Invoice Generation** — Generate expense report or client invoice PDFs with receipt images embedded
- **Google Drive** — Optionally store receipt files in your Google Drive via OAuth
- **Dark Mode** — Light, dark, and system theme support
- **Responsive** — Works on desktop and mobile
- **Dockerized** — One command to run the full stack

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4, shadcn-style components |
| Database | MongoDB 7 (Mongoose) |
| AI | Google Gemini API (`@google/genai`) |
| Exchange Rates | [Frankfurter API](https://frankfurter.dev/) |
| File Storage | Google Drive (OAuth) + MongoDB |
| PDF Generation | Puppeteer |
| Charts | Recharts |

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB running locally (or use Docker)

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your MongoDB URI

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Go to **Settings** first to enter your Gemini API key.

### Docker

```bash
docker-compose up --build
```

This starts the Next.js app on port 3000 and MongoDB on port 27017.

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (for Drive integration) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL (default: `http://localhost:3000/api/drive/callback`) |

### In-App Settings

These are configured through the Settings page at `/settings`:

- **Gemini API Key** — Get one at [aistudio.google.com](https://aistudio.google.com/apikey)
- **Default Currency** — Your home currency for exchange rate conversions
- **Business Name & Address** — Appears on generated invoices
- **Invoice Number Prefix** — e.g. "INV-" (auto-increments)
- **Categories** — Add, edit, or remove expense categories
- **Google Drive** — Connect via OAuth to auto-upload receipt files

### Google Drive Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the **Google Drive API**
3. Create **OAuth 2.0 credentials** (Web application)
4. Add `http://localhost:3000/api/drive/callback` as an authorized redirect URI
5. Put the client ID and secret in `.env.local`
6. In the app, go to Settings and click "Connect Google Drive"

## Usage

### Upload a Receipt

1. Go to `/upload`
2. Drag & drop a receipt image or PDF (or click to browse)
3. Gemini AI analyzes the receipt and auto-fills all fields
4. Review and edit the extracted data
5. Optionally use the **Voice Input** button to speak corrections
6. Select a category and optionally assign to a report
7. Click **Save Receipt**

### Voice Input

While editing a receipt, press the mic button and say something like:
- *"Change the vendor to Starbucks and the total to 12.50"*
- *"This was a business lunch, category should be Meals"*
- *"Add a note: team meeting with client"*

Gemini interprets your speech and updates the relevant fields.

### Exchange Rates

When the receipt currency differs from your default currency, Pocketbook automatically fetches the historical exchange rate for the receipt date and shows both amounts side by side.

### Reports

Create reports to group related receipts:
1. Go to `/reports` and click **New Report**
2. Name it (e.g. "Paris Business Trip")
3. When uploading or editing receipts, assign them to the report
4. View the report detail page to see all receipts grouped by category
5. Mark as "Finalized" when done

### Generate Invoices

1. Go to `/invoices`
2. Select receipts (or come from a report to auto-select)
3. Choose **Expense Report** or **Client Invoice**
4. Fill in the details (title, client name, etc.)
5. Click **Generate PDF** — downloads automatically

The PDF includes:
- Categorized expense tables with totals
- Receipt images embedded inline
- For client invoices: invoice number, billing details, due date

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── ai/extract/       # Gemini receipt extraction
│   │   ├── ai/voice/         # Gemini voice interpretation
│   │   ├── categories/       # Category CRUD
│   │   ├── dashboard/        # Dashboard aggregation data
│   │   ├── drive/            # Google Drive OAuth + upload
│   │   ├── exchange-rate/    # Frankfurter API proxy
│   │   ├── invoices/generate/# PDF generation
│   │   ├── receipts/         # Receipt CRUD
│   │   ├── reports/          # Report CRUD
│   │   └── settings/         # Settings read/update
│   ├── invoices/             # Invoice generation page
│   ├── receipts/             # Receipt list + detail pages
│   ├── reports/              # Report list + detail pages
│   ├── settings/             # Settings page
│   ├── upload/               # Upload page
│   ├── layout.tsx            # Root layout with navbar
│   └── page.tsx              # Dashboard
├── components/
│   ├── layout/navbar.tsx     # Top navigation with dark mode toggle
│   ├── receipt/              # Dropzone, form, voice input
│   ├── theme-provider.tsx    # Dark mode provider
│   └── ui/                   # Reusable UI components
├── hooks/
│   └── use-audio-recorder.ts # MediaRecorder wrapper for voice input
└── lib/
    ├── constants.ts          # Default categories, currency list
    ├── db.ts                 # MongoDB connection singleton
    ├── exchange-rate.ts      # Frankfurter API client
    ├── gemini.ts             # Gemini extraction + voice
    ├── google-drive.ts       # Drive OAuth + file upload
    ├── models/               # Mongoose schemas
    ├── pdf/                  # PDF template generators
    ├── seed.ts               # Category seeding
    ├── types.ts              # Shared TypeScript types
    └── utils.ts              # Utility functions
```

## Data Models

- **Receipt** — vendor, date, line items, amounts, currency, category, file data, report assignment
- **Report** — name, description, status (draft/finalized), date range
- **Category** — name, color, default flag (10 preset categories)
- **Settings** — singleton document: API keys, currency, business info, Drive tokens

## License

MIT
