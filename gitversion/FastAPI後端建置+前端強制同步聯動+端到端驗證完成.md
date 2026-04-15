# 改動詳細報告

> 日期：2026-04-14  
> 任務：建置 FastAPI 微型後端，並將其與前端「強制同步」按鈕聯動

---

## 一、`backend/requirements.txt` — 新增依賴

```diff
+ fastapi
+ uvicorn[standard]
```

原本只有爬蟲與 LLM 所需的三個套件，加入 FastAPI 框架與 ASGI 伺服器，讓後端能以 HTTP API 形式對外提供服務。

---

## 二、`backend/scraper.py` — 防止 API Server 崩潰

```diff
- print("[ERROR] 所有 App ID 均抓取失敗...")
- sys.exit(1)
+ raise RuntimeError("所有 App ID 均抓取失敗...")
```

**問題**：原本爬蟲失敗時呼叫 `sys.exit(1)`，這在命令列執行是正常行為，但當 FastAPI import 這個模組並呼叫 `main()` 時，`sys.exit()` 會直接殺死整個 uvicorn 程序，讓 API server 崩潰。

**修法**：改成 `raise RuntimeError`，讓例外往上拋給 FastAPI 的 try-except 捕獲，回傳 HTTP 500，server 繼續存活。

---

## 三、`backend/llm_service.py` — 同樣防崩潰，修兩處

```diff
# load_env() 內
- sys.exit(1)  # 找不到 GROQ_API_KEY
+ raise RuntimeError(...)

# main() 內
- sys.exit(1)  # 找不到 raw_reviews.json
+ raise RuntimeError(...)
```

邏輯與 scraper.py 相同。`__main__` 區塊內的 `sys.exit` 保持不動（那只在命令列直接執行時觸發，不影響 import）。

---

## 四、`backend/main.py` — 全新建立

FastAPI 微型後端，核心設計：

```
CORS Middleware (allow_origins=["*"])
    ↓
POST /api/sync
    ├─ Step 1: scraper.main()      爬取最新評論
    ├─ Step 2: llm_service.main()  增量 LLM 分析
    ├─ 成功 → { "status": "success", "message": "同步與分析完成" }
    └─ 失敗 → HTTP 500 + 錯誤訊息（server 不崩潰）

GET /health  →  { "status": "ok" }
```

關鍵設計決策：
- 用 `def`（同步函式）而非 `async def`，FastAPI 會自動把它丟進 thread pool 執行，不阻塞 event loop
- `traceback.print_exc()` 確保完整錯誤堆疊印到 uvicorn log，方便除錯
- 直接 `import backend.scraper` / `import backend.llm_service`，不用子程序，共享記憶體空間、執行更快

啟動指令（必須在專案根目錄）：
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

---

## 五、`src/components/ui/skeleton.tsx` — 新建 Shadcn Skeleton

```tsx
function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-md bg-[#111111]", className)} {...props} />
}
```

原本專案沒有安裝 Skeleton 元件，手動建立最小版本，配色用 `#111111`（比頁面背景 `#000000` 略亮），搭配 `animate-pulse` 產生呼吸動畫。

---

## 六、`src/services/api.ts` — 新建 API Service Layer

```typescript
triggerSync()   // POST http://localhost:8000/api/sync
fetchReviews()  // GET /data/cached_reviews.json?t=<timestamp>
```

將 HTTP 呼叫邏輯抽離到 service 層，App.tsx 不直接寫 fetch URL。`fetchReviews` 加上 `?t=Date.now()` 的 cache-busting 參數，確保 sync 完成後瀏覽器不會讀到舊的快取檔案。

---

## 七、`src/components/layout/Header.tsx` — 更新 AI 標籤

```diff
- ai: gemini-2.0-flash
+ ai: qwen3-32b (groq)
```

Header metadata bar 中的 AI model 標示，改為實際使用的模型。

---

## 八、`src/App.tsx` — 完整重寫同步邏輯

新增三個 state：

| State | 用途 |
|-------|------|
| `isSyncing` | 控制是否顯示 Skeleton 覆蓋層 |
| `msgIdx` | 輪播文案的索引（0/1/2） |
| `reviews` | sync 完成後儲存 fetchReviews() 回傳的資料 |

**`handleSync` 流程：**
```
點擊「強制同步」
  → setIsSyncing(true)          顯示 Skeleton
  → triggerSync()               POST /api/sync（等待後端跑完）
  → fetchReviews()              重新讀取 cached_reviews.json
  → setReviews(updated)         更新 state（ready for future data wiring）
  → setIsSyncing(false)         Skeleton 消失，回到正常畫面
  → 若失敗 → setSyncError(msg)  顯示紅色 error banner
```

**Loading 覆蓋層 `<SyncSkeleton>`：**
- useEffect 監聽 `isSyncing`，每 2.5 秒切換一次文案
- 三段文案：`正在同步 Google Play 最新玩家評論...` → `AI 模型正在進行情緒分析與痛點萃取...` → `正在生成營運洞察圖表，即將完成...`
- 骨架佈局：3 張 metric 卡（h-28）+ 左側大圖表 + 右側關鍵字雲，與真實版面結構一致

---

## 九、資料驗證結果

| 時間點 | cached_reviews.json 筆數 |
|--------|--------------------------|
| 改動前（驗證起點） | 710 筆（手動刪除最後 10 筆）|
| 強制同步完成後 | **722 筆** |

超過原本 720 筆，原因是 `scraper.py` 本次重新抓取時發現 2 筆更新的評論，增量更新機制自動補入。全部 722 筆均含 `ai_analysis`，日期範圍 2025-11-15 ~ 2026-04-13。
