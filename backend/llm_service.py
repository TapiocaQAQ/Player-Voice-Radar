"""
LLM 資料處理管線 — PlayerPulse-AI Step 2（含增量更新 + 自動重試）

讀取 backend/raw_reviews.json，與 public/data/cached_reviews.json 比對，
只將新評論送交 Groq qwen3-32b 分析，並合併回快取檔案。
"""

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Set

from dotenv import load_dotenv

try:
    from groq import Groq
except ImportError:
    print("[ERROR] 找不到 groq，請先執行: pip install -r requirements.txt")
    sys.exit(1)

# ── 路徑設定 ─────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
ROOT_DIR    = BASE_DIR.parent
INPUT_PATH  = BASE_DIR / "raw_reviews.json"
OUTPUT_PATH = ROOT_DIR / "public" / "data" / "cached_reviews.json"
ENV_PATH      = BASE_DIR / ".env"
BAD_DATA_PATH = BASE_DIR / "bad_data.json"

# ── 模型設定 ─────────────────────────────────────────────────
MODEL        = "qwen/qwen3-32b"
BATCH_SIZE   = 3    # 每批 3 筆：降低 token 用量，減少截斷機率
MAX_RETRIES  = 3    # 每批最多重試次數；失敗後自動降為逐筆模式
RETRY_DELAY  = 5    # 秒，非 rate-limit 錯誤的等待時間

# ── System Prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """你是一位資深遊戲營運分析師，專職分析手機遊戲《明星三缺一》的 Google Play 玩家評論。

你的任務是：接收一批玩家評論（JSON Array），為每一筆評論新增 `ai_analysis` 欄位，然後輸出完整的 JSON Array。

【輸出格式規定】
- 直接輸出合法的 JSON Array，不得有任何前置文字、說明、markdown 標籤（如 ```json）。
- 每個物件必須保留原始欄位：review_id、player_name、date、star_rating、review_text。
- 每個物件新增 `ai_analysis` 欄位，結構如下：

{
  "sentiment": "negative" | "positive" | "neutral",
  "category": "系統/連線品質" | "配桌/發牌機制" | "儲值/金流異常" | "帳號/客服/停權" | "廣告/介面體驗" | "其他",
  "risk_level": "high" | "medium" | "low",
  "keyword": "2~5字的核心痛點標籤，例如：一直斷線、發爛牌、無法儲值、滿版廣告",
  "root_cause_summary": "一句話總結玩家痛點與情境，不超過20字"
}

【分類判斷準則】
1. 提及閃退、卡頓、黑畫面、伺服器斷線、網路異常 → category: "系統/連線品質"
2. 提及咬錢、一直輸、電腦作弊、勝率太低、對手太強、發爛牌、天胡出現率 → category: "配桌/發牌機制"
3. 涉及真實金錢交易、點數/金幣未入帳、儲值失敗、扣款異常 → category: "儲值/金流異常"，risk_level 通常為 "high"
4. 提及帳號被封、客服無回應、申訴問題、帳號異常 → category: "帳號/客服/停權"
5. 提及廣告干擾、UI 難用、介面跑版、彈窗過多 → category: "廣告/介面體驗"
6. 其他無法歸類 → category: "其他"

【risk_level 判斷準則】
- high：涉及金錢損失、帳號封鎖、嚴重系統錯誤（資料遺失等）
- medium：影響遊戲體驗但無直接損失（卡頓、廣告、配對不公平等）
- low：輕微不滿或純正面評論

【keyword 規定】
- 必須是 2~5 個中文字的具體問題標籤
- 正面評論也要寫出核心關鍵詞，例如：好玩、介面流暢
- 禁止使用「其他問題」、「無具體問題」等模糊詞彙

只輸出 JSON Array，不輸出任何其他內容。"""


def load_env() -> str:
    """載入 .env 並回傳 API Key。"""
    load_dotenv(ENV_PATH)
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        print(f"[ERROR] 找不到 GROQ_API_KEY，請確認 {ENV_PATH} 存在且格式正確。")
        sys.exit(1)
    return key


def clean_llm_output(raw: str) -> str:
    """移除 LLM 可能輸出的 markdown 包裝，取出純 JSON 字串。"""
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())
    # 移除 <think>...</think> 思考鏈（qwen3 thinking mode 會輸出）
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", cleaned, flags=re.IGNORECASE).strip()
    return cleaned.strip()


def load_cache() -> tuple:
    """
    讀取現有快取，回傳 (existing_list, processed_ids_set)。
    若檔案不存在或為空，回傳 ([], set())。
    """
    if not OUTPUT_PATH.exists():
        print(f"[INFO] 快取檔案不存在，將從零開始建立：{OUTPUT_PATH}")
        return [], set()

    try:
        with open(OUTPUT_PATH, encoding="utf-8") as f:
            existing = json.load(f)
        if not isinstance(existing, list) or len(existing) == 0:
            print("[INFO] 快取檔案為空，將從零開始建立。")
            return [], set()
        processed_ids: Set[str] = {item["review_id"] for item in existing if "review_id" in item}
        print(f"[INFO] 讀入快取：{len(existing)} 筆，已處理 ID 數：{len(processed_ids)}")
        return existing, processed_ids
    except (json.JSONDecodeError, KeyError) as e:
        print(f"[WARN] 快取檔案損毀，重新建立：{e}")
        return [], set()


def process_batch(client: Groq, batch: List[Dict]) -> List[Dict]:
    """
    送出單一批次至 Groq，含自動重試邏輯：
    - Rate Limit 429：解析回應中的等待秒數，自動 sleep 後重試
    - JSON 解析失敗：最多重試 MAX_RETRIES 次
    """
    # 每筆 500 token 輸出空間，batch_size=5 → max_out=2500，遠低於 TPM 上限
    max_out = max(1024, len(batch) * 500)
    user_content = json.dumps(batch, ensure_ascii=False)

    for attempt in range(1, MAX_RETRIES + 2):  # +2 = 原始嘗試 + 重試次數
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_content},
                ],
                temperature=0.1,
                max_tokens=max_out,
            )
            raw_output = response.choices[0].message.content
            cleaned    = clean_llm_output(raw_output)
            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            if attempt <= MAX_RETRIES:
                print(f"\n  [RETRY] JSON 解析失敗（{e}），第 {attempt} 次重試...", end=" ", flush=True)
                time.sleep(2)
            else:
                raise

        except Exception as e:
            err_str = str(e)
            # 偵測 Rate Limit 429，解析建議等待秒數
            if "rate_limit_exceeded" in err_str or "429" in err_str:
                wait_match = re.search(r"try again in (\d+\.?\d*)s", err_str)
                wait = float(wait_match.group(1)) + 2.0 if wait_match else RETRY_DELAY
                print(f"\n  [RATE LIMIT] 超過頻率限制，等待 {wait:.1f}s 後重試（第 {attempt} 次）...", end=" ", flush=True)
                time.sleep(wait)
                if attempt > MAX_RETRIES:
                    raise
            else:
                raise  # 其他錯誤直接往上拋


def save_bad_data(review: Dict) -> None:
    """將無法處理的原始評論寫入 backend/bad_data.json（去重）。"""
    existing: List[Dict] = []
    if BAD_DATA_PATH.exists():
        try:
            with open(BAD_DATA_PATH, encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    known_ids = {r.get("review_id") for r in existing}
    rid = review.get("review_id", "")
    if rid not in known_ids:
        existing.append(review)
        with open(BAD_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
        print(f"  [BAD_DATA] 已記錄 review_id={rid[:16]}... → backend/bad_data.json（共 {len(existing)} 筆）")
    else:
        print(f"  [BAD_DATA] review_id={rid[:16]}... 已在 bad_data.json，略過重複記錄")


def run_pipeline(new_reviews: List[Dict]) -> List[Dict]:
    """主管線：分批處理新評論，回傳分析結果列表。"""
    api_key = load_env()
    client  = Groq(api_key=api_key)

    total   = len(new_reviews)
    batches = [new_reviews[i:i + BATCH_SIZE] for i in range(0, total, BATCH_SIZE)]
    results = []
    failed  = 0

    print(f"[INFO] 共 {total} 筆新評論，分為 {len(batches)} 個批次（每批 {BATCH_SIZE} 筆）")

    for idx, batch in enumerate(batches, 1):
        print(f"[INFO] 處理批次 {idx}/{len(batches)}（{len(batch)} 筆）...", end=" ", flush=True)
        try:
            parsed = process_batch(client, batch)
            results.extend(parsed)
            print(f"完成，累計 {len(results)} 筆")
        except Exception as batch_err:
            # 批次 3 次重試全失敗 → 逐筆單送（fallback）
            print(f"\n  [FALLBACK] 批次 {idx} 重試 {MAX_RETRIES} 次仍失敗，改為逐筆送出...")
            for review in batch:
                rid_short = review.get("review_id", "")[:12]
                print(f"  [SINGLE] {rid_short}...", end=" ", flush=True)
                try:
                    single = process_batch(client, [review])
                    results.extend(single)
                    print(f"完成，累計 {len(results)} 筆")
                except Exception:
                    failed += 1
                    print(f"失敗，記錄至 bad_data.json")
                    save_bad_data(review)

    print(f"[INFO] 管線完成：成功 {len(results)} 筆，失敗批次 {failed} 個")
    return results


def save_output(data: List[Dict]) -> None:
    """排序後儲存至 public/data/cached_reviews.json（date 降冪）。"""
    data.sort(key=lambda x: x.get("date", ""), reverse=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 已儲存 {len(data)} 筆至 {OUTPUT_PATH}")


# ── 主程式（增量更新）────────────────────────────────────────
def main(limit: int = None):
    if not INPUT_PATH.exists():
        print(f"[ERROR] 找不到 {INPUT_PATH}，請先執行 scraper.py")
        sys.exit(1)

    # Step 1：載入快取
    existing, processed_ids = load_cache()

    # Step 2：讀取原始資料
    with open(INPUT_PATH, encoding="utf-8") as f:
        all_reviews = json.load(f)
    print(f"[INFO] 讀入原始評論：{len(all_reviews)} 筆")

    # Step 3：若有 --limit，先切出目標範圍（再比對快取）
    if limit is not None and limit > 0:
        target = all_reviews[:limit]
        print(f"[INFO] --limit 模式：目標範圍為前 {limit} 筆")
    else:
        target = all_reviews

    # Step 4：區分「已處理（跳過）」與「新評論（待分析）」
    already_done = [r for r in target if r.get("review_id") in processed_ids]
    new_reviews  = [r for r in target if r.get("review_id") not in processed_ids]

    print(f"[OK]  已在快取中（跳過）：{len(already_done)} 筆")
    print(f"[NEW] 待分析新評論：{len(new_reviews)} 筆")

    if not new_reviews:
        print("[DONE] 目前沒有新的評論需要分析，系統已是最新狀態！")
        return

    print(f"[INFO] 發現 {len(new_reviews)} 筆新評論，開始進行 LLM 分析...")

    # Step 5：批次處理
    analyzed = run_pipeline(new_reviews)

    # Step 6：合併、排序、寫出
    merged = existing + analyzed
    save_output(merged)
    print(f"[DONE] 增量更新完成，快取總筆數：{len(merged)}")


# ── 測試程式碼（只送前 5 筆驗證）────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--test",  action="store_true", help="只處理前 5 筆，用於驗證輸出格式")
    parser.add_argument("--limit", type=int, default=None, help="限制目標範圍為前 N 筆（含快取比對）")
    args = parser.parse_args()

    if args.test:
        print("=== [TEST MODE] 只處理前 5 筆評論（增量邏輯驗證）===")

        if not INPUT_PATH.exists():
            print(f"[ERROR] 找不到 {INPUT_PATH}")
            sys.exit(1)

        existing, processed_ids = load_cache()

        with open(INPUT_PATH, encoding="utf-8") as f:
            all_reviews = json.load(f)

        sample = all_reviews[:5]
        print(f"[INFO] 強制送出前 5 筆至 Groq ({MODEL})（忽略快取比對）...\n")

        api_key = load_env()
        client  = Groq(api_key=api_key)

        try:
            result = process_batch(client, sample)
            print("=== 轉換結果 ===")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            print(f"\n[INFO] 快取現有 {len(existing)} 筆，本次新增 {len(result)} 筆（測試模式，不寫入快取）")
        except Exception as e:
            print(f"[ERROR] 測試失敗：{e}")
    else:
        main(limit=args.limit)
