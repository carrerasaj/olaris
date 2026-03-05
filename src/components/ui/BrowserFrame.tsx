import { cn } from '@/lib/utils'

interface BrowserFrameProps {
  url?: string
  children: React.ReactNode
  className?: string
}

export function BrowserFrame({
  url = 'app.olaris.co.uk',
  children,
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border border-olaris-border-dark shadow-2xl shadow-cyan-500/10',
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1E293B] border-b border-olaris-border-dark">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-olaris-text-secondary font-mono">
            {url}
          </span>
        </div>
        <div className="w-[54px]" /> {/* Spacer to balance dots */}
      </div>

      {/* Content */}
      <div className="bg-[#0F172A]">
        {children}
      </div>
    </div>
  )
}
