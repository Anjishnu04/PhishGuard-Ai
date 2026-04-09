import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

const EXAMPLES = [
  { label: 'IP phishing',    url: 'http://192.168.0.1/paypal-login/verify-account?token=xYz' },
  { label: 'Lookalike',      url: 'https://secure.paypa1-update.verify-account.tk/login' },
  { label: 'Safe site',      url: 'https://google.com' },
  { label: 'Scam URL',       url: 'http://free-prize-winner.click/claim?user=you&ref=urgent&bank=verify' },
  { label: 'Deep subdomain', url: 'https://accounts.secure.update.bankofamerica.suspicious-domain.ru/login' },
]

export default function URLInput({ onScan, loading }) {
  const [value, setValue] = useState('')

  const handleScan = () => {
    if (value.trim()) onScan(value.trim())
  }

  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
        Scan URL
      </p>

      <div className="flex gap-2 mb-3">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleScan()}
          placeholder="https://paste-any-url-here.com/to/analyze"
          className="flex-1 px-4 py-3 rounded-xl bg-bg-3 border border-border-2 text-sm text-gray-100
                     placeholder:text-gray-600 outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleScan}
          disabled={loading || !value.trim()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-sm font-semibold
                     hover:bg-blue-500 active:scale-[0.98] disabled:bg-bg-4 disabled:text-gray-500
                     transition-all whitespace-nowrap"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Search className="w-4 h-4" />
          }
          {loading ? 'Scanning…' : 'Analyze'}
        </button>
      </div>

      {/* Example chips */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-[11px] text-gray-600 self-center">Try:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            onClick={() => { setValue(ex.url); onScan(ex.url) }}
            className="text-[11px] px-3 py-1 rounded-full border border-border-2 bg-bg-3
                       text-gray-400 hover:border-accent hover:text-accent transition-colors font-mono"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
