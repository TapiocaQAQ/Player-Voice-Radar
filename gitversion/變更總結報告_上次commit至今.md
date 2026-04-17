# 變更總結報告：上次 Commit 至今

> **基準 commit**：`a79df2e` — feat(pipeline+frontend): add LLM review pipeline and refactor component architecture  
> **報告日期**：2026-04-16  
> **統計**：13 個已修改檔案 + 5 個新增檔案（未追蹤），共 +2425 / -449 行

---

## 一、新增檔案（未追蹤 → 新功能）

### 1. `backend/main.py` — FastAPI 微型後端
全新建立的 FastAPI 應用程式，作為前端「強制同步」按鈕的後端服務。

| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/sync` | POST | 依序驅動 scraper → LLM 管線，以 **Server-Sent Events (SSE)** 串流回傳進度 |
| `/api/debug/rollback` | POST | 移除最新 20 筆資料，供 Demo 前快速回溯 |
| `/health` | GET | 健康檢查 |

- 整合 CORS middleware，允許前端跨域呼叫
- SSE 事件格式：`{"phase": "scraper|llm|done|error", "current": N, "total": N, "msg": "..."}`

### 2. `src/services/api.ts` — 前端 API 服務層（全新建立）
將所有後端通訊邏輯集中於服務層，定義完整 TypeScript 介面：

- **`ReviewData`** / **`AIAnalysis`** — 評論資料結構型別
- **`SyncProgress`** — SSE 進度事件型別
- **`triggerSync(onProgress)`** — 觸發同步並透過 ReadableStream 解析 SSE 進度回呼
- **`fetchReviews()`** — 從 `public/data/cached_reviews.json` 載入評論（帶 cache-bust timestamp）
- **`rollbackData()`** — 呼叫 debug rollback API

### 3. `src/components/ui/skeleton.tsx` — 骨架屏元件
新增 shadcn 風格的 Skeleton UI 元件，供載入過渡動畫使用。

### 4. `src/components/ui/jumping-dots.tsx` — 跳動點點載入動畫
新增自訂 `<JumpingDots />` 元件，顯示於同步訊息末尾，強化等待狀態的視覺回饋。

### 5. `gitversion/*.md` — 端到端驗證報告（3 份）
- `LLM管線建置+前端架構重組+600筆評論分析完成.md`
- `FastAPI後端建置+前端強制同步聯動+端到端驗證完成.md`
- `Debug回溯機制實作+端到端驗證完成.md`

---

## 二、後端重大修改

### `backend/llm_service.py` — LLM 管線改為 Generator 架構

**核心變更**：`main()` 函式從單純執行函式改為 **Python Generator**，支援逐批 yield 進度事件。

```
舊版：main() → 執行完才返回，FastAPI 無法取得中間進度
新版：main() → 每批次完成後 yield {"current", "total", "msg"}，FastAPI SSE 可即時推送
```

具體改動：
- `load_env()` 的錯誤處理改為 `raise RuntimeError` 取代 `sys.exit(1)`（讓呼叫端處理）
- `scraper.py` 的 `sys.exit(1)` 同樣改為 `raise RuntimeError`
- 批次處理 inline 化，每批次完成後 `yield` 進度
- Fallback 逐筆送出機制保留
- CLI 呼叫端改為 `for progress in main(): print(...)` drain generator

### `backend/requirements.txt` — 新增套件

```diff
+ fastapi
+ uvicorn[standard]
```

---

## 三、前端重大修改

### `src/App.tsx` — 全面重構為動態資料驅動架構

| 面向 | 舊版 | 新版 |
|------|------|------|
| 資料來源 | Hardcoded mock data | 從 FastAPI + JSON 動態載入 |
| 載入狀態 | 無 | `<LoadingSkeleton>` 骨架屏 + `<JumpingDots>` |
| 同步功能 | 無 | `handleSync()` 觸發 SSE 串流同步 |
| 回溯功能 | 無 | `handleRollback()` debug 回溯 |
| 資料計算 | 無 | `useMemo` 計算 metricData / chartData / keywordData |
| 星評篩選 | 無 | `starFilter` state（1-2 / 1-3 / 1-5） |
| 分類篩選 | 無 | `selectedCategory` 點擊圖表開啟 DetailSheet |
| 同步訊息 | 無 | `SYNC_MESSAGES` 陣列，每 2.5 秒輪換 |

**新增 hooks**：
- `useEffect` — 掛載時自動 `fetchReviews()`
- `useEffect` — sync 中自動輪換載入訊息
- `useRef` — 管理 interval 清除
- `useMemo` — 篩選計算、metric 聚合、chart 資料、keyword 資料

### `src/components/features/charts/InsightChart.tsx`

- **介面改為接收 props**：`data: { name, count }[]` + `onCategorySelect(category)`（原為 hardcoded 靜態資料）
- 新增 `colorByRank()` 函式：依排名動態分配顏色（第1 critical / 第2 warning / 其餘 info）
- 新增 `ChartItem` 型別介面
- X 軸 dataKey 從 `category` 改為 `name`
- 點擊事件從 `onBarClick` 改為 `onCategorySelect(label)` 傳遞實際分類名稱
- 總計數改為動態計算：`data.reduce((sum, d) => sum + d.count, 0)`

### `src/components/features/detail/DetailSheet.tsx`

- **介面改為接收真實資料**：`selectedCategory: string | null` + `reviews: ReviewData[]`
- 移除全部 hardcoded mock 評論（3 筆假資料）
- 根據 `selectedCategory` + `risk_level === 'high'` 動態篩選高風險評論
- AI 根因診斷區塊改為顯示真實 `root_cause_summary`
- 模型標示從 `gemini-2.0-flash` 改為 `qwen3-32b (groq)`
- 標題動態顯示選中的分類名稱

### `src/components/features/keywords/BadgeCloud.tsx`

- **介面改為接收 props**：`keywords: KeywordItem[]`（原為 hardcoded 14 筆關鍵字）
- 移除 hardcoded keywords 常數
- 新增 `KeywordItem` 介面 export（供 App.tsx 使用）
- `count` 欄位統一改名為 `value`（配合 API 資料結構）

### `src/components/features/metrics/MetricCards.tsx`

- 移除 Sparkline SVG 元件（`Sparkline`、`toPoints`、`smoothLinePath`）
- 移除 `MetricCard` 的 `delta`、`deltaLabel`、`deltaColor`、`sparkData`、`sparkColor` props
- 簡化 MetricCard 介面，移除不再使用的統計趨勢功能

### `src/components/layout/Header.tsx`

- 新增同步按鈕與星評篩選 UI 支援（接收來自 App.tsx 的 props）

### `tailwind.config.ts`

- 新增自訂動畫配置（用於 JumpingDots 和 Skeleton 骨架屏效果）

---

## 四、設定檔變更

### `.claude/settings.json`

- 新增 `permissions.allow` 陣列，whitelist 開發期間使用的 PowerShell / cmd 指令
- 新增 `additionalDirectories` 指向截圖資料夾
- 欄位順序調整（`shell`、`timeout`、`async` 重排序，功能不變）

### `CLAUDE.md`

新增兩個重要章節：
1. **File & Output Storage Guidelines** — 規定截圖存 `./screenshot`，報告存 `./gitversion`
2. **Python Virtual Environment Rules** — 規定所有 Python 操作必須使用 `conda run -n PlayerVoiceRadar`

---

## 五、資料更新

### `public/data/cached_reviews.json`

- 評論資料大幅擴充（+1942 行，從約 50 筆擴增至 600+ 筆）
- 每筆評論包含完整 `ai_analysis` 欄位（LLM 分析結果）

---

## 六、架構總覽圖

```
[Google Play] 
     ↓ scraper.py
[raw_reviews.json]
     ↓ llm_service.py (Groq qwen3-32b)
[cached_reviews.json] ←──────── /data/cached_reviews.json
     ↓ fetchReviews()                      ↑
[React App.tsx]  ──── /api/sync ────→ [FastAPI main.py]
   useMemo()                              SSE Stream
   starFilter                        scraper → llm
   selectedCategory                  每批 yield 進度
     ↓
[MetricCards] [InsightChart] [BadgeCloud] [DetailSheet]
 (動態資料)    (點擊分類)    (動態關鍵字)  (真實評論)
```

---

## 七、變更摘要

| 分類 | 數量 |
|------|------|
| 新增後端模組 | 1（`main.py`） |
| 新增前端服務 | 1（`api.ts`） |
| 新增 UI 元件 | 2（`skeleton.tsx`、`jumping-dots.tsx`） |
| 重構前端元件 | 5（App / InsightChart / DetailSheet / BadgeCloud / MetricCards） |
| 修改後端模組 | 2（`llm_service.py`、`scraper.py`） |
| 新增套件依賴 | 2（`fastapi`、`uvicorn[standard]`） |
| 設定更新 | 2（`.claude/settings.json`、`CLAUDE.md`） |
| 資料更新 | 1（`cached_reviews.json` +~550 筆） |
