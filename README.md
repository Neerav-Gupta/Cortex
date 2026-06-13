# Cortex

Cortex is an AI-powered pricing strategy dashboard for homeowners and housing
advisors in stressed real estate markets. It ingests market data, runs an
agentic AI workflow powered by Gemini, and surfaces clear pricing scenarios,
alerts, and fairness checks through a visual dashboard.

The demo persona is Riya, a homeowner in Newark whose home has been listed for
4 months with no offers and two failed price cuts.

## Prerequisites

- Node.js 18 or higher
- Python 3.11 or higher
- API keys (all free):
  - **Gemini** - https://aistudio.google.com/app/apikey
  - **Census** - https://api.census.gov/data/key_signup.html
  - **FRED** - https://fred.stlouisfed.org/docs/api/api_key.html
  - **RentCast** (optional, enables live AVM/listing data) - https://www.rentcast.io/api

## 1. Clone and configure environment variables

```
git clone https://github.com/Neerav-Gupta/Cortex.git
cd Cortex
cp .env.example .env
```

Open `.env` and fill in your API keys (`RENTCAST_API_KEY` can stay blank).
Both the backend and frontend read from this single `.env` file at the repo
root.

## 2. Backend setup

```
cd backend
python3 -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs on http://localhost:8000.

## 3. Frontend setup

In a separate terminal:

```
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173. Open it in your browser to see
the dashboard.

## Notes for collaborators

- All app state (listings, AI analysis, chat history, overrides) is persisted
  to `backend/data_store.json`, which is git-ignored. Each person running the
  app locally will build up their own local data over time, and the AI
  pipeline is **not** re-run automatically on restart - it only re-runs when
  you add a listing, edit one, or click "Refresh".
- The AI pipeline calls Gemini 3 times per listing run (market analysis,
  scenario generation, final recommendation), and chat uses one additional
  call per message - be mindful of API quotas if your key is on a free tier.

## Architecture

- **Backend**: FastAPI + an in-memory (file-persisted) agent pipeline
  (`backend/agent`). Five sequential async steps collect listing data,
  analyze the market with Gemini, generate pricing scenarios with Gemini, run
  rule-based fairness checks, and synthesize a final recommendation with
  Gemini. Every Gemini call has a JSON-parsing fallback so the dashboard
  always renders. Results are cached in `backend/data_store.json` and only
  recomputed when a listing is created, edited, or manually refreshed.
- **Frontend**: React + Vite + TypeScript + shadcn/ui (New York style) +
  Tailwind + Recharts + TanStack Query. The dashboard polls the listing
  endpoint every 30 seconds and supports a manual refresh and advisor
  overrides.

No database is used - all state lives in Python module-level dicts backed by
a JSON file on disk, and the data layer (`backend/data/fetchers.py`) is
structured so real market-data APIs can be swapped in later.
