'use client'

import { useState } from 'react'
import { GradientHero } from '@/components/ui/GradientHero'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin } from 'lucide-react'
import { siteConfig } from '@/lib/seo'
import { track } from '@/lib/analytics'

export default function ContactPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState('submitting')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const response = await fetch('https://formspree.io/f/mqaqazog', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        setFormState('success')

        // Fire events before form.reset() clears the enquiry field.
        const enquiry = String(data.get('enquiry') ?? '')
        track('lead_captured', { source: 'contact' })
        if (enquiry === 'Platform Demo') {
          track('demo_requested', { from_page: '/contact' })
        } else if (
          enquiry === 'Business Contract Hire' ||
          enquiry === 'Salary Sacrifice'
        ) {
          track('quote_requested', {})
        }

        form.reset()
      } else {
        setFormState('error')
      }
    } catch {
      setFormState('error')
    }
  }

  const inputStyles =
    'w-full px-4 py-3 rounded-lg border border-olaris-border-light bg-white text-olaris-text-dark placeholder:text-olaris-text-dark/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm'

  return (
    <>
      <GradientHero
        size="compact"
        title="Let's talk"
        subtitle="No slides, no sales pitch. Tell us what you are dealing with and we will show you what is possible."
        showPattern={false}
      />

      <SectionWrapper variant="light">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            {formState === 'success' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold text-emerald-800 mb-2">
                  Message sent
                </h3>
                <p className="text-emerald-700">
                  Thanks for getting in touch. We will be back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    required
                    className={inputStyles}
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className={inputStyles}
                  />
                </div>
                <input
                  name="company"
                  type="text"
                  placeholder="Company"
                  className={inputStyles}
                />
                <select name="enquiry" className={inputStyles} defaultValue="">
                  <option value="" disabled>Enquiry type</option>
                  <option>Business Contract Hire</option>
                  <option>Salary Sacrifice</option>
                  <option>Platform Demo</option>
                  <option>General Enquiry</option>
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select name="role" className={inputStyles} defaultValue="">
                    <option value="" disabled>Your role</option>
                    <option>Fleet Manager</option>
                    <option>Operations Director</option>
                    <option>Compliance Officer</option>
                    <option>Broker</option>
                    <option>Leasing Executive</option>
                    <option>Other</option>
                  </select>
                  <select name="sector" className={inputStyles} defaultValue="">
                    <option value="" disabled>Your sector</option>
                    <option>Fleet Operations</option>
                    <option>Leasing</option>
                    <option>OEM / Manufacturer</option>
                    <option>Brokerage</option>
                    <option>Insurance</option>
                    <option>Finance</option>
                    <option>Other</option>
                  </select>
                </div>
                <textarea
                  name="message"
                  placeholder="Tell us what you are working on..."
                  rows={5}
                  required
                  className={inputStyles}
                />
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={formState === 'submitting'}
                >
                  {formState === 'submitting' ? 'Sending...' : 'Send Message'}
                </Button>
                {formState === 'error' && (
                  <p className="text-sm text-red-600">
                    Something went wrong. Please try again or email us directly.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold font-heading tracking-tight mb-4">
                We&apos;d rather show you than tell you.
              </h2>
              <p className="text-olaris-text-dark/70 leading-relaxed">
                Book 20 minutes. We will use your data, not a slide deck. No sales pitch —
                just an honest look at what Olaris can do for your specific situation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <Mail className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <div className="text-xs text-olaris-text-dark/50 uppercase tracking-wider">Email</div>
                  <a
                    href={`mailto:${siteConfig.contact.email}`}
                    className="text-olaris-text-dark font-medium hover:text-cyan-600 transition-colors"
                  >
                    {siteConfig.contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <Phone className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <div className="text-xs text-olaris-text-dark/50 uppercase tracking-wider">Phone</div>
                  <a
                    href={`tel:${siteConfig.contact.phone}`}
                    className="text-olaris-text-dark font-medium hover:text-cyan-600 transition-colors"
                  >
                    {siteConfig.contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <MapPin className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <div className="text-xs text-olaris-text-dark/50 uppercase tracking-wider">Address</div>
                  <p className="text-olaris-text-dark font-medium">
                    {siteConfig.contact.address.street}<br />
                    {siteConfig.contact.address.city}, {siteConfig.contact.address.postcode}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-olaris-text-dark/50">
              Or just call for a chat. We are real people, not a call centre.
            </p>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}
