'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useSpring } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'What We Do', href: '/platform' },
  { name: 'Who We Help', href: '/industries' },
  { name: 'About', href: '/about' },
  { name: 'Blog', href: '/blog' },
]

const featuresNav = [
  { name: 'Mileage Tracking', href: '/features/mileage-tracking' },
  { name: 'Driver Behaviour', href: '/features/driver-behaviour' },
  { name: 'DVLA Compliance', href: '/features/dvla-compliance' },
  { name: 'EV Transition', href: '/features/ev-transition' },
  { name: 'Cost Tracking', href: '/features/cost-tracking' },
]

function OlarisLogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 44 56"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nav-arc1" x1="0" y1="0" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="nav-arc2" x1="40" y1="0" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Left arc */}
      <path d="M22 6 A20 20 0 0 0 22 50" stroke="url(#nav-arc1)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Right arc */}
      <path d="M22 6 A20 20 0 0 1 22 50" stroke="url(#nav-arc2)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Data points */}
      <circle cx="5" cy="28" r="2" fill="#06B6D4" />
      <circle cx="39" cy="28" r="2" fill="#22D3EE" />
      <circle cx="22" cy="6" r="2.5" fill="#F1F5F9" />
      <circle cx="22" cy="50" r="2.5" fill="#F1F5F9" />
      {/* Centre pulse */}
      <circle cx="22" cy="28" r="3.5" fill="#06B6D4" className="logo-pulse" />
      <circle cx="22" cy="28" r="2" fill="#06B6D4" />
    </svg>
  )
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false)
  const pathname = usePathname()

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-[#0F172A]/95 backdrop-blur-xl shadow-lg border-b border-olaris-border-dark'
          : 'bg-[#0F172A]/80 backdrop-blur-sm'
      )}
    >
      {/* Scroll progress bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 origin-left z-50"
        style={{ scaleX }}
      />

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Olaris Home"
        >
          <OlarisLogoMark className="h-9 w-auto transition-transform group-hover:scale-110" />
          <span className="hidden text-xl font-bold text-white sm:block font-heading">
            Olaris
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'text-cyan-400'
                    : 'text-olaris-text-secondary hover:text-white'
                )}
              >
                {item.name}
                {/* Animated underline */}
                <motion.span
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400 rounded-full"
                  initial={false}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{ originX: 0 }}
                />
              </Link>
            )
          })}

          {/* Features dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsFeaturesOpen(true)}
            onMouseLeave={() => setIsFeaturesOpen(false)}
          >
            <button
              className={cn(
                'relative flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname.startsWith('/features')
                  ? 'text-cyan-400'
                  : 'text-olaris-text-secondary hover:text-white'
              )}
            >
              Features
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isFeaturesOpen && 'rotate-180')} />
            </button>
            {isFeaturesOpen && (
              <div className="absolute top-full left-0 pt-1 z-50">
                <div className="w-52 rounded-xl bg-[#0F172A] border border-olaris-border-dark shadow-xl py-1">
                  {featuresNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'block px-4 py-2 text-sm transition-colors',
                        pathname === item.href
                          ? 'text-cyan-400'
                          : 'text-olaris-text-secondary hover:text-white hover:bg-white/5'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-olaris-text-secondary hover:text-white rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* CTA */}
          <Button variant="gradient" size="default" className="hidden lg:flex" asChild>
            <Link href="/contact">Talk to Us</Link>
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0F172A] border-t border-olaris-border-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-3 text-base font-medium rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-olaris-text-secondary hover:text-white hover:bg-white/5'
                )}
              >
                {item.name}
              </Link>
            ))}
            {/* Features sub-links */}
            <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-olaris-text-secondary/50">
              Features
            </p>
            {featuresNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-6 py-2 text-sm font-medium rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-olaris-text-secondary hover:text-white hover:bg-white/5'
                )}
              >
                {item.name}
              </Link>
            ))}
            <Button variant="gradient" size="lg" className="mt-4 w-full" asChild>
              <Link href="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
