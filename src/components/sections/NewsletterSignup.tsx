'use client'

import { useRef, useState, useEffect } from 'react'

interface NewsletterSignupProps {
  heading?: string
  subtext?: string
}

export function NewsletterSignup({
  heading = 'Fleet intelligence insights, fortnightly',
  subtext = 'Join UK fleet operators getting industry insights, practical guides, and expert commentary.',
}: NewsletterSignupProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[#0F172A] border-t border-olaris-border-dark py-16 md:py-20"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-3">
          {heading}
        </h2>
        <p className="text-olaris-text-secondary mb-8 max-w-xl mx-auto">
          {subtext}
        </p>
        <div className="flex justify-center" style={{ minHeight: 339 }}>
          {visible && (
            <>
              {/* eslint-disable-next-line @next/next/no-sync-scripts */}
              <script async src="https://subscribe-forms.beehiiv.com/embed.js" />
              <iframe
                src="https://subscribe-forms.beehiiv.com/72d7fe62-5c71-4dec-b1f5-2fbdfefb972b"
                className="beehiiv-embed"
                data-test-id="beehiiv-embed"
                style={{
                  width: '953px',
                  height: '339px',
                  margin: 0,
                  borderRadius: 0,
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  maxWidth: '100%',
                }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
