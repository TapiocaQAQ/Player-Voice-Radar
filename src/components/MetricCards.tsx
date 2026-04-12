// Vercel Dark metric cards — Sparklines + semantic status badges
// Color semantics: Red=Critical, Orange=Warning, Blue=Info, Green=Safe

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

// ── SVG Sparkline — smooth monotone cubic bezier ─────────────────
interface SparklineProps {
  data: number[]
  color: string
}

/** Convert flat data array to SVG coordinate pairs */
function toPoints(data: number[], W: number, H: number, pad: number): Array<[number, number]> {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / range) * (H - pad * 2) - pad,
  ])
}

/** Smooth path using cubic bezier control points (monotone-x style) */
function smoothLinePath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cpX = (x0 + x1) / 2
    d += ` C ${cpX.toFixed(1)} ${y0.toFixed(1)}, ${cpX.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  return d
}

function Sparkline({ data, color }: SparklineProps) {
  const W = 88
  const H = 34
  const PAD = 4
  const gradId = `spark-${color.replace('#', '')}`

  const pts = toPoints(data, W, H, PAD)
  const linePath = smoothLinePath(pts)
  const last = pts[pts.length - 1]
  const first = pts[0]

  // Area = line path + close to bottom-left
  const areaPath = `${linePath} L ${last[0].toFixed(1)} ${H} L ${first[0].toFixed(1)} ${H} Z`

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0}    />
        </linearGradient>
      </defs>
      {/* Smooth area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      {/* Smooth line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />
      {/* Endpoint dot */}
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2.5" fill={color} opacity={0.9} />
    </svg>
  )
}

// ── MetricCard ───────────────────────────────────────────────────
interface MetricCardProps {
  mono: string
  value: string
  delta?: string
  deltaLabel?: string
  deltaColor?: string
  pill?: string
  pillColor?: string
  pillBg?: string
  valueLarge?: boolean
  sparkData?: number[]
  sparkColor?: string
  statusBadge?: string
  statusColor?: string
  statusBg?: string
}

function MetricCard({
  mono,
  value,
  delta,
  deltaLabel,
  deltaColor = '#ff5b4f',
  pill,
  pillColor = '#ff7a73',
  pillBg = 'rgba(255,91,79,0.12)',
  valueLarge = true,
  sparkData,
  sparkColor = '#ff5b4f',
  statusBadge,
  statusColor = '#ff7a73',
  statusBg = 'rgba(255,91,79,0.15)',
}: MetricCardProps) {
  return (
    <div
      className="rounded-lg p-6 flex flex-col gap-3"
      style={{ background: '#0a0a0a', boxShadow: CARD_SHADOW }}
    >
      {/* Label row + status badge */}
      <div className="flex items-center justify-between gap-2">
        <p
          className="font-mono text-[11px] font-medium text-[#666666] uppercase"
          style={{ letterSpacing: '0.06em' }}
        >
          {mono}
        </p>
        {statusBadge && (
          <span
            className="shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
            style={{ background: statusBg, color: statusColor, letterSpacing: '0.05em' }}
          >
            {statusBadge}
          </span>
        )}
      </div>

      {/* Primary value */}
      <div className="flex flex-col gap-1.5">
        {valueLarge ? (
          <p
            className="text-[#ededed] font-semibold leading-none"
            style={{ fontSize: '2.625rem', letterSpacing: '-0.05em' }}
          >
            {value}
          </p>
        ) : (
          <p
            className="text-[#ededed] font-semibold leading-tight"
            style={{ fontSize: '1.375rem', letterSpacing: '-0.04em' }}
          >
            {value}
          </p>
        )}

        {pill && (
          <span
            className="self-start text-[11px] font-medium px-2.5 py-0.5 rounded-full"
            style={{ background: pillBg, color: pillColor }}
          >
            {pill}
          </span>
        )}
      </div>

      {/* Sparkline trend — mb gives breathing room above the delta row */}
      {sparkData && (
        <div style={{ marginBottom: '4px' }}>
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      )}

      {/* Delta */}
      {delta && (
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium" style={{ color: deltaColor }}>{delta}</span>
          <span className="text-[#555555]">{deltaLabel}</span>
        </div>
      )}
    </div>
  )
}

export function MetricCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 — Critical: spike in bad reviews */}
      <MetricCard
        mono="今日新增負評數"
        value="129"
        statusBadge="Critical"
        statusColor="#ff7a73"
        statusBg="rgba(255,91,79,0.15)"
        sparkData={[72, 81, 68, 94, 105, 115, 129]}
        sparkColor="#ff5b4f"
        delta="↑ 23%"
        deltaLabel="vs 昨日 (105 筆)"
        deltaColor="#ff5b4f"
      />

      {/* Card 2 — Warning: churn risk rising */}
      <MetricCard
        mono="高流失風險玩家數"
        value="47"
        statusBadge="Warning"
        statusColor="#ffb733"
        statusBg="rgba(255,159,10,0.15)"
        sparkData={[38, 40, 39, 42, 41, 44, 47]}
        sparkColor="#ff9f0a"
        delta="↑ 8%"
        deltaLabel="vs 昨日"
        deltaColor="#ff9f0a"
        pillColor="#ffb733"
        pillBg="rgba(255,159,10,0.12)"
      />

      {/* Card 3 — Critical: top risk category */}
      <MetricCard
        mono="最高風險警報分類"
        value="抽卡/中獎機率"
        valueLarge={false}
        statusBadge="Critical"
        statusColor="#ff7a73"
        statusBg="rgba(255,91,79,0.15)"
        pill="45 筆 · 34.9%"
        pillColor="#ff7a73"
        pillBg="rgba(255,91,79,0.12)"
        delta="↑ 31%"
        deltaLabel="vs 上週同期"
        deltaColor="#ff5b4f"
      />
    </div>
  )
}
