你是一位資深的全端 AI 工程師。我已經更新了產品的商業目標，現在我們要將 PlayerPulse-AI 專案升級為 v2.0，專門針對新上線的手遊《競技麻將2》進行「早期災情攔截」與「VIP 流失預警」。

請詳細閱讀以下 URD，並嚴格按照指示修改目前的程式碼庫（包含 `scraper.py`, `llm_service.py`, `App.tsx`, 以及相關的 Types 與 UI 組件）。

【URD: PlayerPulse-AI v2.0 系統重構指示】

### 1. 資料層與爬蟲重構 (backend/scraper.py)
- **App ID 變更**：將 `APP_IDS` 改為 `["com.igs.slots.casino.games.free.android"]` (競技麻將2的包名)。
- **新增欄位**：在 `normalize(item)` 函式中，擷取並新增 `"thumbsUpCount": int(item.get("thumbsUpCount", 0))`。
- **型別同步**：修改前端型別定義（如 `src/types/index.ts` 或 `src/services/api.ts`），在 `ReviewData` 介面新增 `thumbsUpCount: number`；在 `AIAnalysis` 介面新增 `is_vip_player: boolean`。

### 2. LLM 分析管線重構 (backend/llm_service.py)
- **Prompt 領域適應**：全面改寫 `SYSTEM_PROMPT`。
  - 角色設定改為分析《競技麻將2》的玩家評論。
  - `category` 嚴格限縮為 6 類："工程研發", "客服金流", "營運企劃", "UI/UX體驗", "行銷推廣", "其他"。
  - 分類判斷準則需定義：工程研發(閃退/斷線/登入/耗電)、客服金流(扣款未入帳/誤鎖)、營運企劃(機率/配桌/破產救濟)、UI/UX體驗(按鈕小/教學冗長/跑版)、行銷推廣(廣告過多/宣傳不實)。(備註：若涉及多部門如看廣告閃退，一律以「工程研發」優先)。
  - 新增輸出欄位：要求 JSON 內的 `ai_analysis` 必須包含 `"is_vip_player": true/false`（若文本提及「課金、儲值、花了X萬、老玩家」則為 true）。
- **風險等級強制覆寫 (Python層)**：在 `process_batch` 內，當 `json.loads(cleaned)` 成功後、回傳 list 之前，請加入 Python 邏輯遍歷該批次：若該物件的 `thumbsUpCount >= 10` 或 `ai_analysis.get("is_vip_player") is True`，則強制將其 `ai_analysis["risk_level"]` 設為 `"high"`。

### 3. 前端資料聚合與狀態重構 (src/App.tsx)
- 在 `App.tsx` 中修改 `metricData` 的 `useMemo` 計算邏輯，改為輸出以下三個核心指標：
  1. **P0Level** (P0級災情數)：`category` 為 "工程研發" 或 "客服金流"，且 `risk_level === 'high'` 的總數。
  2. **Backlash** (炎上指數)：當前 `filteredReviews` 中所有 `thumbsUpCount` 的總和。
  3. **VipChurn** (VIP流失數)：當前 `filteredReviews` 中 `is_vip_player === true` 的數量。
- 將上述三個新指標以 Props 傳遞給 `MetricCards`。

### 4. UI 視覺升級 (MetricCards & DetailSheet)
- **src/components/features/metrics/MetricCards.tsx**：
  - 接收新的 metrics Props。
  - 渲染三張 Tremor `<Card>`。每張卡片除顯示主數值外，請加入虛擬的 7 天趨勢走勢圖（若安裝了 `@tremor/react` 可使用 `<SparkAreaChart>`，否則使用隱藏 XY 軸的 `<AreaChart>` 模擬）以及虛擬的日環比 Badge（如 `+12%`）。
  - 顏色設定規範：P0災情使用 `rose`、炎上指數使用 `amber`、VIP流失使用 `purple`。
- **src/components/features/detail/DetailSheet.tsx**：
  - 在 Sheet 內部清單的上方，加入「排序方式：最新日期 / 最多按讚」的 Toggle 或是 Select。
  - 實作排序邏輯，預設使用日期排序。
  - 在渲染單筆評論時，若 `is_vip_player` 為 true，必須在 `player_name` 旁邊加上醒目的 `👑 VIP` 標籤 (使用 Shadcn Badge 搭配金黃色系)。
  - 在評論卡片右下角顯示該則評論的按讚數（如 `👍 {review.thumbsUpCount}`）。

請確保完全理解目前的專案結構，嚴格按照上述邏輯執行後端與前端的程式碼覆寫。若途中遭遇 UI 套件依賴問題，請自行補齊或以 Tailwind 刻出同等視覺效果。