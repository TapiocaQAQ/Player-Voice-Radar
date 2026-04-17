# 變更總結報告 — 切換目標 APP 至競技麻將2 + VIP 分析維度 + 儀表板指標全面升級

> **基準 Commit：** `7b2f26e` feat(fullstack): wire FastAPI SSE backend and dynamic data-driven frontend  
> **報告日期：** 2026-04-16  
> **異動檔案數：** 8 個檔案  
> **目前分支：** `feat/llm-pipeline-and-frontend-refactor`

---

## 一、總覽摘要

本次異動以「**切換分析目標 App**」為核心驅動力，從《明星三缺一》(`com.igs.mjstar31`) 全面切換至《**競技麻將2**》(`com.igs.slots.casino.games.free.android`)，同時引入 **VIP 玩家識別**、**thumbsUpCount（按讚數）** 兩個新維度，並依此重構前端所有指標卡片與評論詳情頁。

---

## 二、逐檔異動明細

### 1. `backend/scraper.py` — 爬蟲目標與參數更新

| 項目 | 舊值 | 新值 |
|------|------|------|
| 目標 App ID | `com.igs.mjstar31` / `com.igs.gametower`（備援）| `com.igs.slots.casino.games.free.android` |
| 目標 App 名稱 | 明星三缺一 | 競技麻將2 |
| 抓取筆數上限 | 3000 | 130 |
| 回溯天數 | 60 天 | 150 天 |
| 輸出欄位 | 5 欄 (`review_id`, `player_name`, `date`, `star_rating`, `review_text`) | **新增 `thumbsUpCount`** → 共 6 欄 |
| 模組說明 | PlayerPulse-AI v1.0 | PlayerPulse-AI **v2.0** |

**重點：** `thumbsUpCount` 從 Google Play 原始資料中直接取 `thumbsUpCount` 欄位，預設值為 `0`。

---

### 2. `backend/llm_service.py` — LLM 分析邏輯全面升版

#### 2-1. System Prompt 更新

**分析對象：** 明星三缺一 → 競技麻將2

**新增 `is_vip_player` 欄位：**
```json
"is_vip_player": true | false
```
- 識別標準：評論文本中出現「課金」、「儲值」、「花了X萬/千」、「老玩家」、「VIP」、「花錢」、「充值」等字眼 → `true`

**分類體系重構（6 大類）：**

| 舊分類 | 新分類 |
|--------|--------|
| 系統/連線品質 | **工程研發**（閃退、斷線、登入失敗、耗電） |
| 配桌/發牌機制 | **營運企劃**（機率不公、配桌不合理、活動設計） |
| 儲值/金流異常 | **客服金流**（扣款未入帳、客服無回應） |
| 帳號/客服/停權 | 合併進客服金流 |
| 廣告/介面體驗 | **UI/UX體驗** + **行銷推廣**（拆分） |
| 其他 | 其他（保留） |

> **優先規則：** 多部門交叉問題（如看廣告閃退）一律以「工程研發」優先。

**`root_cause_summary` 附加欄位：** 維持不超過 20 字的一句話痛點總結。

#### 2-2. 風險等級強制覆寫邏輯（新增後處理）

LLM 輸出後，程式自動掃描每筆分析結果，觸發以下條件則強制將 `risk_level` 覆寫為 `"high"`：

```
(thumbsUpCount >= 10) OR (is_vip_player === true)
```

這確保高共鳴評論與 VIP 課金玩家的客訴不會被低估風險。

---

### 3. `public/data/cached_reviews.json` — 全量資料替換

- 舊資料：約 **10,138 行**（明星三缺一評論，5 欄格式，舊分類體系）
- 新資料：約 **2,082 行**（競技麻將2評論，6 欄格式，含 `thumbsUpCount` + `is_vip_player`）
- 所有評論已通過新版 LLM pipeline 完整重新分析，分類全部套用新 6 類體系

---

### 4. `src/services/api.ts` — TypeScript 介面新增欄位

```typescript
// AIAnalysis 介面
+ is_vip_player: boolean

// ReviewData 介面  
+ thumbsUpCount: number
```

確保前端 TypeScript 型別安全，新欄位全面支援。

---

### 5. `src/App.tsx` — 儀表板核心指標重新定義

| 指標 | 舊定義 | 新定義 |
|------|--------|--------|
| 指標 1 | `totalReviews`（篩選負評總數） | **`p0Level`**（P0 級災情數：category 為「工程研發」或「客服金流」且 risk_level = high） |
| 指標 2 | `highRiskCount`（高流失風險評論數） | **`backlash`**（炎上指數：所有評論 `thumbsUpCount` 總和） |
| 指標 3 | `topCategory`（最高風險分類名稱） | **`vipChurn`**（VIP 流失數：`is_vip_player === true` 的數量） |

---

### 6. `src/components/features/metrics/MetricCards.tsx` — 指標卡片 UI 全面升版

**新增功能：**
- 引入 `@tremor/react` 的 `SparkAreaChart` — 每張卡片顯示 **7 天趨勢走勢圖**（sparkline）
- 新增 `delta` 差異標籤（如「+12%」），配合 `deltaPositive` 控制顏色語意（紅=惡化、綠=改善）
- 趨勢資料由 `fakeTrend()` 函式根據當前值確定性生成（視覺展示用）
- 卡片配色語意調整：
  - P0 級災情 → 紅色 `#ff7a73`
  - 炎上指數 → 琥珀色 `#ffb733`
  - VIP 流失數 → 紫色 `#c084fc`

**移除功能：** 舊版的 `pill`、`pillColor`、`pillBg`、`valueLarge`、`statusColor`、`statusBg` 等分散 props，統一由 `accentColor`/`accentBg` 取代。

---

### 7. `src/components/features/detail/DetailSheet.tsx` — 評論詳情 Sheet 新增互動

**新增功能：**

1. **排序切換器（Select 下拉）：**
   - 新增 `sortBy` state（`'date' | 'thumbs'`）
   - 支援「最新日期」和「最多按讚」兩種排序方式
   - 使用 shadcn/ui `Select` 元件，深色主題樣式

2. **VIP 標誌 Badge：**
   - 當 `review.ai_analysis.is_vip_player === true` 時，在玩家名稱旁顯示 `👑 VIP` 金色 Badge
   - 樣式：`rgba(251,191,36,0.18)` 底色 + `#FBBF24` 文字

3. **按讚數顯示：**
   - 每則評論底部新增 `ThumbsUp` 圖示 + 按讚數字
   - 使用 `lucide-react` 的 `ThumbsUp` icon

**新增 import：** `useState`、`ThumbsUp`（lucide）、`Badge`（shadcn）、`Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue`（shadcn）

---

### 8. `.claude/settings.json` — Claude Code 權限擴充

新增以下自動允許執行的指令（避免每次執行 conda 環境命令都需手動確認）：

```json
"Bash(conda run *)",
"Bash(/c/Users/john/miniconda3/condabin/conda.bat run *)",
"Bash(PYTHONIOENCODING=utf-8 /c/Users/john/miniconda3/envs/PlayerVoiceRadar/python.exe -m backend.scraper)",
"Bash(PYTHONIOENCODING=utf-8 /c/Users/john/miniconda3/envs/PlayerVoiceRadar/python.exe -m backend.llm_service)",
"WebFetch(domain:play.google.com)",
"Bash(/c/Users/john/miniconda3/envs/PlayerVoiceRadar/python.exe -c ' *)"
```

---

## 三、架構影響評估

```
資料流向：
  Google Play (競技麻將2)
    → scraper.py [抓取 130 筆，近 150 天，含 thumbsUpCount]
    → raw_reviews.json
    → llm_service.py [新分類體系 + is_vip_player + 風險覆寫]
    → cached_reviews.json [新格式 6 欄 + ai_analysis]
    → api.ts [TypeScript 型別保障]
    → App.tsx [新指標計算：p0Level / backlash / vipChurn]
    → MetricCards.tsx [Sparkline 趨勢卡片]
    → DetailSheet.tsx [VIP Badge + 按讚排序]
```

**向後相容性：** ❌ 不相容舊版 `cached_reviews.json`（舊資料缺少 `thumbsUpCount`、`is_vip_player`，分類名稱也已更換）。新系統需使用新 pipeline 重新生成資料。

---

## 四、待注意事項

1. **`delta` 數值為靜態展示**（`+12%`、`+8%`、`+5%`），尚未接入真實歷史對比邏輯，後續需實作時間序列比較。
2. **`fakeTrend()` 為確定性假資料**，Sparkline 視覺上具參考性但非真實趨勢，需後續補充真實歷史資料串接。
3. **`FETCH_COUNT = 130`** 為較小的抓取量，適合開發驗證，正式上線建議調高。
