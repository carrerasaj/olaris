'use client'

/**
 * Rep-side signature button + modal. Opens over the order detail page;
 * captures signature (typed/drawn) + intent click, then POSTs via the
 * signAsRep server action passed in as a prop.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignatureCapture, type SignaturePayload } from '../../../sign/SignatureCapture'
import type { OrderActionResult, RepSignInput } from '../../actions/orders'

export function RepSignButton({
  orderId,
  repName,
  onSign,
}: {
  orderId: string
  repName: string
  onSign: (orderId: string, input: RepSignInput) => Promise<OrderActionResult>
}) {
  void orderId // orderId is captured in the bound action but kept here for clarity
  const [open, setOpen] = useState(false)
  const [intent, setIntent] = useState(false)
  const [sig, setSig] = useState<SignaturePayload | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const canSubmit = !!sig && intent && !submitting

  async function submit() {
    if (!sig || !intent) return
    setSubmitting(true)
    setError(null)
    try {
      const r = await onSign(orderId, { signature: sig, intent: true })
      if (r.ok) {
        setOpen(false)
        router.refresh()
      } else {
        setError(r.error ?? 'Could not sign')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className="adm-btn adm-btn-accent" onClick={() => setOpen(true)}>
        Sign as Olaris rep
      </button>

      {open && (
        <div
          onClick={() => !submitting && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11,30,63,.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(11,30,63,.4)',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e4e9f1',
                background: 'linear-gradient(180deg,#fdfefe 0%,#f8fafc 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontFamily: 'Manrope,sans-serif', color: '#0b1e3f' }}>
                Sign as Olaris representative
              </h2>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 20,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  width: 28,
                  height: 28,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 16px', fontSize: 13.5, color: '#334155', lineHeight: 1.55 }}>
                You're signing this order on behalf of Olaris Consulting Ltd. Your signature below
                is captured with the forensic envelope (IP, user-agent, timestamp) and binds Olaris
                to the contract.
              </p>

              <SignatureCapture defaultName={repName} onChange={setSig} />

              <label
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  border: intent ? '1px solid #0b1e3f' : '1px solid #e4e9f1',
                  background: intent ? '#eff3fb' : '#fff',
                  borderRadius: 8,
                  marginTop: 18,
                  cursor: 'pointer',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="checkbox"
                  checked={intent}
                  onChange={(e) => setIntent(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#0b1e3f' }}
                />
                <div>
                  <strong style={{ display: 'block', color: '#0b1e3f', fontWeight: 600, marginBottom: 2 }}>
                    I intend to sign this order on behalf of Olaris Consulting Ltd
                  </strong>
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    This binds Olaris to the commercial terms shown.
                  </span>
                </div>
              </label>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: 8,
                    fontSize: 13,
                    marginTop: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid #e4e9f1',
                }}
              >
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={submit}
                  disabled={!canSubmit}
                >
                  {submitting ? 'Signing…' : 'Confirm signature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
