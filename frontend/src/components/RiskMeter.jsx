const barColor = (severity) => ({
  safe:    'bg-safe',
  warning: 'bg-warn',
  danger:  'bg-danger',
}[severity] || 'bg-safe')

export default function RiskMeter({ score, severity }) {
  return (
    <div className="mb-5">
      <div className="h-2 rounded-full bg-bg-4 overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${barColor(severity)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>0 — Safe</span>
        <span>30 — Suspicious</span>
        <span>65 — Dangerous</span>
        <span>100</span>
      </div>
    </div>
  )
}
