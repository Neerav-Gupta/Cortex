# Cortex — Complete Codebase Guide

This guide explains everything in the Cortex project in plain, simple language.
If you've never seen the code before, read this top to bottom and you'll
understand what every part does and how the pieces fit together.

---

## 1. What is Cortex? (The 30-second version)

Cortex is a website that helps a homeowner figure out **how to price their house**
when it isn't selling.

Imagine you put your house up for sale, but four months go by and nobody makes an
offer. You've already lowered the price twice and still nothing. What do you do?
Lower it again? By how much? Will you lose too much money? Wait it out?

Cortex answers those questions. You type in your home's address, your asking
price, and a few details. Cortex then:

1. Pulls **real public data** about your area (typical home values, local
   incomes, mortgage rates, etc.).
2. Asks an **AI (Google's Gemini)** to read all that data and give advice.
3. Shows you **three pricing strategies** (Aggressive, Moderate, Patient) with
   charts predicting how each one plays out over the next 12 weeks.
4. Runs **fairness checks** so the AI never tells you to dump your house for far
   below what it's worth.
5. Lets you **chat with an AI advisor** to ask follow-up questions.

The example user in the project is "Riya," a homeowner in Newark whose home has
sat on the market for 4 months with no offers and two failed price cuts.

---

## 2. The big picture (How the app is built)

The project has **two halves** that run as separate programs and talk to each
other over the internet (well, over your local computer during development):

```
┌─────────────────────┐         HTTP requests          ┌──────────────────────┐
│      FRONTEND       │  ───────────────────────────>  │       BACKEND         │
│  (what you see)     │                                 │   (the brain)         │
│                     │  <───────────────────────────  │                       │
│  React + TypeScript │         JSON responses          │  Python + FastAPI     │
│  runs in browser    │                                 │  talks to Gemini AI   │
│  port 5173          │                                 │  port 8000            │
└─────────────────────┘                                 └──────────────────────┘
                                                                   │
                                                                   │ calls out to
                                                                   ▼
                                                   ┌───────────────────────────────┐
                                                   │  External free data sources    │
                                                   │  • Census (home values etc.)   │
                                                   │  • FRED (mortgage rates)        │
                                                   │  • RentCast (optional)          │
                                                   │  • OpenStreetMap (addresses)    │
                                                   │  • Google Gemini (the AI)       │
                                                   └───────────────────────────────┘
```

- **Frontend** = the visual dashboard you click around in. Built with React.
  Lives in the `frontend/` folder.
- **Backend** = the "brain" that fetches data, runs the AI, and does the math.
  Built with Python. Lives in the `backend/` folder.

There is **no database**. Instead, the backend keeps everything in memory and
saves it to a single file on disk (`backend/data_store.json`) so your data
survives a restart.

---

## 3. The folder layout

```
Cortex/
├── README.md              ← Setup instructions for running the app
├── .env.example           ← Template for your secret API keys
├── guide.md               ← This file
│
├── backend/               ← The Python "brain"
│   ├── main.py            ← Starts the server
│   ├── storage.py         ← Saves/loads everything to a JSON file
│   ├── requirements.txt   ← List of Python libraries needed
│   ├── agent/             ← The AI pipeline
│   │   ├── graph.py       ← Runs the 5 AI steps in order, holds the memory
│   │   ├── nodes.py       ← The actual 5 steps (each talks to Gemini)
│   │   └── guardrails.py  ← The fairness rules (price floors etc.)
│   ├── data/              ← Where market data comes from
│   │   ├── fetchers.py    ← Combines homeowner facts + live market data
│   │   ├── external_apis.py ← Talks to Census, FRED, RentCast, OpenStreetMap
│   │   └── mock_data.py   ← (Empty placeholder for seed data)
│   └── routers/
│       └── listing.py     ← Defines all the web addresses (API endpoints)
│
└── frontend/              ← The React dashboard
    ├── index.html         ← The single web page everything loads into
    ├── package.json       ← List of JavaScript libraries needed
    ├── vite.config.ts     ← Build tool configuration
    └── src/
        ├── main.tsx       ← The very first code that runs in the browser
        ├── App.tsx        ← Sets up the pages and navigation
        ├── index.css      ← Colors and theme (dark mode)
        ├── lib/
        │   ├── api.ts     ← Functions that call the backend
        │   ├── types.ts   ← Shapes of the data (TypeScript types)
        │   └── utils.ts   ← A small helper for CSS class names
        ├── hooks/
        │   └── use-toast.ts ← Logic for little pop-up notifications
        ├── pages/
        │   ├── Home.tsx       ← The landing page (list + add a listing)
        │   └── Dashboard.tsx  ← The detailed page for one listing
        └── components/    ← All the reusable visual pieces
            ├── (feature components — explained below)
            └── ui/        ← Generic building blocks (buttons, cards, etc.)
```

---

## 4. The Backend (Python) — explained file by file

The backend is a **FastAPI** app. FastAPI is a Python tool for building web
"APIs" — programs that answer requests like "give me the data for listing X."

### 4.1 `backend/main.py` — The starting point

This is the file that boots up the server.

What it does, step by step:
1. Loads your secret keys from the `.env` file (`load_dotenv()`).
2. Configures Google Gemini with your `GEMINI_API_KEY`.
3. Sets up a **"lifespan"** function — code that runs once when the server
   starts. On startup, it loads any saved data from disk, and for any listing
   that doesn't yet have AI results, it runs the AI pipeline.
4. Creates the FastAPI app.
5. Adds **CORS** middleware — this is a permission rule that lets the frontend
   (running on `localhost:5173`) talk to the backend (`localhost:8000`).
   Browsers block cross-site requests by default; this allows it.
6. Plugs in all the API routes from `routers/listing.py`.
7. Defines one simple test route (`/`) that just says "Cortex API running."

### 4.2 `backend/storage.py` — Saving and loading

There's no database, so this file is how data survives a restart.

- `save_state()` — gathers all the in-memory data (the registry of listings,
  cached market data, AI outputs, advisor overrides, and chat history) and
  writes it as one big JSON file (`data_store.json`).
- `load_state()` — reads that file back into memory when the server starts.

**Why it matters:** the AI pipeline costs money/quota every time it runs. Saving
results to disk means a restart doesn't trigger a re-run of the AI.

### 4.3 `backend/agent/guardrails.py` — The fairness rules

Very small but important. It defines two numbers:

- `FLOOR_RATIO = 0.85` — A home should never be recommended below **85%** of the
  neighborhood's typical price.
- `MAX_DISCOUNT_PCT = 12.0` — A recommendation should never cut more than **12%**
  off the original list price.

`summarize_guardrails()` just packages these two numbers so the frontend can
display them. These rules exist so the AI can't tell a desperate seller to give
their home away in a struggling neighborhood.

### 4.4 `backend/agent/nodes.py` — The 5 AI steps (the heart of the app)

This file contains the individual "steps" of the AI pipeline. Each step is a
function. Most of them talk to Gemini.

**Important supporting pieces:**

- `SYSTEM_CONTEXT` — a block of text that tells Gemini who it is: "You are
  CortexAI, an AI pricing advisor... always respond with valid JSON only."
- `_get_pipeline_model()` — picks which Gemini model to use
  (`gemini-3.1-flash-lite`, a fast model).
- `_call_gemini(prompt)` — actually sends a prompt to Gemini and returns the
  text reply.
- `_parse_json(text)` — AI replies are messy. They sometimes wrap answers in
  markdown code fences (```` ```json ````) or add extra chatter. This function
  cleans all that up and extracts the actual JSON. If normal parsing fails, it
  hunts for the first `{...}` or `[...]` block in the text.

**A key design idea: every AI call has a "fallback."** If Gemini fails or
returns garbage, each step has a sensible pre-written backup answer so the
dashboard *always* shows something. The app never crashes just because the AI
hiccuped.

**The 5 steps:**

1. **`collect_data(listing_id)`** — Step 1. Gathers the listing + local market
   data. (It just calls the data layer; no AI here.)

2. **`analyze_market(data)`** — Step 2. Asks Gemini to read the data and return
   a "market assessment": the demand trend, whether the price fits demand, the
   biggest risk, and the best opportunity. Returns 4 short text descriptions.

3. **`generate_scenarios(data, assessment)`** — Step 3. Asks Gemini to produce
   **exactly 3 pricing scenarios** (Aggressive / Moderate / Patient). Each
   scenario includes a recommended price, a 12-week price path (a list of
   week→price points for the chart), estimated days to sale, how much equity
   you keep, suggested incentives, and a reasoning. The fallback here even
   builds its own price path mathematically (a straight line from current price
   down to the target price).

4. **`check_fairness(scenarios, neighborhood_median, original_price)`** —
   Step 4. **No AI** — pure rules. For each scenario it checks: is the price
   below the 85% floor? Is the discount bigger than 12%? If either is true, it
   marks `fairness_passed = False` and writes a human-readable reason. This is
   how the guardrails get enforced.

5. **`write_output(assessment, scenarios, listing_data)`** — Step 5. Asks Gemini
   to read everything above and synthesize the **final recommendation**: which
   scenario to pick, a confidence score (0–100), a one-line summary, a plain
   explanation, and a list of alerts (info/warning/critical). It's told *not* to
   recommend a scenario that failed the fairness check unless there's no choice.

There's also a 6th function used by the chat feature:

- **`chat_with_advisor(...)`** — Powers the chat box. It feeds Gemini the full
  context (listing, assessment, scenarios, recommendation) plus the conversation
  so far plus the homeowner's new question, and gets back a friendly plain-text
  reply. If it fails, it returns a polite fallback message.

### 4.5 `backend/agent/graph.py` — The orchestrator (and the memory)

This file runs the steps in order and holds the app's in-memory "state."

**The three in-memory stores (just Python dictionaries):**
- `LATEST_OUTPUT` — the latest full AI result for each listing.
- `OVERRIDES` — any manual advisor adjustments for each listing.
- `CHAT_HISTORY` — the chat conversation for each listing.

**The main function:**
- `run_agent(listing_id)` — runs all 5 steps in sequence:
  collect → analyze → generate scenarios → check fairness → write output.
  It bundles the results into one `output` dictionary (with a timestamp),
  attaches any saved override, stores it in `LATEST_OUTPUT`, saves everything to
  disk, and returns it.

**Helper functions:**
- `get_latest_output(id)` — returns the cached result, if any.
- `set_override(id, override)` — saves an advisor override and merges it in.
- `clear_output(id)` — wipes a listing's results, overrides, and chat (used on
  delete).
- `get_chat_history(id)` — returns the saved conversation.
- `send_chat_message(id, message)` — runs the pipeline first if needed, then
  calls `chat_with_advisor`, saves both the question and answer to history, and
  returns the reply.

**The mental model:** `graph.py` is the conductor; `nodes.py` is the orchestra.

### 4.6 `backend/data/external_apis.py` — Talking to the outside world

Thin functions that fetch real data from free public APIs. Each one caches its
results so we don't hit the same API twice for the same input.

- `geocode_address(address)` — Turns a street address into map coordinates and
  **county/state FIPS codes** (government ID numbers for places). Uses the free
  Census geocoder. Also returns the county's land area (used later for a
  walkability estimate).
- `get_census_county_stats(state, county)` — Fetches county-level statistics
  from the Census **ACS5** survey: median home value, vacancy rate, median rent,
  median household income, total population, and education levels. Education and
  population are later turned into "school rating" and "walk score" proxies.
- `get_mortgage_rate()` — Fetches the current 30-year fixed mortgage rate from
  **FRED** (the Federal Reserve's data service).
- `get_rentcast_avm(address)` — *Optional.* If you have a RentCast key, gets a
  computer-estimated home value and comparable sales. Returns `None` if it fails
  (so the app keeps working without it).
- `get_rentcast_listing(address)` — *Optional.* Gets a real listing's price
  history and days-on-market from RentCast, if available.
- `search_addresses(query)` — Powers the address autocomplete on the home page,
  using free **OpenStreetMap Nominatim** search. Returns up to 5 suggestions.

### 4.7 `backend/data/fetchers.py` — Building a complete "listing"

This combines two kinds of information into one tidy package:
1. **Facts only the homeowner knows** — current price, original price, days on
   market. Provided when you add the listing.
2. **Live market context** — pulled from the APIs above.

Key pieces:
- `REGISTRY` — a dictionary of `listing_id → {address, price_cut_history,
  days_on_market}`. This is the list of all listings the user has added.
- `_listing_cache` — a dictionary holding the *fully assembled* listing data so
  we don't re-fetch from external APIs every time.
- `slugify(address)` — turns "123 Main St, Newark" into a clean, URL-safe ID
  like `123-main-st-newark`. This ID is used everywhere.

Functions:
- `register_listing(...)` — adds a new listing to the registry. It builds a
  `price_cut_history` list: if original = current, it's just `[current]`;
  otherwise `[original, current]`. Clears any old cache for that ID.
- `update_listing_facts(...)` — edits a listing's price history or days on
  market, then clears the cache so fresh data is fetched.
- `delete_listing(id)` — removes a listing entirely.
- `fetch_listing_data(id)` — returns the cached full listing, or builds it if
  not cached.
- `_build_listing(id, facts)` — the big assembly function. It geocodes the
  address, pulls Census stats and the mortgage rate, optionally overlays
  RentCast data, then **derives**:
  - `neighborhood_median` — typical local home value (RentCast estimate if
    available, otherwise Census median).
  - `school_rating` — a 1–10 score derived from the % of adults with a
    bachelor's degree (an education proxy, since real school ratings aren't free).
  - `walk_score` — a 0–100 score derived from population density (people per
    square km).
  - `price_cuts` — how many times the price was lowered (length of the price
    history minus 1).
  Finally it returns one big dictionary with all the fields the frontend needs.

### 4.8 `backend/data/mock_data.py` — (Empty placeholder)

Just an empty `LISTINGS = {}`. The app used to ship with fake seed listings;
now it starts empty and you add real addresses through the UI.

### 4.9 `backend/routers/listing.py` — The API endpoints

This defines every web address the frontend can call. It also defines the
**data shapes** (using Pydantic `BaseModel` classes) so FastAPI can validate
inputs and outputs. All routes start with `/api`.

**The data shapes** (these mirror the TypeScript types on the frontend):
`PricePoint`, `Scenario`, `MarketAssessment`, `Alert`, `Recommendation`,
`ListingData`, `Override`, `AgentOutput` (the whole bundle), `GuardrailConfig`,
plus request shapes like `CreateListingRequest` and `ChatMessageRequest`.

**The endpoints (what each web address does):**

| Method & Path | What it does |
|---|---|
| `GET /api/geocode/suggest?q=` | Address autocomplete suggestions |
| `POST /api/listings` | Add a new listing and immediately run the AI |
| `GET /api/listings` | List all analyzed listings (summary cards) |
| `DELETE /api/listings/{id}` | Delete a listing |
| `GET /api/listing/{id}` | Get the full AI output for one listing |
| `PATCH /api/listing/{id}` | Edit a listing's facts, then re-run the AI |
| `GET /api/listing/{id}/chat` | Get the chat history |
| `POST /api/listing/{id}/chat` | Send a chat message, get an AI reply |
| `POST /api/listing/{id}/refresh` | Re-run the AI in the background |
| `POST /api/listing/{id}/override` | Save an advisor override |
| `GET /api/listing/{id}/alerts` | Get just the alerts |
| `GET /api/guardrails` | Get the fairness thresholds |

Small but useful details:
- `_validate_listing_id` — returns a 404 error if you ask about a listing that
  doesn't exist.
- `create_listing` — if the AI run fails, it **deletes** the half-created
  listing and returns an error, so you never get a broken entry.
- `refresh_listing` — uses `asyncio.create_task` to run the AI **in the
  background** and returns immediately, so the UI doesn't freeze.

---

## 5. How a single request flows through the backend

Let's trace what happens when you **add a new listing**:

```
1. Frontend sends POST /api/listings  { address, current_price, ... }
        │
2. routers/listing.py → create_listing()
        │   validates the input
        ▼
3. fetchers.register_listing()  → saves the facts in REGISTRY, clears cache
        │
4. graph.run_agent(listing_id)
        │
        ├─ nodes.collect_data()      → fetchers.fetch_listing_data()
        │       └─ external_apis.*    → Census, FRED, (RentCast), geocode
        │
        ├─ nodes.analyze_market()    → Gemini call #1
        ├─ nodes.generate_scenarios()→ Gemini call #2
        ├─ nodes.check_fairness()    → pure math, no AI
        └─ nodes.write_output()      → Gemini call #3
        │
5. Results bundled, saved to disk (storage.save_state)
        │
6. The full AgentOutput is returned to the frontend as JSON
```

So **3 Gemini calls per listing analysis**, plus **1 more per chat message**.
That's why the README warns about API quotas.

---

## 6. The Frontend (React/TypeScript) — explained file by file

The frontend is a **React** app written in **TypeScript**, built with **Vite**
(a fast build tool). It uses:
- **React Router** for navigating between pages.
- **TanStack Query** (React Query) for fetching data from the backend and
  keeping it fresh automatically.
- **shadcn/ui** + **Tailwind CSS** for styling (a dark, modern theme).
- **Recharts** for the graphs.
- **Leaflet** for the map.
- **lucide-react** for icons.

### 6.1 `frontend/src/main.tsx` — The entry point

The first browser code to run. It:
1. Creates a TanStack Query client (manages all data fetching/caching).
2. Renders the `<App />` component into the page, wrapped in the query provider.

### 6.2 `frontend/src/App.tsx` — Routing

Sets up the two pages using React Router:
- `/` → the **Home** page (list of listings + add form).
- `/listing/:id` → the **Dashboard** page for one specific listing.

Both pages render inside a shared `<Layout>` (the header bar). The `<Toaster>`
handles pop-up notifications globally.

### 6.3 `frontend/src/lib/types.ts` — The data shapes

TypeScript "interfaces" that describe exactly what the data looks like
(`ListingData`, `Scenario`, `Recommendation`, `AgentOutput`, etc.). These
**mirror the Pydantic models in the backend**, so both sides agree on the shape
of every piece of data. This is what gives you autocomplete and catches typos.

### 6.4 `frontend/src/lib/api.ts` — Calling the backend

One function per backend endpoint (`fetchListing`, `createListing`,
`refreshListing`, `submitOverride`, `sendChatMessage`, etc.). Each uses the
browser's `fetch` to hit `http://localhost:8000`. A shared `handleResponse`
helper checks for errors and extracts the JSON. This is the **only** file that
knows the backend's URL.

### 6.5 `frontend/src/lib/utils.ts` — A tiny helper

Just the `cn(...)` function, which merges CSS class names cleanly (a standard
shadcn utility). Used everywhere for conditional styling.

### 6.6 `frontend/src/hooks/use-toast.ts` — Pop-up notifications

A small state manager for "toasts" (the little messages like "Override saved"
that appear briefly). Standard shadcn boilerplate. You call `toast({ title })`
to show one.

### 6.7 `frontend/src/index.css` — The theme

Defines the color palette as CSS variables. It's a **dark theme** with a teal
primary color and subtle gradient background. Uses the Inter font.

### 6.8 The pages

#### `pages/Home.tsx` — The landing page

What the user sees first. It has:
- A hero section with a headline and the **"add a listing" form**: an address
  field with **live autocomplete** (debounced — it waits 300ms after you stop
  typing before searching), plus asking price, original price, and days on
  market.
- A grid of **cards for every listing already analyzed**, each showing the
  price, how it compares to the neighborhood median (green if at/below, amber if
  above), the AI's one-line summary, days on market, and the recommended
  strategy. Clicking a card opens its dashboard. Each card has a delete button.
- The listings list **auto-refreshes every 60 seconds** (TanStack Query's
  `refetchInterval`).
- Submitting the form calls `createListing`, then navigates to the new
  listing's dashboard.

#### `pages/Dashboard.tsx` — The detail page

The main workspace for one listing. It:
- Fetches the listing's full AI output and **auto-refreshes every 30 seconds**.
- Also fetches the guardrail thresholds.
- Has a header with **Refresh** and **Delete** buttons.
- Organizes everything into **three tabs**:
  - **General Info** — `PropertyOverview` (map + key stats), plus the
    `PriceHistoryChart` and `NeighborhoodComparisonChart`.
  - **Strategy & Advisor** — the meat: `StrategyCard` (the recommendation),
    `MarketAssessment`, `ScenarioComparison` (the 3 strategies side by side),
    `PricePath` (the 12-week projection chart), `FairnessPanel`, `AlertFeed`,
    and the `AdvisorChat` box on the side.
  - **Edit Listing** — the `EditListingForm` and the `OverridePanel`.
- Uses **mutations** for refresh, override, and delete, showing toast
  notifications on success/failure.

### 6.9 The feature components (in `src/components/`)

These are the reusable visual blocks. Each takes data as "props" and renders it.

- **`Layout.tsx`** — The top header bar (logo + "Listings" link) and the page
  container. Every page renders inside it.

- **`PropertyOverview.tsx`** — The big summary card at the top of a dashboard:
  the map, asking price, days on market (red badge if over 90 days), price-cut
  history, comparison to the neighborhood median, and a row of six stats
  (median value, mortgage rate, median income, school index, walk score, median
  rent), each labeled with its data source.

- **`PropertyMap.tsx`** — A small **Leaflet** map centered on the home's
  coordinates, with a teal dot marker and a dark map style. Only shown if
  coordinates are available.

- **`StrategyCard.tsx`** — The headline recommendation: the recommended price,
  the strategy label, the one-line summary, a **confidence bar**, and the "why"
  explanation. Marked with the "AI Insight" badge.

- **`MarketAssessment.tsx`** — A 2×2 grid showing the AI's four findings: Demand
  Trend, Price Band Fit, Key Risk, Opportunity (each with an icon).

- **`ScenarioComparison.tsx`** — Three cards side by side (Aggressive, Moderate,
  Patient). The recommended one gets a teal ring. Each shows price, days to
  sale, equity retained, incentives, and reasoning. If a scenario fails the
  fairness check, a yellow warning appears.

- **`PricePath.tsx`** — A **line chart** projecting each strategy's price over
  12 weeks, with a dashed reference line for the neighborhood median. Each
  strategy has its own color (red/teal/indigo).

- **`PriceHistoryChart.tsx`** — A **bar chart** of the home's actual past prices
  (Original → cuts → Current). The current price bar is highlighted teal.

- **`NeighborhoodComparisonChart.tsx`** — A horizontal **bar chart** comparing
  the original price, current asking price, and neighborhood median.

- **`FairnessPanel.tsx`** — Lists the guardrail rules (price floor %, max
  discount %) and shows each scenario's pass/flag status with reasons.

- **`AlertFeed.tsx`** — Shows the AI-generated alerts, color-coded by severity:
  blue (info), amber (warning), red (critical).

- **`AdvisorChat.tsx`** — The chat box. Loads past conversation, lets you type a
  question (Enter to send, Shift+Enter for newline), shows a "Thinking..."
  indicator while the AI responds, and auto-scrolls to the newest message. The
  AI **remembers the whole conversation** for that listing.

- **`AiInsightBadge.tsx`** — A tiny reusable "✨ AI Insight" badge used to mark
  anything generated by the AI (vs. raw data).

- **`EditListingForm.tsx`** — Lets you edit the price history (add/remove price
  entries — the last one is always treated as the current price) and days on
  market. Saving re-runs the whole AI pipeline with the new info.

- **`OverridePanel.tsx`** — "Advisor Controls." Lets a human advisor set a price
  floor (slider), lock a specific scenario, and add a note. This is the
  human-in-the-loop override of the AI.

### 6.10 `frontend/src/components/ui/` — Generic building blocks

These are **standard shadcn/ui components** — generic, unstyled-then-themed
primitives that the feature components are built from:

`button`, `card`, `input`, `textarea`, `select`, `slider`, `progress`,
`badge`, `alert`, `separator`, `skeleton` (loading placeholders), `tabs`,
`toast`, `toaster`.

You rarely edit these directly. They're the Lego bricks; the feature components
are the models built from them. They're copied in from the shadcn library (note
`components.json` configures the "new-york" style with a teal/zinc base).

---

## 7. How the frontend and backend stay in sync

Two important mechanisms keep the dashboard fresh **without you doing anything**:

1. **Polling.** TanStack Query re-fetches data on a timer — the Home page list
   every 60 seconds, a Dashboard every 30 seconds. So if the AI finishes a
   background refresh, the screen updates on its own.

2. **Invalidation.** When you do something (add, edit, delete, override), the
   code "invalidates" the relevant query, which forces an immediate re-fetch so
   you see the result right away.

The two sides agree on data shapes because `frontend/src/lib/types.ts` mirrors
the Pydantic models in `backend/routers/listing.py`. If you change one, change
the other.

---

## 8. The data you need to run it (API keys)

All free. You put them in a `.env` file at the project root (copy
`.env.example`):

- **`GEMINI_API_KEY`** (required) — powers all the AI.
- **`CENSUS_API_KEY`** (required) — neighborhood stats.
- **`FRED_API_KEY`** (required) — mortgage rate.
- **`RENTCAST_API_KEY`** (optional) — live valuations/listings; the app falls
  back to Census data if it's missing.

Both halves of the app read this single `.env` file.

---

## 9. How to run it (quick reference)

**Backend:**
```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload          # runs on http://localhost:8000
```

**Frontend (separate terminal):**
```
cd frontend
npm install
npm run dev                        # runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 10. Key things to remember (the cheat sheet)

- **Two programs:** Python backend (brain, port 8000) + React frontend (UI,
  port 5173).
- **No database.** Everything lives in memory and is mirrored to
  `backend/data_store.json`.
- **The AI does 3 things per listing** (analyze market, make 3 scenarios, write
  the final recommendation) + **1 per chat message**.
- **Fairness checks are pure rules, not AI** — they enforce an 85% price floor
  and a 12% max discount.
- **Every AI call has a fallback** so the dashboard never breaks.
- **The AI only re-runs** when you add, edit, or refresh a listing — not on
  every page load (to save quota).
- **Real public data** comes from Census (home values, income, education),
  FRED (mortgage rate), and optionally RentCast; addresses are autocompleted via
  OpenStreetMap.
- **Frontend and backend data shapes mirror each other** (`types.ts` ↔ Pydantic
  models in `listing.py`).
- **`graph.py` conducts; `nodes.py` performs.** Start reading the backend there.
- **`Dashboard.tsx` is the hub** of the frontend — start reading the UI there.
