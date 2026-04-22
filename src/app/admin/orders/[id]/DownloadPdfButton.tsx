'use client'

import { useState } from 'react'

/**
 * Triggers on-demand PDF generation (if needed) then opens the blob URL
 * in a new tab. The generate helper is idempotent — re-clicking just
 * reuses the existing documents row.
 */
export function DownloadPdfButton({
  ensure,
  orderRef,
}: {
  ensure: () => Promise<{ ok: boolean; url?: string; error?: string }>
  orderRef: string
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setPending(true)
    setError(null)
    try {
      const r = await ensure()
      if (r.ok && r.url) {
        window.open(r.url, '_blank', 'noopener,noreferrer')
      } else {
        setError(r.error ?? 'Could not generate PDF')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="adm-btn adm-btn-ghost"
        onClick={onClick}
        disabled={pending}
        title={`Download signed PDF for ${orderRef}`}
      >
        {pending ? 'Generating…' : 'Download PDF'}
      </button>
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 28,
            zIndex: 100,
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 8,
            fontSize: 13,
            maxWidth: 360,
          }}
        >
          {error}
        </div>
      )}
    </>
  )
}
