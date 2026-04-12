import { useState } from "react"
import { Header } from "@/components/Header"
import { MetricCards } from "@/components/MetricCards"
import { InsightChart } from "@/components/InsightChart"
import { BadgeCloud } from "@/components/BadgeCloud"
import { DetailSheet } from "@/components/DetailSheet"

function App() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-[#ededed]">
      <Header onSync={() => {}} />

      <main className="max-w-screen-xl mx-auto px-8 py-10 space-y-10">

        {/* Section: Metrics */}
        <section>
          <p
            className="font-mono text-[11px] font-medium text-[#444444] uppercase mb-4"
            style={{ letterSpacing: '0.06em' }}
          >
            // metrics overview
          </p>
          <MetricCards />
        </section>

        {/* Section: Charts */}
        <section>
          <p
            className="font-mono text-[11px] font-medium text-[#444444] uppercase mb-4"
            style={{ letterSpacing: '0.06em' }}
          >
            // insight analysis
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <InsightChart onBarClick={() => setSheetOpen(true)} />
            </div>
            <div className="lg:col-span-1">
              <BadgeCloud />
            </div>
          </div>
        </section>

        {/* Footer — Vercel full-width dark divider */}
        <footer className="pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#444444]">
              player-voice-radar v0.1.0 · internal use only
            </span>
            <span className="font-mono text-[11px] text-[#444444]">
              powered-by: gemini-2.0-flash + google-play-api
            </span>
          </div>
        </footer>

      </main>

      <DetailSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}

export default App
