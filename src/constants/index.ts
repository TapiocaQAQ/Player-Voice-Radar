// ── Design tokens & semantic color constants ──────────────────────

/** Semantic risk-level colors */
export const COLORS = {
  critical: '#ff5b4f',
  warning:  '#ff9f0a',
  info:     '#5aabff',
  safe:     '#30d158',
} as const

/** Shared card shadow used across surface components */
export const CARD_SHADOW =
  'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px, rgba(255,255,255,0.02) 0px 0px 0px 1px inset'
