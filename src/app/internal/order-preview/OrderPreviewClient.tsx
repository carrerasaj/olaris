'use client'

import { useState } from 'react'
import {
  DEFAULT_ORDER,
  LongPageForm,
  WizardForm,
  makeSetter,
  useAutosave,
  useCalc,
  type Order,
} from '@/components/order-form'

type Variant = 'long' | 'wizard'

export function OrderPreviewClient() {
  const [variant, setVariant] = useState<Variant>('wizard')
  const [order, setOrder] = useState<Order>(DEFAULT_ORDER)
  const calc = useCalc(order)
  const autosave = useAutosave(order)
  const set = makeSetter(order, setOrder)

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#0b1e3f',
          color: '#fff',
          padding: '6px 6px 6px 14px',
          borderRadius: 999,
          fontSize: 12,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 24px rgba(11,30,63,.3)',
        }}
      >
        <span style={{ opacity: 0.7 }}>Internal preview · Phase 3 port</span>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.08)', borderRadius: 999, padding: 2 }}>
          <button
            type="button"
            onClick={() => setVariant('wizard')}
            style={{
              border: 'none',
              background: variant === 'wizard' ? '#06B6D4' : 'transparent',
              color: '#fff',
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Wizard (customer)
          </button>
          <button
            type="button"
            onClick={() => setVariant('long')}
            style={{
              border: 'none',
              background: variant === 'long' ? '#06B6D4' : 'transparent',
              color: '#fff',
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Long page (admin)
          </button>
        </div>
      </div>

      {variant === 'long' ? (
        <LongPageForm
          order={order}
          set={set}
          calc={calc}
          saveStatus={autosave.status}
          saveAt={autosave.at}
        />
      ) : (
        <WizardForm
          order={order}
          set={set}
          calc={calc}
          saveStatus={autosave.status}
          saveAt={autosave.at}
        />
      )}
    </div>
  )
}
