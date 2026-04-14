# Project Blueprint: Player-Voice-Rader (遊戲營運即時監控儀表板)

## 1. 專案概述與架構限制
* 專案目標：為遊戲營運團隊開發一個單頁應用程式 (SPA) 儀表板，即時視覺化玩家反饋與流失風險。
* 技術棧：Vite + React (TypeScript) + Tailwind CSS v4+。
* UI 組件庫：
  - 圖表與指標卡片：嚴格使用 `Tremor` (@tremor/react)。
  - 佈局與基礎互動元件：嚴格使用 `Shadcn UI` (包含 button, select, skeleton, sheet, card, badge)。
* 圖示庫：`lucide-react`。

## 2. 資料結構與本地 API 模擬 (Data Layer)
為了方便開發與後續串接真實後端，請建立一個獨立的 Data Service (例如 `src/services/api.ts`)。我們不使用 localStorage，而是模擬對本地靜態檔案的 fetch。

### 2.1 型別定義 (Types)
// TypeScript 介面定義
export interface AIAnalysis {
  sentiment: 'negative' | 'positive' | 'neutral';
  category: '系統Bug/連線' | '抽卡/中獎機率' | '活動設計' | '客服/帳號' | '其他';
  risk_level: 'high' | 'medium' | 'low';
  keyword: string;
  root_cause_summary: string;
}

export interface ReviewData {
  review_id: string;
  player_name: string;
  date: string; // YYYY-MM-DD
  star_rating: number; // 1-5
  review_text: string;
  ai_analysis: AIAnalysis;
}

### 2.2 模擬資料獲取邏輯 (Mock Fetch Logic)
* 目標路徑：讀取 `public/data/cached_reviews.json` (若檔案不存在或為空，程式需準備一份包含約 50 筆符合上述型別假資料的 fallback)。
* 網路延遲模擬：所有資料讀取操作必須包裝在一個 `Promise` 中，並使用 `setTimeout` 模擬 3-5 秒的非同步網路延遲，以利展示 Loading 狀態。

## 3. 系統狀態與 UX 設計 (States)
* 載入狀態 (Loading State)：
  * 觸發時機：模擬 Fetch 進行中的 3-5 秒。
  * 視覺表現：使用 Shadcn `<Skeleton>` 渲染全螢幕的版面骨架。
  * 動態文案：在畫面上方顯示自動切換的文字：「📡 正在同步 Google Play 最新玩家評論...」 -> 「🧠 Gemini 模型正在進行情緒分析與痛點萃取...」 -> 「📊 正在生成營運洞察圖表，即將完成...」。
* 空狀態 (Empty State)：
  * 觸發時機：當「星等篩選」後，某個分類的評論數量為 0。
  * 視覺表現：淺綠色調的 UI 卡片，帶有打勾圖示與文案：「🎉 太棒了！今日無異常警報。目前該分類下沒有偵測到任何玩家負面反饋。」

## 4. 介面佈局與功能需求 (Layout & Features)

### 區塊 A：頂部控制列 (Global Controls)
* 標題：PlayerPulse-AI - 營運痛點即時監控中心
* 操作區：
  - 🔄 強制同步按鈕 (點擊後重新觸發 Loading State)。
  - 星等篩選器 (Shadcn Select，預設選擇 1~3 星)。
* 關鍵指標區：使用 Tremor `<Card>` 與 `<Metric>` 並排顯示三張卡片：
  1. 今日新增負評數。
  2. 高流失風險玩家數 (risk_level === 'high')。
  3. 最高風險警報分類 (負評數最多的 category)。

### 區塊 B：主視覺洞察區 (Hero Section)
* 左側 (佔寬 2/3)：Tremor `<BarChart>`
  - 資料綁定：X 軸為 category，Y 軸為該分類的評論數量。
  - 互動需求：長條圖必須綁定點擊事件 (`onValueChange`)，點擊長條圖時，將該分類設為 `selectedCategory` 狀態。
* 右側 (佔寬 1/3)：文字雲 (Keyword Badge Cloud)
  - 資料綁定：萃取當前篩選資料的所有 `keyword`。
  - 視覺表現：使用 Shadcn `<Badge>` 排列，出現頻率越高的關鍵字給予越深的紅色背景。

### 區塊 C：聯動分析面板 (Action Panel)
* 觸發時機：當 `selectedCategory` 有值時，從畫面右側滑出 Shadcn `<Sheet>`。
* 面板內容：
  - 標題：當前選擇的分類名稱。
  - AI 根因診斷 (Card)：顯示該分類下第一筆資料的 `root_cause_summary`。
  - 高風險客訴清單：滾動列表，過濾並顯示該分類下 `risk_level === 'high'` 的完整原始評論 (包含玩家名稱、日期、星等、內容)。
  - 生成回覆按鈕：底部放置「✨ 撰寫公關回覆草稿」按鈕。點擊後模擬 1 秒 Loading，展開預設的官方安撫回覆文案。

---
