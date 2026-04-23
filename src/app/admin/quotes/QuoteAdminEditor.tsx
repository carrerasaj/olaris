'use client'

/**
 * Client wrapper for the quote editor. Shares LongPageForm with orders —
 * the underlying jsonb shape is identical — but talks to quote server
 * actions instead. Redirects to /admin/quotes/[id] after create, stays put
 * after edit.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  LongPageForm,
  makeSetter,
  useAutosave,
  useCalc,
  type Order as UiOrder,
} from '@/components/order-form'
import type { QuoteActionResult } from '../actions/quotes'

interface Props {
  initial: UiOrder
  quoteRef?: string
  customerId: string
  companyId: string | null
  onSubmit: (
    ui: UiOrder,
    customerId: string,
    companyId: string | null,
  ) => Promise<QuoteActionResult>
  submitLabel?: string
  redirectOnSuccess?: boolean
}

export function QuoteAdminEditor({
  initial,
  quoteRef,
  customerId,
  companyId,
  onSubmit,
  submitLabel = 'Save quote',
  redirectOnSuccess = false,
}: Props) {
  const [order, setOrder] = useState<UiOrder>(initial)
  const set = makeSetter(order, setOrder)
  const calc = useCalc(order)
  const autosave = useAutosave(order)
  const [pending, startTransition] = useTransition()
  const [flash, setFlash] = useState<
    { kind: 'success' | 'error'; text: string } | null
  >(null)
  const router = useRouter()

  const submit = () =>
    startTransition(async () => {
      setFlash(null)
      const result = await onSubmit(order, customerId, companyId)
      if (result.ok) {
        if (redirectOnSuccess && result.id) {
          router.push(`/admin/quotes/${result.id}`)
        } else {
          setFlash({ kind: 'success', text: 'Saved' })
          setTimeout(() => setFlash(null), 2500)
        }
      } else {
        const issueMsg = result.issues
          ?.slice(0, 3)
          .map((i) => `${i.path}: ${i.message}`)
          .join(' · ')
        setFlash({
          kind: 'error',
          text: result.error ?? issueMsg ?? 'Could not save',
        })
      }
    })

  return (
    <div>
      {flash && (
        <div
          style={{
            position: 'fixed',
            top: 74,
            right: 28,
            zIndex: 100,
            padding: '10px 16px',
            borderRadius: 8,
            background: flash.kind === 'success' ? '#059669' : '#dc2626',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,.15)',
          }}
        >
          {flash.text}
        </div>
      )}
      <LongPageForm
        order={order}
        set={set}
        calc={calc}
        saveStatus={pending ? 'saving' : autosave.status}
        saveAt={autosave.at}
        orderRef={quoteRef}
        onSaveDraft={submit}
        onSendForSignature={submit}
        onDownloadPdf={() => alert('Quotes don’t generate signed PDFs')}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 28px',
          background: '#fff',
          borderTop: '1px solid #e4e9f1',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          zIndex: 50,
          boxShadow: '0 -4px 12px rgba(0,0,0,.04)',
        }}
      >
        <button
          type="button"
          className="adm-btn adm-btn-primary"
          onClick={submit}
          disabled={pending}
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
      <div style={{ height: 60 }} />
    </div>
  )
}
