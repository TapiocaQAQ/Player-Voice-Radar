"""
PlayerPulse-AI — FastAPI 微型後端

提供前端「強制同步」按鈕所需的 REST API，
依序驅動 scraper → llm_service 完整管線。

啟動方式（在專案根目錄執行）：
    uvicorn backend.main:app --reload --port 8000
"""

import json
import traceback
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# 直接 import 同目錄的管線模組
import backend.scraper as scraper
import backend.llm_service as llm_service

# ── App 初始化 ──────────────────────────────────────────────
app = FastAPI(title="PlayerPulse-AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ──────────────────────────────────────────────
@app.post("/api/sync")
def sync_pipeline():
    """
    依序執行：
    1. scraper.main()     — 爬取最新 Google Play 評論（單一 SSE 事件）
    2. llm_service.main() — 增量 LLM 分析，每批 yield 一個進度事件

    以 Server-Sent Events (text/event-stream) 持續回傳進度。
    每則事件格式：data: <JSON>\\n\\n
    phase 欄位：scraper | llm | done | error
    """
    def event_stream():
        try:
            print("[API] Step 1/2 — 執行爬蟲...")
            yield f"data: {json.dumps({'phase': 'scraper', 'current': 0, 'total': 0, 'msg': '正在爬取 Google Play 評論...'})}\n\n"
            scraper.main()

            print("[API] Step 2/2 — 執行 LLM 增量分析...")
            yield f"data: {json.dumps({'phase': 'scraper', 'current': 0, 'total': 0, 'msg': '評論爬取完成，準備 AI 分析...'})}\n\n"

            for progress in llm_service.main():
                payload = {"phase": "llm", **progress}
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

            print("[API] 同步完成。")
            yield f"data: {json.dumps({'phase': 'done', 'msg': '同步與分析完成'})}\n\n"

        except Exception as exc:
            detail = f"{type(exc).__name__}: {exc}"
            print(f"[API][ERROR] {detail}")
            traceback.print_exc()
            yield f"data: {json.dumps({'phase': 'error', 'msg': detail})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/debug/rollback")
def debug_rollback():
    """
    移除兩個 JSON 檔案中最新的 20 筆資料（依日期排序後 [20:]）。
    用途：Demo 前快速回溯，模擬增量更新流程。
    """
    raw_path    = Path("backend/raw_reviews.json")
    cached_path = Path("public/data/cached_reviews.json")

    for path in (raw_path, cached_path):
        if not path.exists():
            continue
        with open(path, encoding="utf-8") as f:
            data: list = json.load(f)
        if not data:
            continue
        # 最新 → 最舊排序，捨棄前 20 筆，再還原升序
        data.sort(key=lambda r: r.get("date", ""), reverse=True)
        data = data[20:]
        data.sort(key=lambda r: r.get("date", ""))
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return {"status": "success", "message": "已成功移除最新 20 筆資料"}


@app.get("/health")
def health():
    return {"status": "ok"}
