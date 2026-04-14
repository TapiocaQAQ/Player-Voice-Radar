# Player Voice Radar

> Real-time player sentiment analysis dashboard powered by Google Play reviews + Groq LLM.

A full-stack analytics tool that scrapes mobile game reviews, classifies them with an LLM pipeline, and visualises the results as an interactive radar dashboard.

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite                    |
| UI       | Tailwind CSS v3, Radix UI, Tremor, shadcn/ui    |
| Backend  | Python 3 — `google-play-scraper` + Groq SDK     |
| LLM      | `qwen/qwen3-32b` via Groq API                   |
| Data     | `public/data/cached_reviews.json` (600 records) |

---

## Project Structure

```
Player-Voice-Radar/
├── backend/
│   ├── scraper.py          # Step 1: Google Play review scraper
│   ├── llm_service.py      # Step 2: Groq LLM batch analysis pipeline
│   └── requirements.txt
├── public/
│   └── data/
│       └── cached_reviews.json   # 600 LLM-analysed reviews
├── src/
│   ├── components/
│   │   ├── layout/         # Header
│   │   ├── features/
│   │   │   ├── charts/     # InsightChart
│   │   │   ├── detail/     # DetailSheet
│   │   │   ├── keywords/   # BadgeCloud
│   │   │   └── metrics/    # MetricCards
│   │   └── ui/             # shadcn/ui primitives
│   ├── constants/          # Design tokens & shared constants
│   ├── data/               # Mock data (pending real API wiring)
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
- Auto-retry on `json.JSONDecodeError` (up to 3×)
- Rate-limit 429 → parse suggested wait time → sleep → retry (zero data loss)
- Batch-failure fallback: batch of 3 → individual → `bad_data.json`

---

## Frontend

```bash
npm install
npm run dev      # dev server
npm run build    # TypeScript check + production build
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

- [ ] Data Service — wire `cached_reviews.json` to frontend components
- [ ] Loading / Empty state implementation
- [ ] BarChart + BadgeCloud + DetailSheet connected to real data
- [ ] Analyse remaining ~120 reviews (720 − 600)
