import { cn } from '@/lib/utils'

interface StatCardProps {
  value: string
  label: string
  variant?: 'dark' | 'light'
  accent?: 'cyan' | 'emerald'
}

export function StatCard({
  value,
  label,
  variant = 'dark',
  accent = 'cyan',
}: StatCardProps) {
  return (
    <div className="text-center">
      <div
        className={cn(
          'text-4xl md:text-5xl font-bold font-mono tracking-tight',
          accent === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          'mt-2 text-sm font-medium',
          variant === 'dark'
            ? 'text-olaris-text-secondary'
            : 'text-olaris-text-dark/60'
        )}
      >
        {label}
      </div>
    </div>
  )
}
