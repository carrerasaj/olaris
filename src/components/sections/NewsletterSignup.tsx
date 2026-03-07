import Script from 'next/script'

interface NewsletterSignupProps {
  heading?: string
  subtext?: string
}

export function NewsletterSignup({
  heading = 'Fleet intelligence insights, fortnightly',
  subtext = 'Join UK fleet operators getting industry insights, practical guides, and expert commentary.',
}: NewsletterSignupProps) {
  return (
    <section className="bg-[#0F172A] border-t border-olaris-border-dark py-16 md:py-20">
      <Script
        src="https://subscribe-forms.beehiiv.com/embed.js"
        strategy="lazyOnload"
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-white mb-3">
          {heading}
        </h2>
        <p className="text-olaris-text-secondary mb-8 max-w-xl mx-auto">
          {subtext}
        </p>
        <div className="flex justify-center">
          <iframe
            src="https://subscribe-forms.beehiiv.com/72d7fe62-5c71-4dec-b1f5-2fbdfefb972b"
            className="beehiiv-embed"
            data-test-id="beehiiv-embed"
            frameBorder={0}
            scrolling="no"
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
        </div>
      </div>
    </section>
  )
}
