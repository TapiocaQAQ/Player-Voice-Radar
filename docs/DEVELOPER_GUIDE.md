# Player Voice Radar

> Real-time player sentiment analysis dashboard powered by Google Play reviews + Groq LLM.

A full-stack analytics tool that scrapes mobile game reviews, classifies them with an LLM pipeline, and visualises the results as an interactive radar dashboard — with a FastAPI backend for live on-demand sync.

**Target App:** 競技麻將2 (`com.igs.slots.casino.games.free.android`)

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite                    |
| UI       | Tailwind CSS v3, Radix UI, Tremor, shadcn/ui    |
| Backend  | Python 3 — `google-play-scraper` + Groq SDK     |
| API      | FastAPI + Uvicorn (SSE streaming)               |
| LLM      | `qwen/qwen3-32b` via Groq API                   |
| Data     | `public/data/cached_reviews.json` (130 records) |

---

## Project Structure

```
Player-Voice-Radar/
├── backend/
│   ├── scraper.py          # Step 1: Google Play review scraper (v2.0 — 競技麻將2)
│   ├── llm_service.py      # Step 2: Groq LLM pipeline — new 6-category + VIP detection
│   ├── main.py             # Step 3: FastAPI server — /api/sync SSE + /api/debug/rollback
│   └── requirements.txt
├── public/
│   └── data/
│       └── cached_reviews.json   # LLM-analysed reviews (new format: thumbsUpCount + is_vip_player)
├── src/
│   ├── components/
│   │   ├── layout/         # Header (sync button + star filter)
│   │   ├── features/
│   │   │   ├── charts/     # InsightChart (dynamic, click-to-filter)
│   │   │   ├── detail/     # DetailSheet (VIP badge + thumbs-up sort)
│   │   │   ├── keywords/   # BadgeCloud (dynamic keywords)
│   │   │   └── metrics/    # MetricCards (Sparkline + P0/backlash/VIP churn)
│   │   └── ui/             # shadcn/ui primitives (Skeleton, JumpingDots)
│   ├── services/
│   │   └── api.ts          # fetchReviews / triggerSync (SSE) / rollbackData
│   ├── constants/          # Design tokens & shared constants
│   ├── hooks/              # Custom React hooks (planned)
│   └── types/              # Domain TypeScript types
└── docs/
    ├── DESIGN.md
    ├── project_blueprint.md
    └── Project Blueprint v2.0.md
```

---

## Backend Pipeline

### Step 1 — Scraper (v2.0)

```bash
pip install -r backend/requirements.txt
python backend/scraper.py
# → backend/raw_reviews.json  (競技麻將2, last 150 days, includes thumbsUpCount)
```

### Step 2 — LLM Analysis

```bash
# Requires backend/.env with GROQ_API_KEY=<your_key>
python backend/llm_service.py --limit 130
# → public/data/cached_reviews.json
```

Each review gets `ai_analysis`:

| Field               | Values                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `sentiment`         | `positive` / `neutral` / `negative`                                 |
| `category`          | 工程研發、營運企劃、客服金流、UI/UX體驗、行銷推廣、其他              |
| `risk_level`        | `high` / `medium` / `low` (auto-upgraded if VIP or thumbsUp ≥ 10) |
| `keyword`           | 2–5 character Chinese pain-point tag                                |
| `root_cause_summary`| ≤ 20 character one-line summary                                     |
| `is_vip_player`     | `true` if review signals paying/VIP behaviour                       |

**Review fields also include:** `thumbsUpCount` — raw Google Play upvote count.

**Risk override logic:** If `thumbsUpCount >= 10` OR `is_vip_player === true`, `risk_level` is forced to `"high"` post-LLM.

Pipeline reliability:
- Generator-based `main()` — yields per-batch progress for SSE streaming
- Auto-retry on `json.JSONDecodeError` (up to 3×)
- Rate-limit 429 → parse wait time → sleep → retry (zero data loss)
- Batch-failure fallback: batch of 3 → individual → `bad_data.json`

### Step 3 — FastAPI Server (live sync)

```bash
uvicorn backend.main:app --reload --port 8000
```

| Endpoint               | Method | Description                                           |
| ---------------------- | ------ | ----------------------------------------------------- |
| `/api/sync`            | POST   | Runs scraper → LLM pipeline; streams progress via SSE |
| `/api/reviews/status`  | POST   | Updates review status (`pending`/`resolved`/`dismissed`) |
| `/api/debug/rollback`  | POST   | Removes last 10 records; clears manual operation fields (demo reset) |
| `/health`              | GET    | Health check                                          |

SSE event format: `{"phase": "scraper|llm|done|error", "current": N, "total": N, "msg": "..."}`

---

## Dashboard Metrics

| Metric Card    | Definition                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| P0 級災情      | Reviews in 工程研發 or 客服金流 with `risk_level = high`                   |
| 炎上指數       | Sum of all `thumbsUpCount` across filtered reviews                         |
| VIP 流失數     | Count of reviews where `is_vip_player === true`                            |

Each card displays a 30-day real Sparkline trend (single-pass `useMemo` from `filteredReviews`). Click any card to open a **DrillDialog** with a full `AreaChart` + peak/avg/latest stats. Static `fakeTrend()` and delta badges have been removed.

---

## Frontend

```bash
npm install
npm run dev      # dev server
npm run build    # TypeScript check + production build
```

### Data Flow

```
[Google Play — 競技麻將2]
     ↓ scraper.py (v2.0, thumbsUpCount)
[raw_reviews.json]
     ↓ llm_service.py (new categories + VIP + risk override)
[cached_reviews.json] ←──── public/data/cached_reviews.json
     ↓ fetchReviews()                        ↑
[React App.tsx] ──── /api/sync ────→ [FastAPI main.py]
   useMemo()                              SSE Stream
   starFilter                        scraper → llm pipeline
   selectedCategory                  每批 yield 進度
     ↓
[MetricCards]     [InsightChart]  [BadgeCloud]    [DetailSheet → ReviewCard]
 30d real trend    click filter    sentiment       status management
 DrillDialog                       dual-dimension  AI PR reply generator
 AreaChart                         colour coding   optimistic update
```

---

## Environment Variables

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> `.env` is gitignored and **never** committed.

---

## Roadmap

- [x] LLM pipeline — scraper + Groq batch analysis
- [x] Frontend component architecture (feature-based)
- [x] FastAPI backend — `/api/sync` SSE streaming endpoint
- [x] Data Service — `src/services/api.ts` wired to all frontend components
- [x] Loading / Skeleton state + JumpingDots animation
- [x] BarChart + BadgeCloud + DetailSheet connected to real data
- [x] Star filter (1–2 / 1–3 / 1–5 stars) + category click-through
- [x] Switch target app to 競技麻將2 with new 6-category taxonomy
- [x] VIP player detection (`is_vip_player`) + `thumbsUpCount` dimension
- [x] P0/backlash/VIP churn dashboard metrics with Sparkline trend cards
- [x] DetailSheet: VIP badge + sort by thumbs-up
- [x] Review status management (`pending`/`resolved`/`dismissed`) — optimistic update + backend persistence
- [x] 30-day real trend data — replaced `fakeTrend()` with single-pass `useMemo`
- [x] MetricCard drill-down dialog — `DrillDialog` with full `AreaChart` + stats summary
- [x] AI PR reply generator — template-based, per-review, VIP-aware
- [x] Keyword sentiment dual-dimension — normalised frequency + sentiment colour coding
- [x] `shadcn/ui Dialog` primitive added (`src/components/ui/dialog.tsx`)
- [ ] Real delta badge — historical period-over-period comparison (planned)
- [ ] Code-split bundle (currently 1,096KB — Tremor SparkAreaChart)
