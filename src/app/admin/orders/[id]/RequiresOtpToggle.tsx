'use client'

/**
 * Per-order toggle for whether the customer's signing flow includes an
 * email OTP step. Visible only on draft orders (the underlying server
 * action also enforces this). Posts to a server action on change; no
 * intermediate "save" button — the toggle IS the save.
 *
 * Default visual state: off (single-step SES). Help text explains the
 * trade-off so Alan doesn't have to remember when to flip it.
 */

import { useState, useTransition } from 'react'

interface Props {
  orderId: string
  initial: boolean
  setRequiresOtp: (
    orderId: string,
    requiresOtp: boolean,
  ) => Promise<{ ok: boolean; error?: string }>
}

export function RequiresOtpToggle({ orderId, initial, setRequiresOtp }: Props) {
  const [enabled, setEnabled] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onToggle() {
    const next = !enabled
    setEnabled(next) // optimistic
    setError(null)
    startTransition(async () => {
      const r = await setRequiresOtp(orderId, next)
      if (!r.ok) {
        setEnabled(!next) // revert
        setError(r.error ?? 'Could not update')
      }
    })
  }

  return (
    <div
      style={{
        border: '1px solid #e4e9f1',
        borderRadius: 8,
        padding: '12px 14px',
        background: '#fafbfc',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        disabled={pending}
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 36,
          height: 20,
          borderRadius: 10,
          border: 'none',
          background: enabled ? '#0b1e3f' : '#cbd5e1',
          position: 'relative',
          cursor: pending ? 'wait' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: enabled ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: '#fff',
            transition: 'left 0.15s',
          }}
        />
      </button>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
        <div style={{ fontWeight: 600, color: '#0b1e3f', marginBottom: 2 }}>
          Require email OTP at signing
        </div>
        <div style={{ color: '#64748b' }}>
          Default off. Customer signs in one step from the email link (UK SES — sufficient for B2B contract hire).
          Turn on for high-value or unfamiliar counterparties to add a 6-digit email code step.
        </div>
        {error && (
          <div style={{ color: '#b91c1c', marginTop: 6 }}>{error}</div>
        )}
      </div>
    </div>
  )
}
