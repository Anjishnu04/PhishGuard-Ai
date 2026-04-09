import { Shield, ShieldAlert, ShieldOff } from 'lucide-react'

function APICard({ title, children, available, reason }) {
  return (
    <div className="rounded-xl border border-border bg-bg-3 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold text-gray-300">{title}</span>
        {!available && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-4 text-gray-600">
            {reason?.includes('key') ? 'no key' : 'offline'}
          </span>
        )}
      </div>
      {available ? children : (
        <p className="text-[11px] text-gray-600">{reason || 'Not configured'}</p>
      )}
    </div>
  )
}

export default function ExternalAPIs({ urlScan, urlHaus, ml }) {
  if (!urlScan && !urlHaus && !ml) return null

  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-2">
        External Intelligence
      </p>
      <div className="grid grid-cols-1 gap-2">

        {/* URLScan.io */}
        {urlScan && (
          <APICard title="URLScan.io" available={urlScan.available} reason={urlScan.reason}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                urlScan.malicious
                  ? 'bg-danger/15 text-danger border-danger/30'
                  : 'bg-safe/15 text-safe border-safe/30'
              }`}>
                {urlScan.malicious ? 'malicious' : 'clean'}
              </span>
              <span className="text-[11px] text-gray-500">verdict: {urlScan.verdict ?? 0}/100</span>
              {urlScan.cached && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-4 text-gray-600 ml-auto">cached</span>
              )}
            </div>

            <div className="h-1.5 rounded-full bg-bg-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (urlScan.verdict || 0) >= 60 ? 'bg-danger' : 'bg-safe'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, urlScan.verdict || 0))}%` }}
              />
            </div>

            {urlScan.tags?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {urlScan.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-2 bg-bg-4 text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {urlScan.reportURL && (
              <a
                href={urlScan.reportURL}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-[11px] text-accent hover:underline"
              >
                View full report ↗
              </a>
            )}

            {urlScan.screenshot && (
              <div className="mt-2">
                <img
                  src={urlScan.screenshot}
                  alt="URLScan screenshot"
                  className="max-h-[80px] rounded border border-border-2"
                  loading="lazy"
                />
              </div>
            )}

            <div className="flex gap-1 mt-2 flex-wrap">
              {urlScan.ip && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-4 text-gray-400 border border-border-2">
                  ip: {urlScan.ip}
                </span>
              )}
              {urlScan.country && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-4 text-gray-400 border border-border-2">
                  country: {urlScan.country}
                </span>
              )}
              {urlScan.server && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-4 text-gray-400 border border-border-2">
                  server: {urlScan.server}
                </span>
              )}
            </div>
          </APICard>
        )}

        {/* URLHaus */}
        {urlHaus && (
          <APICard title="URLHaus" available={urlHaus.available} reason={urlHaus.reason}>
            {urlHaus.found ? (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded border bg-danger/15 text-danger border-danger/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                LISTED - malware/botnet URL
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded border bg-safe/15 text-safe border-safe/30">
                <Shield className="w-3.5 h-3.5" />
                Not in malware database
              </div>
            )}

            <div className="flex gap-1 mt-2 flex-wrap">
              {urlHaus.threat && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-danger/30 bg-danger/10 text-danger">
                  {urlHaus.threat}
                </span>
              )}

              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                urlHaus.status === 'online'
                  ? 'border-danger/30 bg-danger/10 text-danger'
                  : urlHaus.status === 'offline'
                    ? 'border-border-2 bg-bg-4 text-gray-400'
                    : 'border-warn/30 bg-warn/10 text-warn'
              }`}>
                status: {urlHaus.status || 'unknown'}
              </span>
            </div>

            {urlHaus.tags?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {urlHaus.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-2 bg-bg-4 text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-1 mt-2 flex-wrap">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-2 bg-bg-4 text-gray-400">
                SURBL: {urlHaus.blacklists?.surbl || 'n/a'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-2 bg-bg-4 text-gray-400">
                Spamhaus: {urlHaus.blacklists?.spamhaus || 'n/a'}
              </span>
            </div>

            {urlHaus.urlhausReference && (
              <a
                href={urlHaus.urlhausReference}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-[11px] text-accent hover:underline"
              >
                View URLHaus report ↗
              </a>
            )}
          </APICard>
        )}

        {/* ML Model */}
        {ml && (
          <APICard title="ML Model" available={ml.available} reason={ml.reason}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold font-mono ${
                ml.prediction === 'phishing' ? 'text-danger' : 'text-safe'
              }`}>
                {ml.prediction?.toUpperCase()}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-bg-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ml.prediction === 'phishing' ? 'bg-danger' : 'bg-safe'
                  }`}
                  style={{ width: `${ml.confidence}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-gray-400">{ml.confidence}%</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              Model: {ml.model}
            </div>
          </APICard>
        )}
      </div>
    </div>
  )
}
