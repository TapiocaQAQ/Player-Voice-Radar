import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

// ── Semantic colour tokens ────────────────────────────────────────
const C = {
  critical: '#ff5b4f',
  warning:  '#ff9f0a',
  info:     '#5aabff',
}

// Per-bar glow colours (matches risk level)
const GLOW: Record<string, string> = {
  [C.critical]: 'rgba(255,91,79,0.45)',
  [C.warning]:  'rgba(255,159,10,0.35)',
  [C.info]:     'rgba(90,171,255,0.3)',
}

// Assign colour by rank — top item is critical, second is warning, rest are info
function colorByRank(index: number): string {
  if (index === 0) return C.critical
  if (index === 1) return C.warning
  return C.info
}

// ── Types ─────────────────────────────────────────────────────────
interface ChartItem {
  name: string
  count: number
  color: string
}

interface TooltipPayloadItem {
  payload: ChartItem
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

// ── Custom tooltip ────────────────────────────────────────────────
function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const { name, count, color } = payload[0].payload
  return (
    <div
      style={{
        background: '#111111',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6), rgba(255,255,255,0.08) 0px 0px 0px 1px',
        borderRadius: '8px',
        padding: '10px 14px',
        minWidth: '148px',
      }}
    >
      <p
        style={{
          color: '#888888',
          fontSize: '11px',
          fontFamily: 'Geist Mono, monospace',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {name}
      </p>
      <p style={{ color: '#ededed', fontSize: '14px', fontWeight: 600, margin: 0 }}>
        客訴筆數：<span style={{ color }}>{count}</span>
      </p>
    </div>
  )
}

// ── Custom bar with gradient + layered drop-shadow glow ───────────
interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  isActive?: boolean
}

function CustomBar({ x = 0, y = 0, width = 0, height = 0, fill = '', isActive = false }: BarShapeProps) {
  if (height <= 0) return null
  const gradId = `grad-${fill.replace('#', '')}`
  const glowColor = GLOW[fill] ?? 'transparent'

  const glowFilter = isActive
    ? `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 14px ${glowColor.replace('0.', '0.2')})`
    : fill === C.critical
      ? `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 10px ${glowColor.replace('0.45', '0.2')})`
      : 'none'

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={fill} stopOpacity={0.95} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${gradId})`}
        rx={3}
        style={{ filter: glowFilter, transition: 'filter 150ms ease' }}
      />
    </g>
  )
}

// ── Legend pill ───────────────────────────────────────────────────
function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#555555]">
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────
interface InsightChartProps {
  data: { name: string; count: number }[]
  onCategorySelect: (category: string) => void
}

export function InsightChart({ data, onCategorySelect }: InsightChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Enrich with colour by rank (data is assumed to be sorted desc by App.tsx)
  const enrichedData: ChartItem[] = data.map((item, i) => ({
    ...item,
    color: colorByRank(i),
  }))

  const totalCount = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div
      className="rounded-lg p-6 h-full flex flex-col"
      style={{ background: '#0a0a0a', boxShadow: CARD_SHADOW }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p
            className="font-mono text-[11px] font-medium text-[#444444] uppercase"
            style={{ letterSpacing: '0.06em' }}
          >
            負評分類分佈
          </p>
          <p
            className="mt-1 text-[#ededed] font-semibold"
            style={{ fontSize: '1.375rem', letterSpacing: '-0.04em' }}
          >
            Insight Analysis
          </p>
        </div>

        {/* Risk-level legend */}
        <div className="flex items-center gap-3 mt-1">
          <LegendPill color={C.critical} label="Critical" />
          <LegendPill color={C.warning}  label="Warning"  />
          <LegendPill color={C.info}     label="Info"     />
        </div>
      </div>

      <p className="text-[13px] text-[#555555] mb-4">
        共 {totalCount} 筆 · 點擊分類查看詳情
      </p>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={enrichedData}
            margin={{ top: 6, right: 4, left: 10, bottom: 0 }}
            barCategoryGap="25%"
            onClick={(chartState) => {
              const label = chartState?.activeLabel
              if (label) onCategorySelect(label)
            }}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray=""
            />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'Geist Mono, monospace', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              onMouseEnter={(_data: unknown, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              shape={(props: unknown) => {
                const p = props as BarShapeProps & { index?: number }
                return <CustomBar {...p} isActive={activeIndex === (p.index ?? -1)} />
              }}
            >
              {enrichedData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
