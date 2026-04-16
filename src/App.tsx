import { useState, useEffect, useRef, useMemo } from "react"
import { Header } from "@/components/layout/Header"
import { MetricCards } from "@/components/features/metrics/MetricCards"
import { InsightChart } from "@/components/features/charts/InsightChart"
import { BadgeCloud } from "@/components/features/keywords/BadgeCloud"
import { DetailSheet } from "@/components/features/detail/DetailSheet"
import { Skeleton } from "@/components/ui/skeleton"
import { JumpingDots } from "@/components/ui/jumping-dots"
import { triggerSync, fetchReviews, rollbackData, type ReviewData, type SyncProgress } from "@/services/api"

// ── Loading messages shown while sync is in progress ─────────
const SYNC_MESSAGES = [
  "正在同步 Google Play 最新玩家評論",
  "AI 模型正在進行情緒分析與痛點萃取",
  "正在生成營運洞察圖表，即將完成",
]

// ── Skeleton overlay displayed during sync / initial load ────
function LoadingSkeleton({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-black text-[#ededed]">
      <div className="max-w-screen-xl mx-auto px-8 py-10 space-y-10">

        {/* Animated status message */}
        <div className="flex items-center gap-3 py-2">
          <span className="w-2 h-2 rounded-full bg-[#ff5b4f] animate-pulse shrink-0" />
          <p className="font-mono text-[13px] text-[#666666] flex items-center">
            {message}<JumpingDots />
          </p>
        </div>

        {/* Metric cards row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </section>

        {/* Chart + badge cloud row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
          <Skeleton className="lg:col-span-1 h-64 rounded-lg" />
        </section>

      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
function App() {
  const [reviews, setReviews]             = useState<ReviewData[] | null>(null)
  const [isSyncing, setIsSyncing]         = useState(false)
  const [syncError, setSyncError]         = useState<string | null>(null)
  const [msgIdx, setMsgIdx]               = useState(0)
  const [progress, setProgress]           = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [starFilter, setStarFilter]       = useState<string>('1-3')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Initial data load on mount ───────────────────────────
  useEffect(() => {
    fetchReviews()
      .then(setReviews)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        setSyncError(msg)
        setReviews([]) // mark as loaded (empty) so skeleton hides
      })
  }, [])

  // ── Rotate loading messages while syncing ────────────────
  useEffect(() => {
    if (isSyncing) {
      setMsgIdx(0)
      intervalRef.current = setInterval(() => {
        setMsgIdx(i => (i + 1) % SYNC_MESSAGES.length)
      }, 2500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isSyncing])

  // ── Debug rollback handler ───────────────────────────────
  const handleRollback = async () => {
    setSyncError(null)
    setIsSyncing(true)
    try {
      await rollbackData()
      const updated = await fetchReviews()
      setReviews(updated)
      console.log(`[Rollback] 完成，剩餘 ${updated.length} 筆評論`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setSyncError(msg)
      console.error("[Rollback Error]", msg)
    } finally {
      setIsSyncing(false)
    }
  }

  // ── Sync handler ─────────────────────────────────────────
  const handleSync = async () => {
    setSyncError(null)
    setIsSyncing(true)
    setProgress({ current: 0, total: 0 })
    try {
      await triggerSync((p: SyncProgress) => {
        if (p.phase === "llm") {
          setProgress({ current: p.current, total: p.total })
          setMsgIdx(1)  // 鎖定至 AI 分析訊息
        }
      })
      const updated = await fetchReviews()
      setReviews(updated)
      console.log(`[Sync] 完成，共 ${updated.length} 筆評論已載入`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setSyncError(msg)
      console.error("[Sync Error]", msg)
    } finally {
      setIsSyncing(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  // ── Data aggregation (useMemo) ────────────────────────────

  const filteredReviews = useMemo<ReviewData[]>(() => {
    if (!reviews) return []
    if (starFilter === '1-2') return reviews.filter(r => r.star_rating <= 2)
    if (starFilter === '1-3') return reviews.filter(r => r.star_rating <= 3)
    return reviews // '1-5' → all
  }, [reviews, starFilter])

  const metricData = useMemo(() => {
    // P0 級災情數：category 為 "工程研發" 或 "客服金流" 且 risk_level === 'high'
    const p0Level = filteredReviews.filter(
      r => (r.ai_analysis.category === '工程研發' || r.ai_analysis.category === '客服金流')
        && r.ai_analysis.risk_level === 'high'
    ).length

    // 炎上指數：所有 thumbsUpCount 的總和
    const backlash = filteredReviews.reduce((sum, r) => sum + (r.thumbsUpCount ?? 0), 0)

    // VIP 流失數：is_vip_player === true 的數量
    const vipChurn = filteredReviews.filter(r => r.ai_analysis.is_vip_player === true).length

    return { p0Level, backlash, vipChurn }
  }, [filteredReviews])

  const chartData = useMemo(() => {
    const catCounts: Record<string, number> = {}
    for (const r of filteredReviews) {
      const cat = r.ai_analysis.category
      catCounts[cat] = (catCounts[cat] ?? 0) + 1
    }
    return Object.entries(catCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredReviews])

  const keywordData = useMemo(() => {
    const kwCounts: Record<string, number> = {}
    for (const r of filteredReviews) {
      const kw = r.ai_analysis.keyword
      if (kw) kwCounts[kw] = (kwCounts[kw] ?? 0) + 1
    }
    return Object.entries(kwCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15)
  }, [filteredReviews])

  // ── Loading overlay (initial fetch or sync in progress) ──
  if (isSyncing || reviews === null) {
    const syncMsg = progress.total > 0
      ? `${SYNC_MESSAGES[1]} (批次 ${progress.current} / ${progress.total})`
      : SYNC_MESSAGES[msgIdx]
    const msg = isSyncing ? syncMsg : "正在載入評論資料"
    return (
      <>
        <div className="sticky top-0 z-40 w-full bg-black"
          style={{ boxShadow: 'rgba(255,255,255,0.08) 0px 0px 0px 1px' }}>
          <div className="max-w-screen-xl mx-auto px-8 h-14 flex items-center">
            <span
              className="text-[24px] text-[#ededed]"
              style={{ fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}
            >
              Player-Voice<span className="text-[#ff5b4f]">-Radar</span>
            </span>
          </div>
        </div>
        <LoadingSkeleton message={msg} />
      </>
    )
  }

  // ── Normal view ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-[#ededed]">
      <Header
        onSync={handleSync}
        starFilter={starFilter}
        onFilterChange={setStarFilter}
        onRollback={handleRollback}
      />

      <main className="max-w-screen-xl mx-auto px-8 py-10 space-y-10">

        {/* Sync error banner */}
        {syncError && (
          <div
            className="rounded-lg px-4 py-3 font-mono text-xs text-[#ff7a73]"
            style={{ background: 'rgba(255,91,79,0.08)', border: '1px solid rgba(255,91,79,0.2)' }}
          >
            [SYNC ERROR] {syncError}
          </div>
        )}

        {/* Empty state */}
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[#ededed] font-semibold text-lg">🎉 目前該篩選條件下無資料</p>
            <p className="font-mono text-[13px] text-[#555555]">
              切換篩選條件或點擊「強制同步」取得最新評論
            </p>
          </div>
        ) : (
          <>
            {/* Section: Metrics */}
            <section>
              <p
                className="font-mono text-[11px] font-medium text-[#444444] uppercase mb-4"
                style={{ letterSpacing: '0.06em' }}
              >
                // metrics overview
              </p>
              <MetricCards metrics={metricData} />
            </section>

            {/* Section: Charts */}
            <section>
              <p
                className="font-mono text-[11px] font-medium text-[#444444] uppercase mb-4"
                style={{ letterSpacing: '0.06em' }}
              >
                // insight analysis
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <InsightChart
                    data={chartData}
                    onCategorySelect={setSelectedCategory}
                  />
                </div>
                <div className="lg:col-span-1">
                  <BadgeCloud keywords={keywordData} />
                </div>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#444444]">
              player-voice-radar v0.1.0 · internal use only
            </span>
            <span className="font-mono text-[11px] text-[#444444]">
              powered-by: qwen3-32b (groq) + google-play-api
              <span className="text-[#555555]"> · {reviews.length} reviews loaded</span>
            </span>
          </div>
        </footer>

      </main>

      <DetailSheet
        selectedCategory={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        reviews={filteredReviews}
      />
    </div>
  )
}

export default App
