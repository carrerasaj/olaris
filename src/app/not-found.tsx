'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1a2744]">
      <div className="text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-9xl font-extrabold text-white/10 font-heading">404</h1>
          <h2 className="text-3xl font-bold text-white mt-4 font-heading">Page Not Found</h2>
          <p className="text-olaris-text-secondary mt-4 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild variant="gradient" size="lg">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="secondary-outline" size="lg">
              <Link href="/contact">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
