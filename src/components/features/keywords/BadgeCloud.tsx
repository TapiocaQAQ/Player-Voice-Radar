// Vercel Dark badge cloud — dual-dimension encoding: size (frequency) + color (sentiment)
// High-contrast palette designed for dark backgrounds — no dark tones that vanish on black.

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

type Sentiment = 'positive' | 'negative' | 'neutral'

// Map (sentiment × frequency tier) → text color
// Tiers: 0=lowest … 4=highest (relative rank within 0–1 normalised value)
// Palette sourced from OpenCode DESIGN.md (Apple HIG semantics) × Vercel DESIGN.md
function getTextColor(sentiment: Sentiment, normValue: number): string {
  if (sentiment === 'negative') {
    // Peak: OpenCode Danger Red #ff3b30 (Apple HIG)
    // Softer tier: Vercel Ship Red #ff5b4f
    // Lower tiers: derived warm-red ramp, same hue family
    if (normValue >= 0.8) return '#ff3b30'  // OpenCode Danger Red
    if (normValue >= 0.6) return '#ff5b4f'  // Vercel Ship Red
    if (normValue >= 0.4) return '#ff8577'  // derived mid warm-red
    if (normValue >= 0.2) return '#ffb3ae'  // derived light warm-red
    return '#ffd5d3'                         // derived very light red tint
  }
  if (sentiment === 'positive') {
    // Peak: OpenCode Success Green #30d158 (Apple HIG)
    // Lower tiers: derived mint-green ramp, same hue family
    if (normValue >= 0.8) return '#30d158'  // OpenCode Success Green
    if (normValue >= 0.6) return '#34c759'  // Apple system green (iOS variant)
    if (normValue >= 0.4) return '#5ed97c'  // derived mid green
    if (normValue >= 0.2) return '#91e8a8'  // derived light green
    return '#c0f0cc'                         // derived very light mint
  }
  // neutral: OpenCode text scale (#6e6e73 muted → #9a9898 mid) × Vercel grays (#ebebeb → #fdfcfc)
  if (normValue >= 0.8) return '#fdfcfc'   // OpenCode Light (warm near-white)
  if (normValue >= 0.6) return '#ebebeb'   // Vercel Gray 100
  if (normValue >= 0.4) return '#9a9898'   // OpenCode Mid Gray
  if (normValue >= 0.2) return '#6e6e73'   // OpenCode Text Muted
  return '#4d4d4d'                          // Vercel Gray 600
}

// Map normalised value → font size class
function getFontSize(normValue: number): string {
  if (normValue >= 0.8) return '22px'
  if (normValue >= 0.6) return '17px'
  if (normValue >= 0.4) return '14px'
  if (normValue >= 0.2) return '12px'
  return '10px'
}

function getFontWeight(normValue: number): number {
  if (normValue >= 0.8) return 800
  if (normValue >= 0.6) return 700
  if (normValue >= 0.4) return 500
  return 400
}

function getOpacity(normValue: number): number {
  return Math.max(0.75, 0.75 + normValue * 0.25)
}

export interface KeywordItem {
  text: string
  value: number
  sentiment: Sentiment
}

interface BadgeCloudProps {
  keywords: KeywordItem[]
}

export function BadgeCloud({ keywords }: BadgeCloudProps) {
  const sorted = [...keywords].sort((a, b) => b.value - a.value)
  const maxValue = sorted[0]?.value ?? 1

  return (
    <div
      className="rounded-lg p-6 h-full flex flex-col"
      style={{ background: '#0a0a0a', boxShadow: CARD_SHADOW }}
    >
      {/* Header */}
      <p
        className="font-mono text-[11px] font-medium text-[#444444] uppercase"
        style={{ letterSpacing: '0.06em' }}
      >
        關鍵詞熱度
      </p>
      <p
        className="mt-1 text-[#ededed] font-semibold mb-1"
        style={{ fontSize: '1.375rem', letterSpacing: '-0.04em' }}
      >
        Keyword Cloud
      </p>
      <p className="text-[13px] text-[#555555] mb-6">
        字體大小代表發生頻率；顏色代表情緒傾向
      </p>

      {/* Badge grid */}
      <div className="flex flex-wrap gap-2.5 flex-1 content-start items-end">
        {sorted.map((kw) => {
          const norm = kw.value / maxValue
          const textColor = getTextColor(kw.sentiment, norm)
          const fontSize = getFontSize(norm)
          const fontWeight = getFontWeight(norm)
          const opacity = getOpacity(norm)

          const pillBg = kw.sentiment === 'negative'
            ? 'rgba(255,91,79,0.06)'
            : kw.sentiment === 'positive'
              ? 'rgba(52,199,89,0.05)'
              : 'rgba(255,255,255,0.03)'

          return (
            <span
              key={kw.text}
              className="inline-flex items-center gap-1 rounded-full cursor-default transition-all duration-150 hover:scale-105 hover:opacity-100"
              style={{
                color: textColor,
                fontSize,
                fontWeight,
                opacity,
                background: pillBg,
                border: '1px solid rgba(255,255,255,0.05)',
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
              }}
            >
              {kw.text}
              <span style={{ opacity: 0.45, fontSize: '9px' }}>{kw.value}</span>
            </span>
          )
        })}
      </div>

      {/* Legend */}
      <div
        className="mt-5 pt-4 space-y-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="font-mono text-[10px] text-[#444444] uppercase tracking-[0.04em]">
          編碼圖例
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {/* Size legend */}
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#555555]">
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>A</span>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>A</span>
            <span style={{ fontSize: '18px', color: '#9ca3af' }}>A</span>
            <span className="ml-0.5">字體大小 = 出現頻率</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {/* Negative legend */}
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span style={{ color: '#ffd5d3' }}>●</span>
            <span style={{ color: '#ff3b30' }}>●</span>
            <span className="text-[#555555]">淡紅→危險紅 = 負面</span>
          </span>
          {/* Positive legend */}
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span style={{ color: '#c0f0cc' }}>●</span>
            <span style={{ color: '#30d158' }}>●</span>
            <span className="text-[#555555]">淡綠→成功綠 = 正面</span>
          </span>
          {/* Neutral legend */}
          <span className="flex items-center gap-1.5 font-mono text-[10px]">
            <span style={{ color: '#4d4d4d' }}>●</span>
            <span style={{ color: '#fdfcfc' }}>●</span>
            <span className="text-[#555555]">深灰→近白 = 中性</span>
          </span>
        </div>
      </div>
    </div>
  )
}
