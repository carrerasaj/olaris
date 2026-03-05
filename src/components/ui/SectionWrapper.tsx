import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  variant: 'dark' | 'light'
  children: React.ReactNode
  className?: string
  id?: string
  padding?: 'default' | 'compact' | 'none'
}

export function SectionWrapper({
  variant,
  children,
  className,
  id,
  padding = 'default',
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        variant === 'dark'
          ? 'bg-olaris-dark text-olaris-text-primary'
          : 'bg-olaris-light text-olaris-text-dark',
        padding === 'default' && 'py-20 md:py-28',
        padding === 'compact' && 'py-12 md:py-16',
        padding === 'none' && 'py-0',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
