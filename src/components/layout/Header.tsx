'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'What We Do', href: '/platform' },
  { name: 'Who We Help', href: '/industries' },
  { name: 'About', href: '/about' },
  { name: 'Blog', href: '/blog' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="Olaris Home"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-cyan-500/20 transition-transform group-hover:scale-110 group-hover:ring-cyan-500/40">
            <Image
              src="https://res.cloudinary.com/dd7svdirf/image/upload/v1745526178/logo_mxa378.jpg"
              alt="Olaris Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="hidden text-xl font-bold text-white sm:block font-heading">
            Olaris
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                pathname === item.href
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-olaris-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              {item.name}
            </Link>
          ))}
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
            <Button variant="gradient" size="lg" className="mt-4 w-full" asChild>
              <Link href="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
