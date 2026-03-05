import { cn } from '@/lib/utils'

interface CardProps {
  variant?: 'dark' | 'light'
  hover?: boolean
  children: React.ReactNode
  className?: string
}

export function Card({
  variant = 'light',
  hover = true,
  children,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        variant === 'dark'
          ? 'bg-[#1E293B] border-olaris-border-dark text-olaris-text-primary'
          : 'bg-white border-olaris-border-light text-olaris-text-dark',
        hover &&
          'transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  )
}
