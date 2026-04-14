// ── Domain types for Player-Voice-Radar ──────────────────────────

export type RiskLevel = 'critical' | 'warning' | 'info' | 'safe'

export interface Keyword {
  text: string
  count: number
}

export interface Review {
  id: string
  playerName: string
  date: string
  stars: number
  text: string
}

export interface Category {
  category: string
  count: number
  color: string
  riskLevel: RiskLevel
}

export interface MetricCard {
  mono: string
  value: string
  statusBadge?: string
  statusColor?: string
  statusBg?: string
  sparkData?: number[]
  sparkColor?: string
  delta?: string
  deltaLabel?: string
  deltaColor?: string
  pill?: string
  pillColor?: string
  pillBg?: string
  valueLarge?: boolean
}
