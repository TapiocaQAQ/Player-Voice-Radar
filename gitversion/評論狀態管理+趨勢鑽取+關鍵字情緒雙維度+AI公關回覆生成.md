# 變更總結報告 — 評論狀態管理 + 趨勢鑽取 Dialog + 關鍵字情緒雙維度 + AI 公關回覆生成

> **基準 Commit：** `3b8fe85` feat(analysis): switch target to 競技麻將2 with VIP dimension and metric overhaul  
> **報告日期：** 2026-04-17  
> **異動檔案數：** 11 個檔案（6 修改 + 3 刪除 + 4 新增未追蹤）  
> **目前分支：** `feat/mahjong2-vip-metrics-upgrade`

---

## 一、總覽摘要

本次異動圍繞三個核心主題展開：

1. **評論狀態管理系統**：前後端全鏈路新增 `pending / resolved / dismissed` 三態管理，讓 PM/客服可直接在儀表板標記評論處理狀態
2. **指標卡片鑽取**：從靜態 `fakeTrend()` 假資料升版至真實 30 天歷史趨勢，並新增可點擊 `DrillDialog` 展開完整走勢圖
3. **關鍵字情緒雙維度**：`BadgeCloud` 加入情緒維度（正面/負面/中性）以顏色編碼，字體大小保持代表頻率

---

## 二、逐檔異動明細

### 1. `backend/main.py` — 新增評論狀態 API + 修正 Rollback

#### 1-1. 新增 `POST /api/reviews/status`

```python
class ReviewStatusUpdate(BaseModel):
    review_id: str
    status: Literal["pending", "resolved", "dismissed"]

@app.post("/api/reviews/status")
def update_review_status(body: ReviewStatusUpdate):
    """更新單一評論的處理狀態，寫入 cached_reviews.json 的 status 欄位"""
```

- 讀取 `PROJECT_ROOT / "public/data/cached_reviews.json"`（修正相對路徑問題）
- 找到對應 `review_id` 寫入 `status` 欄位後覆寫整個 JSON 檔案
- 找不到 `review_id` 時回傳 `404 HTTPException`

#### 1-2. Rollback 端點修正

| 項目 | 舊值 | 新值 |
|------|------|------|
| 回溯筆數 | 20 筆 | **10 筆** |
| 路徑寫法 | 相對路徑 `Path("backend/...")` | 絕對路徑 `PROJECT_ROOT / "backend/..."` |
| 回溯後清理 | 無 | **清除 `status`, `pr_draft`, `pr_reply`, `operator_note` 等人工操作欄位** |

**新增常數：** `PROJECT_ROOT = Path(__file__).parent.parent` 解決工作目錄不確定問題

**新增 import：** `from typing import Literal`、`from fastapi import HTTPException`、`from pydantic import BaseModel`

---

### 2. `src/services/api.ts` — 新增 ReviewStatus 型別與更新函式

```typescript
// 新增型別
export type ReviewStatus = "pending" | "resolved" | "dismissed"

// ReviewData 介面新增選擇性欄位
export interface ReviewData {
  // ... 既有欄位 ...
  status?: ReviewStatus   // ← 新增
}

// 新增 API 函式
export async function updateReviewStatus(
  review_id: string,
  status: ReviewStatus
): Promise<{ status: string; review_id: string; new_status: string }>
```

- 發送 `POST /api/reviews/status` 給後端
- 錯誤時解析 `body.detail` 拋出中文錯誤訊息
- **Rollback 說明文字同步更新：** 「20 筆」→「10 筆」

---

### 3. `src/App.tsx` — 趨勢資料計算 + 情緒維度 + 版本升級

#### 3-1. 新增 `trendData` useMemo（取代 `fakeTrend()`）

```typescript
const trendData = useMemo(() => {
  // 單次遍歷：按日期分組三個指標
  const dateMap = new Map<string, { p0: number; backlash: number; vipChurn: number }>()
  for (const r of filteredReviews) {
    // 累積 p0 / backlash(thumbsUpCount) / vipChurn
  }
  // 保留最新 30 天
  return { p0Trend, backlashTrend, vipChurnTrend }
}, [filteredReviews])
```

- 採用**單次遍歷（single pass）**，避免三次獨立 reduce，效能最佳
- 按 ISO 日期字典排序後取最後 30 筆
- `trendData` 向下傳遞至 `<MetricCards metrics={metricData} trendData={trendData} />`

#### 3-2. `keywordData` 加入情緒聚合

```typescript
// 新增：每個關鍵字的情緒分布統計
const kwSentiments: Record<string, Record<string, number>> = {}
// ...
// 輸出多數決情緒
const sentiment = (['positive', 'negative', 'neutral']).reduce(
  (best, s) => (sentMap[s] ?? 0) > (sentMap[best] ?? 0) ? s : best,
  'neutral'
)
return { text, value, sentiment }
```

#### 3-3. 其他改動

| 項目 | 舊值 | 新值 |
|------|------|------|
| 版本號 | `v0.1.0` | `v2.1.0` |
| DetailSheet props | 無 `onStatusChange` | 傳入 `onStatusChange`，同步更新 `reviews` state |
| import | 無 `ReviewStatus` | `import { ..., type ReviewStatus, ... }` |

---

### 4. `src/components/features/metrics/MetricCards.tsx` — 鑽取 Dialog + 真實趨勢

#### 4-1. 新增型別介面

```typescript
export interface TrendPoint { day: string; value: number }
export interface TrendData {
  p0Trend: TrendPoint[]
  backlashTrend: TrendPoint[]
  vipChurnTrend: TrendPoint[]
}
// MetricCardsProps 新增 trendData: TrendData 參數
```

#### 4-2. 移除假資料，接入真實趨勢

- **完全移除 `fakeTrend()` 函式**（靜態假資料）
- 每張卡片的 `sparkData` 改由父元件傳入真實歷史資料

#### 4-3. 新增 `DrillDialog` 元件

```typescript
function DrillDialog({ open, onClose, title, sparkData, tremorColor, accentColor }) {
  // 使用 @tremor/react AreaChart 展示完整 30 天走勢
  // 底部顯示 峰值 / 均值 / 最新 三個統計摘要
}
```

- 使用 `shadcn/ui Dialog` 作為底層容器（新增 `src/components/ui/dialog.tsx`）
- `AreaChart`（完整）取代 `SparkAreaChart`（精簡）展示鑽取資料

#### 4-4. MetricCard 卡片改動

- **移除** `delta`、`deltaPositive` props（靜態「+12%」等假百分比）
- **新增** `tremorColor`（`"rose" | "amber" | "purple"`）、`dialogTitle` props
- 卡片本身加上 `role="button"`、`onClick`、hover 動效（`hover:scale-[1.015]`）
- 新增「近 30 天趨勢 · 點擊查看」提示文字

---

### 5. `src/components/features/detail/DetailSheet.tsx` — 評論狀態管理 + AI 公關回覆生成

#### 5-1. 抽取 `ReviewCard` 獨立元件

原本內嵌在 `DetailSheet` 的評論渲染邏輯，全部提取至 `ReviewCard` 元件，提升可讀性與可測性。

**`ReviewCard` 的 local state：**

```typescript
const [localStatus, setLocalStatus] = useState<ReviewStatus>(review.status ?? 'pending')
const [isUpdating, setIsUpdating] = useState(false)
const [prReplyOpen, setPrReplyOpen] = useState(false)
const [prReply, setPrReply] = useState('')
const [copied, setCopied] = useState(false)
```

#### 5-2. 評論狀態管理（Optimistic Update）

```typescript
const handleStatusUpdate = async (newStatus: ReviewStatus) => {
  const prevStatus = localStatus
  setLocalStatus(newStatus)      // 樂觀更新 UI
  try {
    await updateReviewStatus(review.review_id, newStatus)
    onStatusChange(review.review_id, newStatus)
  } catch (e) {
    setLocalStatus(prevStatus)   // API 失敗時回退
  }
}
```

- **三態視覺**：
  - `pending`（預設）：暗色卡片 `#141418`，白色邊框
  - `resolved`（已處理）：綠色底色 `rgba(34,197,94,0.06)`，綠色邊框
  - `dismissed`（已忽略）：近黑色，45% 透明度
- **操作按鈕**：`pending` 狀態顯示「處理」`（CheckCircle2）`/ 「忽略」`（XCircle）`按鈕；非 `pending` 顯示「撤銷」連結

#### 5-3. AI 公關回覆生成器

```typescript
function generatePrReply(review: ReviewData): string {
  // 依 sentiment / category / root_cause_summary / is_vip_player
  // 組合個人化公關回覆草稿（繁體中文）
}
```

- VIP 玩家自動加入：「作為尊貴的 VIP 玩家，將優先安排客服專員跟進」
- 點擊「✨ 生成公關回覆」展開文字框，右上角有一鍵複製（`Copy` / `Check` icon 動態切換）
- 複製後 2 秒自動回復圖示

#### 5-4. 動態風險顏色 `RiskBadge` 元件

```typescript
const RISK_STYLES = {
  high:   { bg: ..., color: '#ff7a73', label: 'CHURN-RISK: HIGH', severity: 'Critical' },
  medium: { bg: ..., color: '#ffb733', label: 'CHURN-RISK: MED',  severity: 'Warning'  },
  low:    { bg: ..., color: '#34c759', label: 'CHURN-RISK: LOW',  severity: 'Info'     },
}
```

- Panel header 的嚴重性標籤（原本寫死 `"Critical"`）改為動態讀取第一筆評論的風險等級

#### 5-5. 移除底部 Footer

- 移除舊的「撰寫公關回覆草稿」白色按鈕 Footer
- 公關回覆入口改至每張評論卡片底部的 `✨ 生成公關回覆` 按鈕（更貼近操作情境）

#### 5-6. 新增 import

`useCallback`、`CheckCircle2`、`XCircle`、`Copy`、`Check`（lucide-react）

---

### 6. `src/components/features/keywords/BadgeCloud.tsx` — 情緒雙維度視覺化

#### 6-1. 新增 `Sentiment` 型別與情緒色彩系統

```typescript
type Sentiment = 'positive' | 'negative' | 'neutral'

function getTextColor(sentiment: Sentiment, normValue: number): string
// negative: 淡紅(#ffd5d3) → 危險紅(#ff3b30, Apple HIG)
// positive: 淡綠(#c0f0cc) → 成功綠(#30d158, Apple HIG)
// neutral:  深灰(#4d4d4d) → 近白(#fdfcfc, Vercel Gray)
```

#### 6-2. 標準化頻率編碼

- 舊：以絕對值（`>= 22`, `>= 16`…）分 5 層 → 無法跨資料集
- 新：`norm = kw.value / maxValue`（0–1 正規化）→ 相對排名，自動適應任何資料分布

#### 6-3. 新背景色系統

```
negative → rgba(255,91,79,0.06)   // 暗紅底
positive → rgba(52,199,89,0.05)   // 暗綠底
neutral  → rgba(255,255,255,0.03) // 透明灰底
```

所有 badge 統一加上 `border: '1px solid rgba(255,255,255,0.05)'`，取代舊版各層不同 `paddingLeft/Right`

#### 6-4. `KeywordItem` 介面新增 `sentiment`

```typescript
export interface KeywordItem {
  text: string
  value: number
  sentiment: Sentiment  // ← 新增
}
```

#### 6-5. 圖例重設計

- 舊：頻率色階（5 個色點）
- 新：雙維度圖例
  - `A A A`（小中大字型）＝ 出現頻率
  - 淡紅→危險紅 ＝ 負面
  - 淡綠→成功綠 ＝ 正面
  - 深灰→近白 ＝ 中性

---

### 7. 新增未追蹤檔案

| 檔案 / 目錄 | 說明 |
|------------|------|
| `src/components/ui/dialog.tsx` | shadcn/ui Dialog 元件（為 `DrillDialog` 所需） |
| `public/data/README.md` | 資料目錄說明文件 |
| `docs/OpenCode/` | 新設計文件目錄（OpenCode 設計規範）|
| `docs/vercel/` | 新設計文件目錄（Vercel 設計規範）|

---

### 8. 已刪除檔案

| 檔案 | 刪除原因 |
|------|---------|
| `docs/DESIGN.md` | 已遷移至 `docs/OpenCode/` + `docs/vercel/` 分目錄 |
| `vercel/DESIGN.md` | 同上 |
| `src/data/mockData.ts` | Mock 資料完全移除，前端已全面接入真實 API |

---

## 三、架構影響評估

```
評論狀態管理資料流：
  DetailSheet > ReviewCard
    → handleStatusUpdate()
    → updateReviewStatus() [api.ts]
    → POST /api/reviews/status [backend/main.py]
    → cached_reviews.json [寫入 status 欄位]
    → onStatusChange() callback
    → App.tsx setReviews() [同步前端 state]

趨勢鑽取資料流：
  filteredReviews
    → trendData useMemo() [App.tsx — 真實歷史，單次遍歷]
    → MetricCards props
    → SparkAreaChart (卡片摘要)
    → DrillDialog > AreaChart (點擊後完整走勢)

關鍵字情緒資料流：
  filteredReviews
    → keywordData useMemo() [App.tsx — 多數決情緒]
    → BadgeCloud keywords: KeywordItem[]
    → getTextColor(sentiment, normValue) → 情緒色彩
```

**向後相容性：** `status` 欄位在 `ReviewData` 介面中為選擇性（`status?: ReviewStatus`），舊格式 JSON 資料（無 `status` 欄位）仍可正常載入，預設顯示為 `pending`。

---

## 四、功能完成度評估

| 功能 | 狀態 | 備註 |
|------|------|------|
| 評論狀態管理（前端） | ✅ 完成 | Optimistic Update + 撤銷 |
| 評論狀態管理（後端 API） | ✅ 完成 | `POST /api/reviews/status` |
| 評論狀態持久化至 JSON | ✅ 完成 | 寫入 `cached_reviews.json` |
| 30 天真實趨勢資料 | ✅ 完成 | 取代 `fakeTrend()` |
| MetricCard 點擊鑽取 | ✅ 完成 | `DrillDialog` + `AreaChart` |
| AI 公關回覆生成 | ✅ 完成 | 純前端，模板化生成 |
| 關鍵字情緒雙維度 | ✅ 完成 | 正規化頻率 + 情緒色彩 |
| delta 百分比（歷史對比） | ❌ 未實作 | 已移除靜態假數值，待後續接入真實歷史比較邏輯 |

---

## 五、待注意事項

1. **AI 公關回覆為純模板生成**，非 LLM 生成，適合快速草稿但需人工審閱後使用。
2. **評論狀態僅存在 `cached_reviews.json`**，重新執行 pipeline（`llm_service.py`）會覆寫整個檔案，導致狀態遺失——後續需考慮狀態持久化至獨立 DB 或合併策略。
3. **`rollback` 回溯 10 筆後會清除人工操作欄位**（`status`, `pr_draft` 等），這是預期行為，確保 Demo 環境乾淨。
4. **`dialog.tsx`** 尚未被 git 追蹤，執行 `git add src/components/ui/dialog.tsx` 後才會納入版本控制。
