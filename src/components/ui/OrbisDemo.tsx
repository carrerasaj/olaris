'use client'

import { motion } from 'framer-motion'

export function OrbisDemo() {
  return (
    <section className="relative bg-gradient-to-b from-[#0F172A] to-olaris-dark py-8 md:py-12 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Browser chrome wrapper */}
          <div className="rounded-xl border border-olaris-border-dark bg-[#161b22] shadow-2xl shadow-black/40 overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0d1117] border-b border-olaris-border-dark">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-olaris-text-secondary/60 font-mono">
                  app.orbis.io
                </span>
              </div>
              <div className="w-[52px]" /> {/* Balance the dots */}
            </div>

            {/* Iframe */}
            <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                src="/videos/orbis-demo-promo.html"
                className="absolute inset-0 w-full h-full"
                title="Orbis Fleet Intelligence — Platform Demo"
                loading="lazy"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
