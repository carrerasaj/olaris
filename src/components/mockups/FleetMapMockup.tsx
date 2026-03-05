export function FleetMapMockup() {
  const vehicles = [
    { plate: 'AB21 XYZ', status: 'Moving', location: 'M40, Oxfordshire' },
    { plate: 'CD22 ABC', status: 'Idle', location: 'Reading Services' },
    { plate: 'EF23 DEF', status: 'Moving', location: 'A34, Hampshire' },
    { plate: 'GH24 GHI', status: 'Stopped', location: 'Bristol Depot' },
    { plate: 'JK25 JKL', status: 'Moving', location: 'M4, Swindon' },
  ]

  // Scatter positions for map dots
  const dots = [
    { top: '25%', left: '55%' },
    { top: '40%', left: '35%' },
    { top: '60%', left: '65%' },
    { top: '45%', left: '50%' },
    { top: '30%', left: '70%' },
    { top: '55%', left: '40%' },
    { top: '35%', left: '60%' },
    { top: '50%', left: '45%' },
  ]

  return (
    <div className="flex h-[320px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-olaris-border-dark p-3 space-y-2 overflow-hidden">
        <div className="text-xs font-medium text-olaris-text-secondary uppercase tracking-wider mb-3">
          Vehicles
        </div>
        {vehicles.map((v) => (
          <div
            key={v.plate}
            className="px-2 py-1.5 rounded bg-[#1E293B] text-xs"
          >
            <div className="font-mono text-white">{v.plate}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  v.status === 'Moving'
                    ? 'bg-emerald-400'
                    : v.status === 'Idle'
                      ? 'bg-yellow-400'
                      : 'bg-olaris-text-secondary'
                }`}
              />
              <span className="text-olaris-text-secondary">{v.location}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Map area */}
      <div className="flex-1 relative bg-[#0B1120]">
        {/* Grid lines to suggest a map */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(#06B6D4 1px, transparent 1px), linear-gradient(90deg, #06B6D4 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Vehicle dots */}
        {dots.map((pos, i) => (
          <div
            key={i}
            className="absolute"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
        ))}

        {/* Bottom stats bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-[#0F172A]/90 border-t border-olaris-border-dark flex gap-6 text-xs">
          <div>
            <span className="text-olaris-text-secondary">Total: </span>
            <span className="text-white font-mono">442</span>
          </div>
          <div>
            <span className="text-olaris-text-secondary">Active: </span>
            <span className="text-emerald-400 font-mono">387</span>
          </div>
          <div>
            <span className="text-olaris-text-secondary">Alerts: </span>
            <span className="text-yellow-400 font-mono">12</span>
          </div>
        </div>
      </div>
    </div>
  )
}
