export default function ScoreTable({ scoreLog, finalScore, severity }) {
  if (!scoreLog?.length) return null

  const scoreColor = { safe: 'text-safe', warning: 'text-warn', danger: 'text-danger' }[severity]

  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
        Score Breakdown
      </p>
      <div className="rounded-xl border border-border bg-bg-3 overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {scoreLog.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-gray-400">{row.label}</td>
                <td className={`px-4 py-2 text-right font-mono font-bold ${
                  row.pts > 0 ? 'text-red-400' :
                  row.pts < 0 ? 'text-safe' : 'text-gray-600'
                }`}>
                  {row.pts > 0 ? `+${row.pts}` : row.pts === 0 ? '—' : row.pts}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-2 bg-bg-4">
              <td className="px-4 py-2.5 font-semibold text-gray-200">Total Risk Score</td>
              <td className={`px-4 py-2.5 text-right font-mono font-bold text-base ${scoreColor}`}>
                {finalScore}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
