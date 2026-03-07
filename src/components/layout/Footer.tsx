import Link from 'next/link'
import { LinkedinIcon, TwitterIcon, Mail, Phone, MapPin } from 'lucide-react'
import { siteConfig } from '@/lib/seo'

function OlarisLogoFull({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 60"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="footer-arc1" x1="0" y1="10" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="footer-arc2" x1="40" y1="10" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M22 6 A20 20 0 0 0 22 50" stroke="url(#footer-arc1)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M22 6 A20 20 0 0 1 22 50" stroke="url(#footer-arc2)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="5" cy="28" r="2" fill="#06B6D4" />
      <circle cx="39" cy="28" r="2" fill="#22D3EE" />
      <circle cx="22" cy="6" r="2.5" fill="#F1F5F9" />
      <circle cx="22" cy="50" r="2.5" fill="#F1F5F9" />
      <circle cx="22" cy="28" r="3.5" fill="#06B6D4" opacity="0.3" />
      <circle cx="22" cy="28" r="2" fill="#06B6D4" />
      <text x="54" y="35" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="30" fontWeight="700" letterSpacing="-0.5" fill="#F1F5F9">Olaris</text>
      <text x="54" y="50" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontSize="9" fontWeight="400" letterSpacing="3" fill="#94A3B8">FLEET INTELLIGENCE</text>
    </svg>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0F172A] border-t border-olaris-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div className="space-y-4">
            <OlarisLogoFull className="h-12 w-auto" />
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

          {/* Newsletter — Beehiiv embed */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">Newsletter</h3>
            <p className="text-sm text-olaris-text-secondary">
              Fleet management insights and industry updates, fortnightly.
            </p>
            <iframe
              src="https://subscribe-forms.beehiiv.com/72d7fe62-5c71-4dec-b1f5-2fbdfefb972b"
              data-test-id="beehiiv-embed"
              style={{
                width: '100%',
                height: '180px',
                backgroundColor: 'transparent',
                border: 'none',
              }}
            />
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
