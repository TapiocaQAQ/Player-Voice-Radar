"""
Google Play 評論爬蟲 — PlayerPulse-AI 資料獲取管線 Step 1

目標 App: 明星三缺一 (com.igs.mjstar31)
語言/地區: 繁體中文 zh_TW / 台灣
時間過濾: 近 60 天（以執行當下日期為基準）
輸出檔案: backend/raw_reviews.json
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List

try:
    from google_play_scraper import reviews, Sort
except ImportError:
    print("[ERROR] 找不到 google-play-scraper，請先執行: pip install -r requirements.txt")
    sys.exit(1)

# ── 設定常數 ────────────────────────────────────────────────
APP_IDS = ["com.igs.mjstar31", "com.igs.gametower"]  # 主要 ID，備援 ID
LANG = "zh_TW"
COUNTRY = "tw"
FETCH_COUNT = 3000          # 每次抓取的最大筆數
LOOKBACK_DAYS =  150         # 只保留近 N 天的評論
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "raw_reviews.json")


def fetch_reviews(app_id: str) -> List[Dict]:
    """從 Google Play 抓取評論（所有星等混合抓取）。"""
    print(f"[INFO] 開始抓取 App ID: {app_id}，語言={LANG}，地區={COUNTRY}，數量上限={FETCH_COUNT}")

    result, _ = reviews(
        app_id,
        lang=LANG,
        country=COUNTRY,
        sort=Sort.NEWEST,      # 依最新排序，有助於時間過濾更有效率
        count=FETCH_COUNT,
    )

    print(f"[INFO] 原始抓取筆數: {len(result)}")
    return result


def filter_by_date(raw: List[Dict], cutoff: datetime) -> List[Dict]:
    """保留 at（評論時間）>= cutoff 的資料。"""
    filtered = []
    for item in raw:
        at = item.get("at")
        if at is None:
            continue
        # google-play-scraper 回傳的 at 是 datetime（naive 或 aware）
        if isinstance(at, datetime):
            # 統一轉為 aware UTC 進行比較
            if at.tzinfo is None:
                at = at.replace(tzinfo=timezone.utc)
            cutoff_aware = cutoff.replace(tzinfo=timezone.utc) if cutoff.tzinfo is None else cutoff
            if at >= cutoff_aware:
                filtered.append(item)
        else:
            # 若為其他格式（字串），嘗試解析
            try:
                parsed = datetime.fromisoformat(str(at))
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                cutoff_aware = cutoff.replace(tzinfo=timezone.utc) if cutoff.tzinfo is None else cutoff
                if parsed >= cutoff_aware:
                    filtered.append(item)
            except ValueError:
                pass  # 無法解析的直接跳過

    return filtered


def normalize(item: Dict) -> Dict:
    """將原始評論資料正規化為規格定義的欄位格式。"""
    at = item.get("at")
    if isinstance(at, datetime):
        date_str = at.strftime("%Y-%m-%d")
    else:
        date_str = str(at)[:10] if at else ""

    return {
        "review_id":   str(item.get("reviewId", "")),
        "player_name": str(item.get("userName", "")),
        "date":        date_str,
        "star_rating": int(item.get("score", 0)),
        "review_text": str(item.get("content", "")),
    }


def main():
    now = datetime.now(tz=timezone.utc)
    cutoff = now - timedelta(days=LOOKBACK_DAYS)
    print(f"[INFO] 執行時間: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"[INFO] 時間過濾截止點（近 {LOOKBACK_DAYS} 天）: {cutoff.strftime('%Y-%m-%d')}")

    raw = []
    used_app_id = None

    for app_id in APP_IDS:
        try:
            raw = fetch_reviews(app_id)
            used_app_id = app_id
            break
        except Exception as e:
            print(f"[WARN] App ID '{app_id}' 抓取失敗: {e}，嘗試備援 ID…")

    if not raw:
        print("[ERROR] 所有 App ID 均抓取失敗，請確認網路連線或 App ID 是否正確。")
        sys.exit(1)

    print(f"[INFO] 使用 App ID: {used_app_id}")

    # 時間過濾
    filtered = filter_by_date(raw, cutoff)
    print(f"[INFO] 時間過濾後筆數（近 {LOOKBACK_DAYS} 天）: {len(filtered)}")

    # 正規化
    normalized = [normalize(item) for item in filtered]

    # 輸出 JSON
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f"[INFO] 已儲存至: {OUTPUT_PATH}")
    print("[DONE] 爬蟲執行完畢。")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] 使用者中斷執行。")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] 未預期的錯誤: {e}")
        sys.exit(1)
