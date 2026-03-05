'use client'

import { motion } from 'framer-motion'

export function LogoReveal({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 44 56"
        fill="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="reveal-arc1" x1="0" y1="0" x2="40" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
          <linearGradient id="reveal-arc2" x1="40" y1="0" x2="0" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Left arc — draws in */}
        <motion.path
          d="M22 6 A20 20 0 0 0 22 50"
          stroke="url(#reveal-arc1)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        {/* Right arc — draws in staggered */}
        <motion.path
          d="M22 6 A20 20 0 0 1 22 50"
          stroke="url(#reveal-arc2)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Data points fade in after arcs */}
        <motion.circle
          cx="5" cy="28" r="2" fill="#06B6D4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.8 }}
        />
        <motion.circle
          cx="39" cy="28" r="2" fill="#22D3EE"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.9 }}
        />
        <motion.circle
          cx="22" cy="6" r="2.5" fill="#F1F5F9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.0 }}
        />
        <motion.circle
          cx="22" cy="50" r="2.5" fill="#F1F5F9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.1 }}
        />

        {/* Centre pulse — starts after reveal */}
        <motion.circle
          cx="22" cy="28" r="3.5" fill="#06B6D4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.2 }}
          className="logo-pulse"
        />
        <motion.circle
          cx="22" cy="28" r="2" fill="#06B6D4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.2 }}
        />
      </svg>
    </div>
  )
}
