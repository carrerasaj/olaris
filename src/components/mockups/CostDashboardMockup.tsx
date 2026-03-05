export function CostDashboardMockup() {
  const months = [
    { label: 'Sep', value: 92 },
    { label: 'Oct', value: 88 },
    { label: 'Nov', value: 95 },
    { label: 'Dec', value: 78 },
    { label: 'Jan', value: 104 },
    { label: 'Feb', value: 97 },
  ]

  const maxValue = Math.max(...months.map((m) => m.value))

  const topCosts = [
    { category: 'Fuel & Energy', amount: '£42,800', pct: 41 },
    { category: 'Finance Lease', amount: '£31,200', pct: 30 },
    { category: 'Maintenance', amount: '£18,600', pct: 18 },
    { category: 'Insurance', amount: '£11,400', pct: 11 },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1E293B] rounded-lg p-3 text-center">
          <div className="text-cyan-400 font-mono text-lg font-bold">£104k</div>
          <div className="text-[10px] text-olaris-text-secondary">Total Fleet Cost/mo</div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-3 text-center">
          <div className="text-white font-mono text-lg font-bold">£235</div>
          <div className="text-[10px] text-olaris-text-secondary">Avg Cost/Vehicle</div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-3 text-center">
          <div className="text-emerald-400 font-mono text-lg font-bold">£18.2k</div>
          <div className="text-[10px] text-olaris-text-secondary">Savings This Qtr</div>
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <div className="text-xs text-olaris-text-secondary mb-2">Monthly fleet cost (£k)</div>
        <div className="flex items-end gap-2 h-24">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all"
                style={{ height: `${(m.value / maxValue) * 100}%` }}
              />
              <span className="text-[10px] text-olaris-text-secondary">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top cost drivers */}
      <div className="space-y-1.5">
        <div className="text-xs text-olaris-text-secondary">Cost breakdown</div>
        {topCosts.map((c) => (
          <div key={c.category} className="flex items-center gap-2 text-xs">
            <span className="text-olaris-text-secondary w-24 truncate">{c.category}</span>
            <div className="flex-1 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${c.pct}%` }}
              />
            </div>
            <span className="font-mono text-white w-16 text-right">{c.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
