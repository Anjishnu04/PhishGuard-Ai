const COLORS = {
  safe:    { border: 'border-safe/30',   bg: 'bg-safe/10',   text: 'text-safe',   dot: 'bg-safe',   label: 'No major threats detected' },
  warning: { border: 'border-warn/30',   bg: 'bg-warn/10',   text: 'text-warn',   dot: 'bg-warn',   label: 'Proceed with caution' },
  danger:  { border: 'border-danger/30', bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger', label: 'Do NOT visit this URL' },
}

export default function VerdictCard({ verdict, severity, score }) {
  const c = COLORS[severity] || COLORS.safe

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${c.border} ${c.bg} mb-4 animate-fade-up`}>
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot} ${severity === 'danger' ? 'animate-pulse-glow' : ''}`} />
        <div>
          <div className={`text-base font-bold ${c.text}`}>{verdict}</div>
          <div className="text-xs text-gray-500">{c.label}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-3xl font-bold font-mono ${c.text}`}>{score}</div>
        <div className="text-[10px] text-gray-600 tracking-widest uppercase">Risk Score</div>
      </div>
    </div>
  )
}
