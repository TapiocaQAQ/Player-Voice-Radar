import { useState } from "react"
import { Star, Sparkles, ThumbsUp } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type ReviewData } from "@/services/api"

interface DetailSheetProps {
  selectedCategory: string | null
  onClose: () => void
  reviews: ReviewData[]
}

// High-saturation amber for filled stars — WCAG AA contrast
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

export function DetailSheet({ selectedCategory, onClose, reviews }: DetailSheetProps) {
  const isOpen = selectedCategory !== null
  const [sortBy, setSortBy] = useState<'date' | 'thumbs'>('date')

  // Filter to selected category + high risk only
  const highRiskReviews = reviews
    .filter(
      (r) =>
        r.ai_analysis.category === selectedCategory &&
        r.ai_analysis.risk_level === 'high'
    )
    .sort((a, b) => {
      if (sortBy === 'thumbs') {
        return (b.thumbsUpCount ?? 0) - (a.thumbsUpCount ?? 0)
      }
      return b.date.localeCompare(a.date)
    })

  // First review's root_cause_summary for AI diagnosis
  const rootCause = highRiskReviews[0]?.ai_analysis.root_cause_summary ?? null

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
        style={{
          background: '#0a0a0a',
          border: 'none',
          boxShadow:
            '-1px 0 0 0 rgba(255,255,255,0.08), rgba(0,0,0,0.8) -12px 0 32px -4px',
        }}
      >
        {/* ── Panel Header ─────────────────────────────────────── */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SheetHeader>
            {/* Risk pill + category label */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
                style={{ background: 'rgba(255,91,79,0.15)', color: '#ff7a73', letterSpacing: '0.04em' }}
              >
                Critical
              </span>
              <span
                className="font-mono text-[11px] text-[#444444] uppercase"
                style={{ letterSpacing: '0.04em' }}
              >
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

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* AI Root Cause */}
          {rootCause && (
            <div
              className="rounded-lg p-4"
              style={{
                background: 'rgba(0,122,255,0.06)',
                boxShadow: 'rgba(0,122,255,0.18) 0px 0px 0px 1px',
              }}
            >
              <p
                className="font-mono text-[11px] font-medium uppercase mb-3"
                style={{ letterSpacing: '0.06em', color: '#5aabff' }}
              >
                AI 根因診斷 · qwen3-32b (groq)
              </p>
              <p className="text-[13px] text-[#888888] leading-relaxed">
                {rootCause}
              </p>
            </div>
          )}

          {/* Sort Toggle + Review List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                className="font-mono text-[11px] font-medium text-[#444444] uppercase"
                style={{ letterSpacing: '0.06em' }}
              >
                高風險客訴清單 ({highRiskReviews.length})
              </p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'thumbs')}>
                <SelectTrigger
                  className="w-[140px] h-7 text-[11px] font-mono border-0"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#888888',
                  }}
                >
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <SelectItem value="date" className="text-[12px] font-mono text-[#aaa]">
                    最新日期
                  </SelectItem>
                  <SelectItem value="thumbs" className="text-[12px] font-mono text-[#aaa]">
                    最多按讚
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {highRiskReviews.length === 0 ? (
              <p className="text-[13px] text-[#555555] font-mono">
                該分類下無高風險評論。
              </p>
            ) : (
              <div className="space-y-3">
                {highRiskReviews.map((review, index) => (
                  <div
                    key={review.review_id}
                    className="rounded-lg p-4"
                    style={{
                      background: '#141418',
                      boxShadow: 'rgba(255,255,255,0.1) 0px 0px 0px 1px',
                    }}
                  >
                    {/* Meta row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[rgba(255,255,255,0.15)]">
                          [{String(index + 1).padStart(2, '0')}]
                        </span>
                        <span className="text-[13px] font-medium text-[#ededed]">
                          {review.player_name}
                        </span>
                        {/* VIP Badge */}
                        {review.ai_analysis.is_vip_player && (
                          <Badge
                            className="text-[10px] font-semibold px-1.5 py-0 rounded-full border-0"
                            style={{
                              background: 'rgba(251,191,36,0.18)',
                              color: '#FBBF24',
                            }}
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

                    {/* Bottom row: risk pill + thumbs up */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
                        style={{ background: 'rgba(255,91,79,0.15)', color: '#ff7a73', letterSpacing: '0.04em' }}
                      >
                        CHURN-RISK: HIGH
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[#666666]">
                        <ThumbsUp className="h-3 w-3" />
                        {review.thumbsUpCount ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Action ─────────────────────────────────────── */}
        <div
          className="px-6 pt-4 pb-8"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: '#000000',
          }}
        >
          <Button
            className="w-full h-9 gap-2 text-sm font-medium rounded-md transition-colors duration-100"
            style={{
              background: '#ededed',
              color: '#000000',
              border: 'none',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ededed' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            撰寫公關回覆草稿
          </Button>
          <p className="text-center font-mono text-[11px] text-[#444444] mt-2">
            generated-by: qwen3-32b (groq) · 僅供參考
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
