// Vercel Dark metric cards — Sparklines + semantic status badges
// Color semantics: Red=Critical, Orange=Warning, Blue=Info, Green=Safe

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

// ── MetricCard ───────────────────────────────────────────────────
interface MetricCardProps {
  mono: string
  value: string
  pill?: string
  pillColor?: string
  pillBg?: string
  valueLarge?: boolean
  statusBadge?: string
  statusColor?: string
  statusBg?: string
}

function MetricCard({
  mono,
  value,
  pill,
  pillColor = '#ff7a73',
  pillBg = 'rgba(255,91,79,0.12)',
  valueLarge = true,
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
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────
export interface MetricData {
  totalReviews: number
  highRiskCount: number
  topCategory: string
}

interface MetricCardsProps {
  metrics: MetricData
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const { totalReviews, highRiskCount, topCategory } = metrics
  const highRiskPct = totalReviews > 0
    ? ` · ${((highRiskCount / totalReviews) * 100).toFixed(1)}%`
    : ''

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 — Total filtered reviews */}
      <MetricCard
        mono="篩選負評總數"
        value={String(totalReviews)}
        statusBadge="Critical"
        statusColor="#ff7a73"
        statusBg="rgba(255,91,79,0.15)"
      />

      {/* Card 2 — High churn risk count */}
      <MetricCard
        mono="高流失風險評論數"
        value={String(highRiskCount)}
        statusBadge="Warning"
        statusColor="#ffb733"
        statusBg="rgba(255,159,10,0.15)"
        pill={`${highRiskPct.replace(' · ', '')} of total`}
        pillColor="#ffb733"
        pillBg="rgba(255,159,10,0.12)"
      />

      {/* Card 3 — Top risk category */}
      <MetricCard
        mono="最高風險警報分類"
        value={topCategory}
        valueLarge={false}
        statusBadge="Critical"
        statusColor="#ff7a73"
        statusBg="rgba(255,91,79,0.15)"
      />
    </div>
  )
}
