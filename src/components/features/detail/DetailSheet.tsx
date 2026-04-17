import { useState, useCallback } from "react"
import { Star, Sparkles, ThumbsUp, CheckCircle2, XCircle, Copy, Check } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type ReviewData, type ReviewStatus, updateReviewStatus } from "@/services/api"

interface DetailSheetProps {
  selectedCategory: string | null
  onClose: () => void
  reviews: ReviewData[]
  onStatusChange?: (id: string, status: ReviewStatus) => void
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3 w-3"
          style={{
            fill:  i < count ? '#FBBF24' : 'transparent',
            color: i < count ? '#FBBF24' : 'rgba(255,255,255,0.22)',
          }}
        />
      ))}
    </div>
  )
}

// ── AI PR reply generator ────────────────────────────────────────
function generatePrReply(review: ReviewData): string {
  const { sentiment, category, root_cause_summary } = review.ai_analysis
  const name = review.player_name

  const opening =
    sentiment === 'negative'
      ? `親愛的 ${name} 您好，非常感謝您抽空留下這則寶貴的回饋。`
      : `親愛的 ${name} 您好，感謝您的熱情支持與寶貴意見！`

  const categoryMap: Record<string, string> = {
    '工程研發': '技術穩定性與遊戲體驗',
    '客服金流': '客服支援與金流處理',
    '營運企劃': '遊戲營運與活動企劃',
    'UI/UX體驗': '介面設計與使用者體驗',
    '其他': '整體遊戲體驗',
  }
  if (!(category in categoryMap)) {
    console.warn(`[generatePrReply] Unknown category "${category}" — falling back to default focus area.`)
  }
  const focusArea = categoryMap[category] ?? '遊戲整體品質'

  const body = root_cause_summary
    ? `您所反映的「${root_cause_summary}」問題，我們已記錄並轉交 ${focusArea} 團隊優先排查。`
    : `您的反饋已轉交 ${focusArea} 團隊進行詳細調查。`

  const vipNote = review.ai_analysis.is_vip_player
    ? '\n\n作為我們尊貴的 VIP 玩家，我們將為您優先安排客服專員跟進此案，並盡快提供個人化解決方案。'
    : ''

  const closing =
    '我們承諾持續改善遊戲品質，期待在不久的將來帶給您更好的體驗。若有任何進一步的問題，歡迎透過官方客服管道與我們聯繫。\n\n感謝您對《競技麻將2》的支持！'

  return `${opening}\n\n${body}${vipNote}\n\n${closing}`
}

// ── Risk Badge ──────────────────────────────────────────────────
const RISK_STYLES: Record<string, { bg: string; color: string; label: string; severity: string }> = {
  high:   { bg: 'rgba(255,91,79,0.15)',   color: '#ff7a73', label: 'CHURN-RISK: HIGH', severity: 'Critical' },
  medium: { bg: 'rgba(255,159,10,0.15)',  color: '#ffb733', label: 'CHURN-RISK: MED',  severity: 'Warning'  },
  low:    { bg: 'rgba(52,199,89,0.12)',   color: '#34c759', label: 'CHURN-RISK: LOW',  severity: 'Info'     },
}

function RiskBadge({ riskLevel }: { riskLevel: string }) {
  const style = RISK_STYLES[riskLevel] ?? RISK_STYLES['low']
  return (
    <span
      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
      style={{ background: style.bg, color: style.color, letterSpacing: '0.04em' }}
    >
      {style.label}
    </span>
  )
}

// ── Single Review Card ───────────────────────────────────────────
interface ReviewCardProps {
  review: ReviewData
  index: number
  onStatusChange: (id: string, status: ReviewStatus) => void
}

function ReviewCard({ review, index, onStatusChange }: ReviewCardProps) {
  const [localStatus, setLocalStatus] = useState<ReviewStatus>(review.status ?? 'pending')
  const [isUpdating, setIsUpdating] = useState(false)
  const [prReplyOpen, setPrReplyOpen] = useState(false)
  const [prReply, setPrReply] = useState('')
  const [copied, setCopied] = useState(false)

  const handleStatusUpdate = async (newStatus: ReviewStatus) => {
    if (isUpdating || localStatus === newStatus) return
    const prevStatus = localStatus
    setIsUpdating(true)
    setLocalStatus(newStatus)
    try {
      await updateReviewStatus(review.review_id, newStatus)
      onStatusChange(review.review_id, newStatus)
    } catch (e) {
      console.error('[Status Update Error] API failed, reverting to previous status.', e)
      setLocalStatus(prevStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGeneratePrReply = () => {
    if (!prReplyOpen) {
      setPrReply(generatePrReply(review))
      setPrReplyOpen(true)
    } else {
      setPrReplyOpen(false)
    }
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prReply).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [prReply])

  // Visual state based on status
  const cardStyle: React.CSSProperties = {
    background: localStatus === 'resolved'
      ? 'rgba(34,197,94,0.06)'
      : localStatus === 'dismissed'
        ? 'rgba(255,255,255,0.02)'
        : '#141418',
    boxShadow: localStatus === 'resolved'
      ? 'rgba(34,197,94,0.25) 0px 0px 0px 1px'
      : localStatus === 'dismissed'
        ? 'rgba(255,255,255,0.05) 0px 0px 0px 1px'
        : 'rgba(255,255,255,0.1) 0px 0px 0px 1px',
    opacity: localStatus === 'dismissed' ? 0.45 : 1,
    transition: 'all 0.25s ease',
  }

  return (
    <div className="rounded-lg p-4" style={cardStyle}>
      {/* Meta row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-[rgba(255,255,255,0.15)]">
            [{String(index + 1).padStart(2, '0')}]
          </span>
          <span className="text-[13px] font-medium text-[#ededed]">
            {review.player_name}
          </span>
          {review.ai_analysis.is_vip_player && (
            <Badge
              className="text-[10px] font-semibold px-1.5 py-0 rounded-full border-0"
              style={{ background: 'rgba(251,191,36,0.18)', color: '#FBBF24' }}
            >
              👑 VIP
            </Badge>
          )}
          <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {review.date}
          </span>
        </div>
        <StarRating count={review.star_rating} />
      </div>

      {/* Review text */}
      <p className="text-[13px] text-[#888888] leading-relaxed">
        {review.review_text}
      </p>

      {/* Bottom row: risk pill + thumbs + status indicator */}
      <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <RiskBadge riskLevel={review.ai_analysis.risk_level} />
          {localStatus === 'resolved' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              ✅ 已處理
            </span>
          )}
          {localStatus === 'dismissed' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#666666' }}>
              🚫 已忽略
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 font-mono text-[11px] text-[#666666]">
          <ThumbsUp className="h-3 w-3" />
          {review.thumbsUpCount ?? 0}
        </span>
      </div>

      {/* Action buttons row */}
      {localStatus === 'pending' && (
        <div className="mt-3 flex items-center gap-2">
          <button
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('resolved')}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md transition-all duration-100 disabled:opacity-40"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle2 className="h-3 w-3" />
            處理
          </button>
          <button
            disabled={isUpdating}
            onClick={() => handleStatusUpdate('dismissed')}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md transition-all duration-100 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#888888', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <XCircle className="h-3 w-3" />
            忽略
          </button>
        </div>
      )}

      {/* Undo button for non-pending states */}
      {localStatus !== 'pending' && (
        <div className="mt-3">
          <button
            onClick={() => handleStatusUpdate('pending')}
            className="text-[10px] font-mono text-[#444444] underline underline-offset-2 hover:text-[#666666] transition-colors"
          >
            撤銷
          </button>
        </div>
      )}

      {/* ✨ Generate PR Reply button */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={handleGeneratePrReply}
          className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-md w-full justify-center transition-all duration-100"
          style={{
            background: prReplyOpen ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
            color: prReplyOpen ? '#a78bfa' : '#666666',
            border: `1px solid ${prReplyOpen ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          <Sparkles className="h-3 w-3" />
          {prReplyOpen ? '收起公關回覆' : '✨ 生成公關回覆'}
        </button>

        {prReplyOpen && (
          <div className="mt-2">
            <div className="relative">
              <textarea
                readOnly
                value={prReply}
                rows={8}
                className="w-full rounded-md text-[12px] leading-relaxed resize-none font-sans p-3 pr-10 focus:outline-none"
                style={{
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#cccccc',
                  scrollbarWidth: 'thin',
                }}
              />
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md transition-all"
                style={{
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                  color: copied ? '#22c55e' : '#888888',
                }}
                title="複製"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="font-mono text-[10px] text-[#444444] mt-1.5">
              AI 生成草稿 · 僅供參考，請依實際情況調整後使用
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── DetailSheet ──────────────────────────────────────────────────
export function DetailSheet({ selectedCategory, onClose, reviews, onStatusChange }: DetailSheetProps) {
  const isOpen = selectedCategory !== null
  const [sortBy, setSortBy] = useState<'date' | 'thumbs'>('date')
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ReviewStatus>>({})

  const handleStatusChange = (id: string, status: ReviewStatus) => {
    setStatusOverrides(prev => ({ ...prev, [id]: status }))
    onStatusChange?.(id, status)
  }

  const highRiskReviews = reviews
    .filter(
      (r) =>
        r.ai_analysis.category === selectedCategory &&
        r.ai_analysis.risk_level === 'high'
    )
    .sort((a, b) => {
      if (sortBy === 'thumbs') return (b.thumbsUpCount ?? 0) - (a.thumbsUpCount ?? 0)
      return b.date.localeCompare(a.date)
    })

  const rootCause = highRiskReviews[0]?.ai_analysis.root_cause_summary ?? null
  const panelRisk = highRiskReviews[0]?.ai_analysis.risk_level ?? 'high'
  const panelStyle = RISK_STYLES[panelRisk] ?? RISK_STYLES['high']

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
        style={{
          background: '#0a0a0a',
          border: 'none',
          boxShadow: '-1px 0 0 0 rgba(255,255,255,0.08), rgba(0,0,0,0.8) -12px 0 32px -4px',
        }}
      >
        {/* ── Panel Header ─────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <SheetHeader>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
                style={{ background: panelStyle.bg, color: panelStyle.color, letterSpacing: '0.04em' }}
              >
                {panelStyle.severity}
              </span>
              <span className="font-mono text-[11px] text-[#444444] uppercase" style={{ letterSpacing: '0.04em' }}>
                · category
              </span>
            </div>
            <SheetTitle
              className="text-[#ededed] font-semibold"
              style={{ fontSize: '1.5rem', letterSpacing: '-0.04em' }}
            >
              {selectedCategory ?? '—'}
            </SheetTitle>
            <SheetDescription>
              <span className="font-mono text-[12px] text-[#555555]">
                {highRiskReviews.length} high-risk reviews
              </span>
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* AI Root Cause */}
          {rootCause && (
            <div
              className="rounded-lg p-4"
              style={{ background: 'rgba(0,122,255,0.06)', boxShadow: 'rgba(0,122,255,0.18) 0px 0px 0px 1px' }}
            >
              <p
                className="font-mono text-[11px] font-medium uppercase mb-3"
                style={{ letterSpacing: '0.06em', color: '#5aabff' }}
              >
                AI 根因診斷 · qwen3-32b (groq)
              </p>
              <p className="text-[13px] text-[#888888] leading-relaxed">{rootCause}</p>
            </div>
          )}

          {/* Sort Toggle + Review List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[11px] font-medium text-[#444444] uppercase" style={{ letterSpacing: '0.06em' }}>
                高風險客訴清單 ({highRiskReviews.length})
              </p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'thumbs')}>
                <SelectTrigger
                  className="w-[140px] h-7 text-[11px] font-mono border-0"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#888888' }}
                >
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectItem value="date" className="text-[12px] font-mono text-[#aaa]">最新日期</SelectItem>
                  <SelectItem value="thumbs" className="text-[12px] font-mono text-[#aaa]">最多按讚</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {highRiskReviews.length === 0 ? (
              <p className="text-[13px] text-[#555555] font-mono">該分類下無高風險評論。</p>
            ) : (
              <div className="space-y-3">
                {highRiskReviews.map((review, index) => (
                  <ReviewCard
                    key={review.review_id}
                    review={{ ...review, status: statusOverrides[review.review_id] ?? review.status }}
                    index={index}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
