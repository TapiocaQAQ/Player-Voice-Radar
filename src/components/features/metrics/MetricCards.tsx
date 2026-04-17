import { useState } from "react"
import { SparkAreaChart, AreaChart } from "@tremor/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'

// ── Props ────────────────────────────────────────────────────────
export interface TrendPoint {
  day: string
  value: number
}

export interface MetricData {
  p0Level: number
  backlash: number
  vipChurn: number
}

export interface TrendData {
  p0Trend: TrendPoint[]
  backlashTrend: TrendPoint[]
  vipChurnTrend: TrendPoint[]
}

interface MetricCardsProps {
  metrics: MetricData
  trendData: TrendData
}

// ── Drill-down Dialog ────────────────────────────────────────────
interface DrillDialogProps {
  open: boolean
  onClose: () => void
  title: string
  sparkData: TrendPoint[]
  tremorColor: "rose" | "amber" | "purple"
  accentColor: string
}

function DrillDialog({ open, onClose, title, sparkData, tremorColor, accentColor }: DrillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl border-0 p-0 overflow-hidden"
        style={{ background: '#0d0d0d', boxShadow: 'rgba(255,255,255,0.1) 0px 0px 0px 1px, rgba(0,0,0,0.8) 0px 24px 48px' }}
      >
        <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p
            className="font-mono text-[10px] font-medium uppercase mb-1"
            style={{ letterSpacing: '0.07em', color: '#444444' }}
          >
            // 30 天走勢鑽取
          </p>
          <DialogTitle
            className="text-[#ededed] font-semibold"
            style={{ fontSize: '1.25rem', letterSpacing: '-0.03em' }}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5">
          {sparkData.length === 0 ? (
            <p className="font-mono text-[13px] text-[#555555] py-8 text-center">暫無趨勢資料</p>
          ) : (
            <AreaChart
              data={sparkData}
              index="day"
              categories={["value"]}
              colors={[tremorColor]}
              showLegend={false}
              showGridLines={false}
              showXAxis={true}
              showYAxis={true}
              className="h-52 mt-2"
              valueFormatter={(v) => `${v} 筆`}
            />
          )}

          {/* Summary row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: '峰值', val: Math.max(...sparkData.map(d => d.value), 0) },
              { label: '均值', val: sparkData.length ? Math.round(sparkData.reduce((s, d) => s + d.value, 0) / sparkData.length) : 0 },
              { label: '最新', val: sparkData[sparkData.length - 1]?.value ?? 0 },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="rounded-md px-3 py-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="font-mono text-[10px] text-[#555555] uppercase mb-1" style={{ letterSpacing: '0.05em' }}>{label}</p>
                <p className="font-semibold text-lg leading-none" style={{ color: accentColor, letterSpacing: '-0.04em' }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Single Metric Card ───────────────────────────────────────────
interface MetricCardProps {
  mono: string
  value: string | number
  sparkData: TrendPoint[]
  accentColor: string
  accentBg: string
  statusBadge: string
  tremorColor: "rose" | "amber" | "purple"
  dialogTitle: string
}

function MetricCard({
  mono,
  value,
  sparkData,
  accentColor,
  accentBg,
  statusBadge,
  tremorColor,
  dialogTitle,
}: MetricCardProps) {
  const [drillOpen, setDrillOpen] = useState(false)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="rounded-lg p-6 flex flex-col gap-3 cursor-pointer transition-all duration-150 hover:scale-[1.015] focus:outline-none"
        style={{ background: '#0a0a0a', boxShadow: CARD_SHADOW }}
        onClick={() => setDrillOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setDrillOpen(true)}
        title={`點擊查看 ${dialogTitle}`}
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

        {/* Value + sparkline */}
        <div className="flex items-end justify-between gap-3">
          <p
            className="text-[#ededed] font-semibold leading-none"
            style={{ fontSize: '2.625rem', letterSpacing: '-0.05em' }}
          >
            {value}
          </p>

          {/* 近 30 天 sparkline */}
          <div className="w-24 h-8 shrink-0">
            <SparkAreaChart
              data={sparkData}
              categories={["value"]}
              index="day"
              colors={[tremorColor]}
              className="h-8 w-24"
            />
          </div>
        </div>


        {/* Trend label */}
        <p className="font-mono text-[10px] text-[#444444]">
          近 30 天趨勢 <span style={{ color: accentColor, opacity: 0.6 }}>· 點擊查看</span>
        </p>
      </div>

      <DrillDialog
        open={drillOpen}
        onClose={() => setDrillOpen(false)}
        title={dialogTitle}
        sparkData={sparkData}
        tremorColor={tremorColor}
        accentColor={accentColor}
      />
    </>
  )
}

// ── MetricCards ──────────────────────────────────────────────────
export function MetricCards({ metrics, trendData }: MetricCardsProps) {
  const { p0Level, backlash, vipChurn } = metrics
  const { p0Trend, backlashTrend, vipChurnTrend } = trendData

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        mono="P0 級災情數"
        value={p0Level}
        sparkData={p0Trend}
        accentColor="#ff7a73"
        accentBg="rgba(255,91,79,0.15)"
        statusBadge="Critical"
        tremorColor="rose"
        dialogTitle="P0 級災情 30 天走勢"
      />
      <MetricCard
        mono="炎上指數"
        value={backlash}
        sparkData={backlashTrend}
        accentColor="#ffb733"
        accentBg="rgba(255,159,10,0.15)"
        statusBadge="Warning"
        tremorColor="amber"
        dialogTitle="炎上指數 30 天走勢"
      />
      <MetricCard
        mono="VIP 流失數"
        value={vipChurn}
        sparkData={vipChurnTrend}
        accentColor="#c084fc"
        accentBg="rgba(168,85,247,0.15)"
        statusBadge="Alert"
        tremorColor="purple"
        dialogTitle="VIP 流失數 30 天走勢"
      />
    </div>
  )
}
