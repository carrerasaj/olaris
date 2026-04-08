import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  /**
   * `dark` / `light` paint a solid background and are opaque.
   * `dark-transparent` paints no background so whatever sits behind the
   * section (e.g. the MarketingLayout wave canvas) is visible through it.
   * Text colour still matches the dark variant.
   */
  variant: 'dark' | 'light' | 'dark-transparent'
  children: React.ReactNode
  className?: string
  id?: string
  padding?: 'default' | 'compact' | 'spacious' | 'none'
  contentWidth?: 'default' | 'content'
}

export function SectionWrapper({
  variant,
  children,
  className,
  id,
  padding = 'default',
  contentWidth = 'default',
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        variant === 'dark' && 'bg-olaris-dark text-olaris-text-primary',
        variant === 'light' && 'bg-olaris-light text-olaris-text-dark',
        variant === 'dark-transparent' && 'text-olaris-text-primary',
        padding === 'default' && 'py-20 md:py-28',
        padding === 'compact' && 'py-12 md:py-16',
        padding === 'spacious' && 'py-32 md:py-40',
        padding === 'none' && 'py-0',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8',
          contentWidth === 'content' ? 'max-w-content' : 'max-w-7xl'
        )}
      >
        {children}
      </div>
    </section>
  )
}
