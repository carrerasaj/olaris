export function CarbonTrackerMockup() {
  const scopes = [
    { label: 'Scope 1', value: '1,240', unit: 'tCO₂e', desc: 'Direct fleet emissions', pct: 68 },
    { label: 'Scope 2', value: '180', unit: 'tCO₂e', desc: 'Electricity (charging)', pct: 10 },
    { label: 'Scope 3', value: '410', unit: 'tCO₂e', desc: 'Supply chain & travel', pct: 22 },
  ]

  const transitionPct = 34

  return (
    <div className="p-4 space-y-4">
      {/* Header with gauge */}
      <div className="flex items-center gap-6">
        {/* Circular gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="#1E293B"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${transitionPct * 2.51} ${251 - transitionPct * 2.51}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-emerald-400 font-mono text-lg font-bold">{transitionPct}%</span>
            <span className="text-[9px] text-olaris-text-secondary">to net zero</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="text-xs text-olaris-text-secondary uppercase tracking-wider">
            Fleet Carbon Summary
          </div>
          <div>
            <span className="text-2xl font-mono font-bold text-white">1,830</span>
            <span className="text-xs text-olaris-text-secondary ml-1">tCO₂e/year</span>
          </div>
          <div className="text-xs text-olaris-text-secondary">
            Target: <span className="text-emerald-400 font-mono">1,200</span> tCO₂e by 2028
          </div>
        </div>
      </div>

      {/* EV transition progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-olaris-text-secondary">EV transition</span>
          <span className="text-emerald-400 font-mono">{transitionPct}% electric</span>
        </div>
        <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 rounded-full" style={{ width: `${transitionPct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-olaris-text-secondary mt-1">
          <span>150 EV / 292 ICE</span>
          <span>Target: 80% by 2028</span>
        </div>
      </div>

      {/* Scope breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {scopes.map((s) => (
          <div key={s.label} className="bg-[#1E293B] rounded-lg p-2.5 text-center">
            <div className="text-[10px] text-olaris-text-secondary mb-1">{s.label}</div>
            <div className="text-emerald-400 font-mono text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-olaris-text-secondary">{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Offset summary */}
      <div className="flex items-center justify-between bg-[#1E293B] rounded-lg px-3 py-2 text-xs">
        <span className="text-olaris-text-secondary">Carbon offsets purchased</span>
        <span className="text-emerald-400 font-mono font-bold">340 tCO₂e</span>
      </div>
    </div>
  )
}
