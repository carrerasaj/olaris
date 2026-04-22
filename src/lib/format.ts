// Shared UI formatters. Kept separate from order-form/shared.tsx because
// server components can't import from 'use client' modules.

export function fmtGBPFromPence(pence: number | null | undefined): string {
  const n = Number(pence) || 0
  return (
    '£' +
    (n / 100).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export function fmtGBP(pounds: number | null | undefined): string {
  return (
    '£' +
    (Number(pounds) || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export function poundsToPence(p: number | string): number {
  const n = typeof p === 'string' ? Number(p.replace(/[^\d.-]/g, '')) : p
  return Math.round((Number(n) || 0) * 100)
}

export function penceToPounds(p: number): number {
  return Math.round(p) / 100
}

// Generates a human-readable order ref like OL-2026-04-8F3K.
// Server-only — don't call from the browser. Uses nanoid (crypto-quality),
// avoids ambiguous chars (0/O, 1/I).
export function generateOrderRef(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  // 4-char suffix from an unambiguous alphabet. Collision probability with
  // unique index on orders.ref is effectively zero at our volume; DB will
  // reject any dupe (retry in caller if needed).
  const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const suffix = Array.from(bytes, (b) => ALPH[b % ALPH.length]).join('')
  return `OL-${y}-${m}-${suffix}`
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtRelative(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(date)
}
