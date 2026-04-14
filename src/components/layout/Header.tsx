import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HeaderProps {
  onSync: () => void
}

// Vercel dark header:
// bg: black · shadow-border: white 8% · font: Geist

export function Header({ onSync }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full bg-black"
      style={{ boxShadow: 'rgba(255,255,255,0.08) 0px 0px 0px 1px' }}
    >
      {/* Main row */}
      <div className="max-w-screen-xl mx-auto px-8 h-14 flex items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-baseline gap-3 shrink-0">
          <span
            className="text-[24px] text-[#ededed]"
            style={{ fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            Player-Voice
            <span className="text-[#ff5b4f]">-Radar</span>
          </span>
          <span className="text-[rgba(255,255,255,0.12)] select-none">/</span>
          <span className="text-[#666666] text-sm hidden md:block">
            遊戲營運即時監控
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* LIVE pill — Ship Red tinted */}
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(255,91,79,0.12)', color: '#ff7a73' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b4f]" />
            LIVE
          </span>

          {/* Star filter */}
          <Select defaultValue="1-3">
            <SelectTrigger
              className="w-[148px] h-8 text-xs rounded-md bg-black text-[#a1a1a1] focus:ring-0 focus:ring-offset-0"
              style={{
                boxShadow: 'rgba(255,255,255,0.08) 0px 0px 0px 1px',
                border: 'none',
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="rounded-lg bg-[#0a0a0a] text-[#ededed]"
              style={{
                boxShadow: 'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.8) 0px 8px 20px',
                border: 'none',
              }}
            >
              <SelectItem value="1-3" className="text-sm text-[#a1a1a1] focus:bg-[#111111] focus:text-[#ededed]">
                ★ 1–3 星（負評）
              </SelectItem>
              <SelectItem value="1-2" className="text-sm text-[#a1a1a1] focus:bg-[#111111] focus:text-[#ededed]">
                ★ 1–2 星（極差）
              </SelectItem>
              <SelectItem value="1-5" className="text-sm text-[#a1a1a1] focus:bg-[#111111] focus:text-[#ededed]">
                ★ 全部星等
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sync button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            className="h-8 px-4 gap-1.5 bg-black text-[#ededed] text-xs font-medium rounded-md hover:bg-[#111111] transition-colors duration-100"
            style={{
              boxShadow: 'rgba(255,255,255,0.08) 0px 0px 0px 1px',
              border: 'none',
            }}
          >
            <RefreshCw className="h-3 w-3" />
            強制同步
          </Button>
        </div>
      </div>

      {/* Metadata bar — Geist Mono, very muted */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-screen-xl mx-auto px-8 h-8 flex items-center gap-4">
          <span className="font-mono text-[11px] text-[#444444] uppercase tracking-[0.04em]">
            src: google-play-api
          </span>
          <span className="text-[rgba(255,255,255,0.08)]">·</span>
          <span className="font-mono text-[11px] text-[#444444]">
            last-sync: 2026-04-11T08:42+08:00
          </span>
          <span className="text-[rgba(255,255,255,0.08)]">·</span>
          <span className="font-mono text-[11px] text-[#444444] uppercase tracking-[0.04em]">
            ai: gemini-2.0-flash
          </span>
          <span className="text-[rgba(255,255,255,0.08)]">·</span>
          <span className="font-mono text-[11px] text-[#888888] font-medium">
            filter: 1–3★ · 129 reviews
          </span>
        </div>
      </div>
    </header>
  )
}
