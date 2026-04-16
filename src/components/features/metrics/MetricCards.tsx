import { SparkAreaChart } from "@tremor/react"

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

// ── Fake 7-day trend data generator (deterministic per seed) ────
function fakeTrend(base: number, seed: number): { day: string; value: number }[] {
  const offsets = [0.6, 0.75, 0.85, 0.7, 0.9, 0.95, 1.0]
  return offsets.map((o, i) => ({
    day: `D${i + 1}`,
    value: Math.max(0, Math.round(base * o + seed * ((i % 3) - 1))),
  }))
}

// ── Single Metric Card ──────────────────────────────────────────
interface MetricCardProps {
  mono: string
  value: string | number
  delta: string
  deltaPositive: boolean
  sparkData: { day: string; value: number }[]
  accentColor: string
  accentBg: string
  statusBadge: string
}

function MetricCard({
  mono,
  value,
  delta,
  deltaPositive,
  sparkData,
  accentColor,
  accentBg,
  statusBadge,
}: MetricCardProps) {
  return (
    <div
      className="rounded-lg p-6 flex flex-col gap-3"
      style={{ background: '#0a0a0a', boxShadow: CARD_SHADOW }}
    >
      {/* Label + status badge */}
      <div className="flex items-center justify-between gap-2">
        <p
          className="font-mono text-[11px] font-medium text-[#666666] uppercase"
          style={{ letterSpacing: '0.06em' }}
        >
          {mono}
        </p>
        <span
          className="shrink-0 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
          style={{ background: accentBg, color: accentColor, letterSpacing: '0.05em' }}
        >
          {statusBadge}
        </span>
      </div>

      {/* Value + delta badge */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-2.5">
          <p
            className="text-[#ededed] font-semibold leading-none"
            style={{ fontSize: '2.625rem', letterSpacing: '-0.05em' }}
          >
            {value}
          </p>
          <span
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full mb-1"
            style={{
              background: deltaPositive ? 'rgba(255,91,79,0.12)' : 'rgba(52,199,89,0.12)',
              color: deltaPositive ? '#ff7a73' : '#34c759',
            }}
          >
            {delta}
          </span>
        </div>

        {/* 7-day sparkline */}
        <div className="w-24 h-8 shrink-0">
          <SparkAreaChart
            data={sparkData}
            categories={["value"]}
            index="day"
            colors={[accentColor === '#ff7a73' ? 'rose' : accentColor === '#ffb733' ? 'amber' : 'purple']}
            className="h-8 w-24"
          />
        </div>
      </div>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────
export interface MetricData {
  p0Level: number
  backlash: number
  vipChurn: number
}

interface MetricCardsProps {
  metrics: MetricData
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const { p0Level, backlash, vipChurn } = metrics

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 — P0 級災情數 */}
      <MetricCard
        mono="P0 級災情數"
        value={p0Level}
        delta="+12%"
        deltaPositive={true}
        sparkData={fakeTrend(p0Level, 3)}
        accentColor="#ff7a73"
        accentBg="rgba(255,91,79,0.15)"
        statusBadge="Critical"
      />

      {/* Card 2 — 炎上指數 */}
      <MetricCard
        mono="炎上指數"
        value={backlash}
        delta="+8%"
        deltaPositive={true}
        sparkData={fakeTrend(backlash, 5)}
        accentColor="#ffb733"
        accentBg="rgba(255,159,10,0.15)"
        statusBadge="Warning"
      />

      {/* Card 3 — VIP 流失數 */}
      <MetricCard
        mono="VIP 流失數"
        value={vipChurn}
        delta="+5%"
        deltaPositive={true}
        sparkData={fakeTrend(vipChurn, 2)}
        accentColor="#c084fc"
        accentBg="rgba(168,85,247,0.15)"
        statusBadge="Alert"
      />
    </div>
  )
}
