import { Sparkles } from 'lucide-react'

export default function AIExplanation({ text, loading }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
        AI Analysis
      </p>
      <div className="rounded-xl border border-border-2 bg-bg-3 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-accent/30 bg-accent/10 text-accent">
            Groq AI
          </span>
          <span className="text-[11px] text-gray-600">Threat intelligence</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-border-2 border-t-accent animate-spin-slow block" />
            Generating AI analysis…
          </div>
        ) : text ? (
          <p
            className="text-sm text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }}
          />
        ) : (
          <p className="text-sm text-gray-600">AI explanation unavailable.</p>
        )}
      </div>
    </div>
  )
}
