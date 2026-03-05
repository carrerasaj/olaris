'use client'

import { motion } from 'framer-motion'

interface MockupEntranceProps {
  children: React.ReactNode
  className?: string
}

export function MockupEntrance({ children, className }: MockupEntranceProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 60, rotateX: 5 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ perspective: 1000 }}
    >
      {children}
    </motion.div>
  )
}
