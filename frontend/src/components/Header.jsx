export default function Header({ services }) {
  const allOk = services && Object.values(services).every(Boolean)

  return (
    <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-bg-2">
      <img src="/logo.svg" alt="PhishGuard" className="w-7 h-7" />
      <span className="text-lg font-bold tracking-tight">
        Phish<span className="text-accent">Guard</span> AI
      </span>

      <div className="ml-auto flex items-center gap-3">
        {services && (
          <div className="flex gap-2">
            {[
              { key: 'urlScan',      label: 'URLScan' },
              { key: 'urlHaus',      label: 'URLHaus' },
              { key: 'groq',         label: 'AI' },
              { key: 'ml',           label: 'ML' },
            ].map(({ key, label }) => (
              <span
                key={key}
                title={key}
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  services[key]
                    ? 'border-safe/40 bg-safe/10 text-safe'
                    : 'border-border-2 bg-bg-3 text-gray-500'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
        <span className="text-[11px] font-mono px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
          PhishGuard · AI-Powered
        </span>
      </div>
    </header>
  )
}
