# Player Voice Radar

> Real-time player sentiment analysis dashboard powered by Google Play reviews + Groq LLM.

A full-stack analytics tool that scrapes mobile game reviews, classifies them with an LLM pipeline, and visualises the results as an interactive radar dashboard — with a FastAPI backend for live on-demand sync.

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite                    |
| UI       | Tailwind CSS v3, Radix UI, Tremor, shadcn/ui    |
| Backend  | Python 3 — `google-play-scraper` + Groq SDK     |
| API      | FastAPI + Uvicorn (SSE streaming)               |
| LLM      | `qwen/qwen3-32b` via Groq API                   |
| Data     | `public/data/cached_reviews.json` (600 records) |

---

## Project Structure

```
Player-Voice-Radar/
├── backend/
│   ├── scraper.py          # Step 1: Google Play review scraper
│   ├── llm_service.py      # Step 2: Groq LLM batch analysis pipeline (generator)
│   ├── main.py             # Step 3: FastAPI server — /api/sync SSE + /api/debug/rollback
│   └── requirements.txt
├── public/
│   └── data/
│       └── cached_reviews.json   # 600 LLM-analysed reviews
├── src/
│   ├── components/
│   │   ├── layout/         # Header (sync button + star filter)
│   │   ├── features/
│   │   │   ├── charts/     # InsightChart (dynamic, click-to-filter)
│   │   │   ├── detail/     # DetailSheet (real review data)
│   │   │   ├── keywords/   # BadgeCloud (dynamic keywords)
│   │   │   └── metrics/    # MetricCards
│   │   └── ui/             # shadcn/ui primitives (Skeleton, JumpingDots)
│   ├── services/
│   │   └── api.ts          # fetchReviews / triggerSync (SSE) / rollbackData
│   ├── constants/          # Design tokens & shared constants
│   ├── data/               # (deprecated — replaced by real API)
│   ├── hooks/              # Custom React hooks (planned)
│   └── types/              # Domain TypeScript types
└── docs/
    ├── DESIGN.md
    └── project_blueprint.md
```

---

## Backend Pipeline

### Step 1 — Scraper

```bash
pip install -r backend/requirements.txt
python backend/scraper.py
# → backend/raw_reviews.json  (~720 reviews, last 150 days)
```

### Step 2 — LLM Analysis

```bash
# Requires backend/.env with GROQ_API_KEY=<your_key>
python backend/llm_service.py --limit 600
# → public/data/cached_reviews.json
```

Each review gets `ai_analysis`:

| Field               | Values                                                    |
| ------------------- | --------------------------------------------------------- |
| `sentiment`         | `positive` / `neutral` / `negative`                      |
| `category`          | 系統/連線、配桌/發牌、儲值/金流、帳號/客服、廣告/介面、其他 |
| `risk_level`        | `high` / `medium` / `low`                                 |
| `keyword`           | 2–5 character Chinese pain-point tag                      |
| `root_cause_summary`| ≤ 20 character one-line summary                           |

Pipeline reliability features:
- Generator-based `main()` — yields per-batch progress events for SSE streaming
- Auto-retry on `json.JSONDecodeError` (up to 3×)
- Rate-limit 429 → parse suggested wait time → sleep → retry (zero data loss)
- Batch-failure fallback: batch of 3 → individual → `bad_data.json`

### Step 3 — FastAPI Server (live sync)

```bash
uvicorn backend.main:app --reload --port 8000
```

| Endpoint               | Method | Description                                          |
| ---------------------- | ------ | ---------------------------------------------------- |
| `/api/sync`            | POST   | Runs scraper → LLM pipeline; streams progress via SSE |
| `/api/debug/rollback`  | POST   | Removes last 20 records (demo reset)                 |
| `/health`              | GET    | Health check                                         |

SSE event format: `{"phase": "scraper|llm|done|error", "current": N, "total": N, "msg": "..."}`

---

## Frontend

```bash
npm install
npm run dev      # dev server
npm run build    # TypeScript check + production build
```

### Data Flow

```
[Google Play]
     ↓ scraper.py
[raw_reviews.json]
     ↓ llm_service.py (Groq qwen3-32b)
[cached_reviews.json] ←──── public/data/cached_reviews.json
     ↓ fetchReviews()                      ↑
[React App.tsx] ──── /api/sync ────→ [FastAPI main.py]
   useMemo()                            SSE Stream
   starFilter                      scraper → llm pipeline
   selectedCategory                每批 yield 進度
     ↓
[MetricCards] [InsightChart] [BadgeCloud] [DetailSheet]
 (dynamic)     (click filter)  (dynamic)   (real reviews)
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

- [x] LLM pipeline — scraper + Groq batch analysis (600 reviews)
- [x] Frontend component architecture (feature-based)
- [x] FastAPI backend — `/api/sync` SSE streaming endpoint
- [x] Data Service — `src/services/api.ts` wired to all frontend components
- [x] Loading / Skeleton state + JumpingDots animation
- [x] BarChart + BadgeCloud + DetailSheet connected to real data
- [x] Star filter (1–2 / 1–3 / 1–5 stars) + category click-through
- [ ] Analyse remaining ~120 reviews (720 scraped − 600 processed)
- [ ] Code-split bundle (currently 668KB — Tremor/Radix UI)
