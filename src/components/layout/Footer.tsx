'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LinkedinIcon, TwitterIcon, Mail, Phone, MapPin } from 'lucide-react'
import { siteConfig } from '@/lib/seo'

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubscribing(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSubscribeStatus('success')
        setEmail('')
      } else {
        setSubscribeStatus('error')
      }
    } catch {
      setSubscribeStatus('error')
    } finally {
      setIsSubscribing(false)
      setTimeout(() => setSubscribeStatus('idle'), 5000)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0F172A] border-t border-olaris-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">Olaris</h3>
            <p className="text-sm text-olaris-text-secondary leading-relaxed">
              Fleet intelligence built from 40 years of automotive experience. Visibility, compliance, cost control, and sustainability — in one place.
            </p>
            <div className="flex gap-3">
              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-2 rounded-lg border border-olaris-border-dark text-olaris-text-secondary hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="p-2 rounded-lg border border-olaris-border-dark text-olaris-text-secondary hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* What We Do */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">What We Do</h3>
            <ul className="space-y-2 text-sm">
              {[
                { name: 'Fleet Visibility', href: '/platform#fleet-visibility' },
                { name: 'Driver Management', href: '/platform#driver-management' },
                { name: 'Cost & Mileage', href: '/platform#cost-control' },
                { name: 'Sustainability', href: '/platform#sustainability' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-olaris-text-secondary hover:text-cyan-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">Contact</h3>
            <ul className="space-y-3 text-sm text-olaris-text-secondary">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <span>
                  {siteConfig.contact.address.street}<br />
                  {siteConfig.contact.address.city}, {siteConfig.contact.address.postcode}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-cyan-400" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">Newsletter</h3>
            <p className="text-sm text-olaris-text-secondary">
              Fleet management insights and industry updates, monthly.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubscribing}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#1E293B] border border-olaris-border-dark text-white placeholder:text-olaris-text-secondary focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
              {subscribeStatus === 'success' && (
                <p className="text-sm text-emerald-400">Successfully subscribed!</p>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-sm text-red-400">Failed to subscribe. Please try again.</p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-olaris-border-dark pt-8 text-sm text-olaris-text-secondary sm:flex-row">
          <p>&copy; {currentYear} Olaris Consulting Limited. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-cyan-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
