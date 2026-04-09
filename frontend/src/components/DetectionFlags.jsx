const FLAG_STYLES = {
  danger:  'border-danger/30 bg-danger/10',
  warning: 'border-warn/30 bg-warn/10',
  safe:    'border-safe/30 bg-safe/10',
}
const TITLE_STYLES = {
  danger:  'text-red-400',
  warning: 'text-amber-300',
  safe:    'text-emerald-400',
}

export default function DetectionFlags({ flags }) {
  if (!flags?.length) return null

  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
        Detection Signals
      </p>
      <div className="grid grid-cols-2 gap-2">
        {flags.map((f, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 ${FLAG_STYLES[f.type] || FLAG_STYLES.safe}`}
          >
            <div className={`text-xs font-semibold mb-1 ${TITLE_STYLES[f.type]}`}>
              {f.title}
            </div>
            <div className="text-[11px] text-gray-400 leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
