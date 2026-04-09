import { useEffect, useState } from 'react'
import Header        from './components/Header'
import URLInput      from './components/URLInput'
import VerdictCard   from './components/VerdictCard'
import RiskMeter     from './components/RiskMeter'
import URLBreakdown  from './components/URLBreakdown'
import DetectionFlags from './components/DetectionFlags'
import ExternalAPIs  from './components/ExternalAPIs'
import AIExplanation from './components/AIExplanation'
import ScoreTable    from './components/ScoreTable'
import ChatPanel     from './components/ChatPanel'
import { useScan }   from './hooks/useScan'
import { useChat }   from './hooks/useChat'
import { getHealth } from './utils/api'

export default function App() {
  const { result, loading, error, scan } = useScan()
  const { messages, thinking, send, announceScan } = useChat()
  const [services, setServices] = useState(null)

  // Fetch service health on mount
  useEffect(() => {
    getHealth().then(h => setServices(h.services)).catch(() => {})
  }, [])

  const handleScan = async (url) => {
    const data = await scan(url)
    if (data) announceScan(data)
  }

  // Build scan context for chatbot
  const scanContext = result ? {
    url:     result.url,
    score:   result.score,
    verdict: result.verdict,
    flags:   result.rules?.flags
  } : null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header services={services} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Scanner ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-border">
          <URLInput onScan={handleScan} loading={loading} />

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="animate-fade-up">
              <VerdictCard
                verdict={result.verdict}
                severity={result.severity}
                score={result.score}
              />
              <RiskMeter score={result.score} severity={result.severity} />
              <URLBreakdown meta={result.rules?.meta} url={result.url} />
              <DetectionFlags flags={result.rules?.flags} />
              <ExternalAPIs
                urlScan={result.urlScan}
                urlHaus={result.urlHaus}
                ml={result.ml}
              />
              <AIExplanation text={result.aiExplanation} loading={false} />
              <ScoreTable
                scoreLog={result.rules?.scoreLog}
                finalScore={result.score}
                severity={result.severity}
              />
            </div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-700 text-sm text-center">
              <svg className="w-12 h-12 mb-4 opacity-20" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L42 11v13c0 12-8 21-18 24C14 45 6 36 6 24V11z" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-gray-600">Paste a URL above and click Analyze</p>
              <p className="text-gray-700 text-xs mt-1">to get a full AI threat report</p>
            </div>
          )}
        </div>

        {/* ── Right: Chat ──────────────────────────────── */}
        <div className="w-96 flex-shrink-0">
          <ChatPanel
            messages={messages}
            thinking={thinking}
            onSend={send}
            scanContext={scanContext}
          />
        </div>
      </div>
    </div>
  )
}
