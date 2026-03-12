import { LinkedinIcon } from 'lucide-react'

export function AuthorBio() {
  return (
    <div className="mt-12 p-6 rounded-xl bg-[#0F172A] border border-olaris-border-dark flex gap-4 items-start">
      {/* Initials avatar */}
      <div className="shrink-0 w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
        AC
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-bold text-white text-sm">Alan Carreras</span>
          <span className="text-xs text-olaris-text-secondary">Founder, Olaris</span>
          <a
            href="https://www.linkedin.com/in/alan-carreras-7543231a/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Alan Carreras on LinkedIn"
            className="text-olaris-text-secondary hover:text-cyan-400 transition-colors"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-sm text-olaris-text-secondary leading-relaxed">
          Former Chair of the BVRLA Leasing Broker Committee (2019–2021) and FLA Committee Member.
          Spent 12 years growing Bridle Group (now Jurni Leasing) from a small Witney brokerage to
          one of the UK&apos;s largest independent vehicle brokers, managing 37,000+ vehicles.
          Personally led 18 acquisitions — sourcing, negotiating, due diligence, and integration —
          including Churchill Vehicle Leasing, Sprint Contracts, and Kew Vehicle Leasing. Now
          building the fleet intelligence tools he wished he&apos;d had.
        </p>
      </div>
    </div>
  )
}
