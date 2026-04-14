import { Star, Sparkles } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface DetailSheetProps {
  open: boolean
  onClose: () => void
}

const highRiskReviews = [
  {
    id: "r001",
    playerName: "小花花",
    date: "2026-04-11",
    stars: 2,
    text: "課了三萬塊，連一個SSR都沒抽到！這機率是假的！已向消保委投訴！",
  },
  {
    id: "r002",
    playerName: "憤怒的玩家001",
    date: "2026-04-10",
    stars: 1,
    text: "公告說3%但我連抽了200發都沒出，這不是詐欺是什麼？立刻退款！",
  },
  {
    id: "r003",
    playerName: "GameReviewer_TW",
    date: "2026-04-11",
    stars: 1,
    text: "機率存在嚴重問題，內部數據顯示實際出貨率可能僅0.8%，建議玩家集體向主管機關申訴。",
  },
]

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

export function DetailSheet({ open, onClose }: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
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
              抽卡/中獎機率
            </SheetTitle>
            <SheetDescription>
              <span className="font-mono text-[12px] text-[#555555]">
                45 reviews · 17 high-risk · 2026-04-11 00:00–08:42
              </span>
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* AI Root Cause — bullet-point format for scannability */}
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
              AI 根因診斷 · gemini-2.0-flash
            </p>

            {/* Summary line */}
            <p className="text-[13px] text-[#888888] mb-2.5">
              本週{' '}
              <span className="font-semibold text-[#ff7a73]">45 筆</span>
              {' '}負評聚焦於抽卡機率問題。
            </p>

            {/* Bullet points */}
            <p className="text-[12px] font-medium text-[#ededed] mb-1.5">
              🔥 主要痛點
            </p>
            <ul className="space-y-1.5 mb-3" style={{ paddingLeft: '0.5rem' }}>
              {[
                '十連抽 SSR 實際出率明顯低於公告 3%',
                '寶石消耗回報不成比例，CP 值極低',
                '缺乏保底機制 (Pity System)，無上限保障',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#888888]" style={{ lineHeight: '1.6' }}>
                  <span style={{ color: '#ff7a73', flexShrink: 0, marginTop: '1px' }}>·</span>
                  {point}
                </li>
              ))}
            </ul>

            <p className="text-[12px] text-[#5aabff]">
              💡 建議：公開機率審計報告，下版導入 Pity 系統。
            </p>
          </div>

          {/* High Risk Reviews */}
          <div>
            <p
              className="font-mono text-[11px] font-medium text-[#444444] uppercase mb-3"
              style={{ letterSpacing: '0.06em' }}
            >
              高風險客訴清單 ({highRiskReviews.length})
            </p>

            <div className="space-y-3">
              {highRiskReviews.map((review, index) => (
                <div
                  key={review.id}
                  className="rounded-lg p-4"
                  style={{
                    // Slightly lighter surface + clear border for contrast
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
                        {review.playerName}
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {review.date}
                      </span>
                    </div>
                    <StarRating count={review.stars} />
                  </div>

                  {/* Review text */}
                  <p className="text-[13px] text-[#888888] leading-relaxed">
                    {review.text}
                  </p>

                  {/* Risk pill */}
                  <div className="mt-2.5">
                    <span
                      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
                      style={{ background: 'rgba(255,91,79,0.15)', color: '#ff7a73', letterSpacing: '0.04em' }}
                    >
                      CHURN-RISK: HIGH
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
            generated-by: gemini-2.0-flash · 僅供參考
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
