// Vercel Dark pill badge cloud — exaggerated frequency encoding
// Top 1-3 pain points: 1.5-2× larger, full saturation red
// Low-frequency keywords: <30% opacity, recede into background

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

// 5-tier encoding: colour + size + weight + opacity + padding
function getPillStyle(value: number): {
  bg: string; text: string; fontSize: string; fontWeight: number
  opacity: number; px: string; py: string
} {
  // Tier 1 — Top painpoints (value ≥ 22): 2× base, vivid red, full opacity
  if (value >= 22)
    return { bg: 'rgba(255,91,79,0.22)',   text: '#ff6b62', fontSize: '22px', fontWeight: 800, opacity: 1,    px: '18px', py: '8px'  }
  // Tier 2 — High (value ≥ 16): 1.4× base, saturated red
  if (value >= 16)
    return { bg: 'rgba(255,91,79,0.16)',   text: '#ff8a84', fontSize: '16px', fontWeight: 700, opacity: 1,    px: '14px', py: '6px'  }
  // Tier 3 — Medium (value ≥ 11): base size, muted orange-red
  if (value >= 11)
    return { bg: 'rgba(255,91,79,0.10)',   text: '#ffa8a4', fontSize: '13px', fontWeight: 500, opacity: 0.85, px: '11px', py: '4px'  }
  // Tier 4 — Low (value ≥ 7): smaller, dim
  if (value >= 7)
    return { bg: 'rgba(255,91,79,0.06)',   text: '#cc6e69', fontSize: '11px', fontWeight: 400, opacity: 0.55, px: '10px', py: '3px'  }
  // Tier 5 — Noise (value < 7): minimal, below 30% opacity
  return   { bg: 'rgba(255,255,255,0.03)', text: '#444444', fontSize: '10px', fontWeight: 400, opacity: 0.25, px: '8px',  py: '2px'  }
}

export interface KeywordItem {
  text: string
  value: number
}

interface BadgeCloudProps {
  keywords: KeywordItem[]
}

export function BadgeCloud({ keywords }: BadgeCloudProps) {
  const sorted = [...keywords].sort((a, b) => b.value - a.value)

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
        出現頻率越高 → 字體越大、顏色越亮紅
      </p>

      {/* Pill grid — items-end so large pills align to bottom */}
      <div className="flex flex-wrap gap-2.5 flex-1 content-start items-end">
        {sorted.map((kw) => {
          const { bg, text, fontSize, fontWeight, opacity, px, py } = getPillStyle(kw.value)
          return (
            <span
              key={kw.text}
              className="inline-flex items-center gap-1 rounded-full cursor-default transition-all duration-150 hover:scale-105 hover:opacity-100"
              style={{
                background: bg,
                color: text,
                fontSize,
                fontWeight,
                opacity,
                paddingLeft: px,
                paddingRight: px,
                paddingTop: py,
                paddingBottom: py,
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
        className="mt-5 pt-4 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-mono text-[10px] text-[#444444] uppercase tracking-[0.04em]">
          頻率色階
        </span>
        {[
          { bg: 'rgba(255,255,255,0.03)', text: '#444444', label: 'low' },
          { bg: 'rgba(255,91,79,0.06)',   text: '#cc6e69', label: ''    },
          { bg: 'rgba(255,91,79,0.10)',   text: '#ffa8a4', label: ''    },
          { bg: 'rgba(255,91,79,0.16)',   text: '#ff8a84', label: ''    },
          { bg: 'rgba(255,91,79,0.22)',   text: '#ff6b62', label: 'high'},
        ].map((tier, i) => (
          <span
            key={i}
            className="inline-flex items-center justify-center text-[9px] font-medium rounded-full px-2 py-0.5"
            style={{ background: tier.bg, color: tier.text, minWidth: '28px' }}
          >
            {tier.label || '·'}
          </span>
        ))}
      </div>
    </div>
  )
}
