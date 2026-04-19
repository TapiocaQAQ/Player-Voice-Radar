# 變更總結報告：新增 DEMO 動圖 + README 視覺更新 + 評論資料精修

**報告生成時間：** 2026-04-19  
**分支狀態：** `main`（尚未提交）  
**變動檔案：** 2 個已修改 + 1 個新增未追蹤

---

## 一、變動檔案總覽

| 檔案 | 變動類型 | 摘要 |
|------|---------|------|
| `README.md` | modified | 嵌入 DEMO.gif 動圖於 tagline 前 |
| `public/data/cached_reviews.json` | modified | 新增 4 筆評論 + 精修 6 筆現有評論 AI 欄位 |
| `docs/DEMO.gif` | untracked (新增) | 1920×1080 儀表板操作錄影 GIF（8.3 MB） |

---

## 二、詳細變動說明

### 2-1. `docs/DEMO.gif`（新增）

- **檔案格式：** GIF image data, version 89a
- **解析度：** 1920 × 1080
- **檔案大小：** 8,309,498 bytes（≈ 8.3 MB）
- **用途：** 在 README.md 中作為視覺化展示素材，呈現儀表板的完整操作流程（含 MetricCards、DrillDialog、BadgeCloud、ReviewCard 等核心功能）
- **存放路徑：** `docs/DEMO.gif`（與 `docs/DEVELOPER_GUIDE.md` 同目錄）

---

### 2-2. `README.md`（修改）

**變動位置：** 第 6 行後（badges 區塊下方，tagline 前方）

**差異（diff）：**
```diff
 [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
 
+
+
+![Player Pulse AI Demo](./docs/DEMO.gif)
 > **「在遊戲上線前期或新活動初期，精準攔截 P0 級災情，守住核心 VIP 玩家。」**
```

**變動說明：**
- 在 5 個 Shields.io badge 區塊與品牌 tagline 之間，插入 `![Player Pulse AI Demo](./docs/DEMO.gif)` 圖片嵌入語法
- 新增兩個空行作為視覺間距，確保 GIF 與 badges / tagline 之間有足夠留白
- 圖片使用相對路徑 `./docs/DEMO.gif` 引用，與倉庫結構一致
- **影響範圍：** 純 docs 修改，不影響任何應用程式邏輯或建置輸出

---

### 2-3. `public/data/cached_reviews.json`（修改）

#### A. 新增評論（4 筆，插入於陣列最前方）

| review_id | player_name | date | star | category | risk | is_vip | keyword | root_cause |
|-----------|-------------|------|------|----------|------|--------|---------|------------|
| `1c0b9187` | 楊金祥 | 2026-04-18 | ★5 | 其他 | low | false | 好玩 | 玩家覺得遊戲有趣 |
| `0386c6cc` | 張佐熙 | 2026-04-17 | ★5 | 其他 | low | false | good | 玩家對遊戲表示滿意 |
| `20158440` | 王綺綺 | 2026-04-17 | ★5 | UI/UX體驗 | low | false | 簡單好玩 | 玩家認為遊戲簡單有趣 |
| `d70a9acf` | 易水寒 | 2026-04-17 | ★1 | 營運企劃 | medium | false | 課金壓力 | 對遊戲課金壓力感到不滿 |

**補充：**
- 前三筆為正面短評，對整體 sentiment 分布影響輕微
- `d70a9acf`（易水寒）為負面評論，指出下載前需考量心臟與錢包負荷，歸類「營運企劃/medium」，反映課金壓力主題，與現有 `backlash` 指標相關

#### B. 精修現有評論（6 筆）

| review_id | 欄位 | 修改前 | 修改後 | 理由 |
|-----------|------|--------|--------|------|
| `94a08201`（嵐小妹） | risk_level | `medium` | `high` | 工程研發類無法登入升級為高風險 |
| `94a08201`（嵐小妹） | root_cause_summary | 玩家無法登入遊戲 | 遊戲無法正常登入 | 措辭精準化 |
| （徐聖昌相關） | keyword | 遊戲讚 | 遊戲體驗好 | 描述更具體 |
| （徐聖昌相關） | root_cause_summary | 玩家給予高度評價 | 對遊戲整體體驗感到滿意 | 語義更精確 |
| （阿唯相關） | category | 其他 | UI/UX體驗 | 重新分類，評論提到「好玩」偏 UI/UX |
| （收費評論） | risk_level | `medium` | `high` | 課金相關評論升為高風險 |
| （收費評論） | is_vip_player | `false` | `true` | 重新語義判斷：玩家描述符合 VIP 特徵 |
| （收費評論） | keyword | 收費過重 | 課金過高 | 統一關鍵字命名規範 |
| （收費評論） | root_cause_summary | 收費過重導致玩家流失 | 玩家認為遊戲內消費設計過於強烈 | 描述精準化 |
| （改版評論） | risk_level | `high` | `medium` | 改版失敗評論重新評估為中風險 |
| （改版評論） | root_cause_summary | 改版後無法上線 | 改版後遊戲無法正常上線 | 措辭精準化 |
| （另一讚賞評論） | keyword | 遊戲讚 | 遊戲好玩 | 統一白話關鍵字風格 |
| （另一讚賞評論） | root_cause_summary | 玩家給予正面評價 | 玩家對遊戲表示讚賞 | 措辭精準化 |

**精修邏輯說明：**
1. **risk_level 升降調整**：依據 `工程研發 + risk=high` 的 P0 定義，「無法登入」為典型工程研發類高風險事件，因此從 medium 升為 high；「改版失敗」原為 high，重新評估後降為 medium（不影響服務可用性）
2. **is_vip_player 修正**：課金相關評論中，玩家描述強烈的消費感受（「心臟跟錢包」等），判定符合 VIP 行為特徵，補標 `is_vip_player: true`
3. **keyword 統一命名**：將「遊戲讚」統一為更具體的描述性詞彙（「遊戲體驗好」、「遊戲好玩」），與其他關鍵字風格對齊

---

## 三、影響範圍分析

### 前端 Dashboard 指標影響

| 指標 | 影響 | 說明 |
|------|------|------|
| `totalReviews` | +4 | 新增 4 筆評論 |
| `p0Level` | +1～+2 | `94a08201` risk 從 medium→high（工程研發類），計入 P0 |
| `backlash` | +0 | 4 筆新評論 thumbsUpCount 均為 0 |
| `vipChurn` | +1 | 收費評論 is_vip_player false→true |
| `badgeCloud` | 輕微變動 | 新關鍵字「好玩」×3、「課金壓力」×1、「課金過高」×1 進入 keyword pool |
| `DrillDialog` 高風險列表 | +2 | 兩筆評論升為 high risk，出現在鑽取視圖 |

### 建置與效能
- 純資料檔案與文件修改，**不影響 TypeScript 編譯或 Vite 建置**
- `cached_reviews.json` 大小微增（+4 筆，約 +0.5KB）
- `docs/DEMO.gif`（8.3MB）僅為文件資源，**不打包進前端 bundle**

### 安全性掃描
- `README.md`：無敏感資訊，僅圖片嵌入語法
- `cached_reviews.json`：無 API key、無個人敏感資訊，評論資料均為公開 Google Play 評論
- `docs/DEMO.gif`：二進位圖片檔案，無程式碼，無安全疑慮

---

## 四、Commit 建議

**Commit Type：** `docs` + `data`（混合型，以 docs 為主）

**建議 Commit Title：**
```
docs: add DEMO gif to README and refresh review data quality
```

**建議 Commit Description：**
```
- Add 1920x1080 DEMO.gif to docs/ showing full dashboard walkthrough
- Embed DEMO.gif in README.md between badges and brand tagline
- Append 4 new reviews (2026-04-17~18) to cached_reviews.json
- Recalibrate risk_level/is_vip_player/keyword on 6 existing reviews
  for improved P0/vipChurn metric accuracy
```

---

## 五、PR 建議

**PR Title：** `docs: add dashboard DEMO gif + README visual update + review data QA`

**Target Branch：** `main` → 建議建立 `docs/demo-gif-readme-data-qa` 分支

**Reviewers：** 視 repo 設定而定

**Labels：** `documentation`, `data`
