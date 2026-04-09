export default function URLBreakdown({ meta, url }) {
  if (!url) return null

  let proto = '', host = '', path = '', query = ''
  try {
    const u = new URL(url)
    proto = u.protocol + '//'
    host  = u.hostname
    path  = u.pathname
    query = u.search
  } catch {
    host = url
  }

  return (
    <div className="mb-5">
      <SectionLabel>URL Breakdown</SectionLabel>
      <div className="font-mono text-xs bg-bg-3 border border-border rounded-xl px-4 py-3 break-all leading-relaxed">
        <span className="text-purple-400">{proto}</span>
        <span className="text-emerald-400">{host}</span>
        <span className="text-amber-400">{path}</span>
        <span className="text-red-400">{query}</span>
      </div>
      {meta && (
        <div className="flex gap-3 mt-2 flex-wrap">
          {[
            { label: 'TLD',        value: meta.tld },
            { label: 'Subdomains', value: meta.subdomainCount },
            { label: 'Protocol',   value: meta.protocol?.replace(':','') },
          ].map(({ label, value }) => (
            <span key={label} className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-4 text-gray-400">
              {label}: <span className="text-gray-200">{value || '—'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
      {children}
    </p>
  )
}
