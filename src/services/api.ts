// ── PlayerPulse-AI — API Service Layer ───────────────────────

const API_BASE = "http://localhost:8000"

export interface AIAnalysis {
  sentiment: "negative" | "positive" | "neutral"
  category: string
  risk_level: "high" | "medium" | "low"
  is_vip_player: boolean
  keyword: string
  root_cause_summary: string
}

export interface ReviewData {
  review_id: string
  player_name: string
  date: string
  star_rating: number
  review_text: string
  thumbsUpCount: number
  ai_analysis: AIAnalysis
}

export interface SyncProgress {
  phase: "scraper" | "llm" | "done" | "error"
  current: number
  total: number
  msg: string
}

/**
 * 觸發後端完整同步管線（scraper → LLM）。
 * 使用 ReadableStream 讀取 Server-Sent Events，每個批次完成時呼叫 onProgress。
 */
export async function triggerSync(
  onProgress?: (p: SyncProgress) => void
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/sync`, { method: "POST" })
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? "同步失敗")
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE events are delimited by double newlines
    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""  // keep the last incomplete chunk

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue
        try {
          const data: SyncProgress = JSON.parse(line.slice(6))
          if (data.phase === "error") throw new Error(data.msg)
          if (data.phase === "done")  return { status: "success", message: "同步與分析完成" }
          onProgress?.(data)
        } catch (e) {
          if (e instanceof SyntaxError) continue  // 不完整的 JSON 片段，略過
          throw e
        }
      }
    }
  }

  return { status: "success", message: "同步與分析完成" }
}

/** 讀取最新快取評論（來自 public/data/cached_reviews.json）。 */
export async function fetchReviews(): Promise<ReviewData[]> {
  const res = await fetch(`/data/cached_reviews.json?t=${Date.now()}`)
  if (!res.ok) throw new Error("無法讀取評論資料")
  return res.json()
}

/** [Debug] 移除兩個 JSON 檔案中最新的 20 筆資料，用於 Demo 回溯。 */
export async function rollbackData(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/debug/rollback`, { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? "rollback 失敗")
  }
  return res.json()
}
