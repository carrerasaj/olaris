'use client'

/**
 * Shared supplier create/edit form. Mirrors the CustomerForm pattern.
 */

import { useActionState, useState } from 'react'
import type { ActionResult } from './actions/suppliers'

export interface SupplierFormInitial {
  kind?: 'dealer' | 'broker' | 'oem_partner' | 'importer' | 'funder'
  legalName?: string
  tradingName?: string | null
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string | null
  website?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  addressCity?: string | null
  addressPostcode?: string | null
  addressCountry?: string | null
  notes?: string | null
}

type Action = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>

const KIND_OPTIONS: Array<{ value: NonNullable<SupplierFormInitial['kind']>; label: string; hint: string }> = [
  { value: 'dealer', label: 'Dealer', hint: 'Vehicle source (franchise or independent)' },
  { value: 'broker', label: 'Broker', hint: 'Intermediary sourcing on our behalf' },
  { value: 'oem_partner', label: 'OEM partner', hint: 'Manufacturer-direct supply' },
  { value: 'importer', label: 'Importer', hint: 'Specialist / parallel import' },
  { value: 'funder', label: 'Funder', hint: 'Finance house / lender' },
]

export function SupplierForm({
  action,
  initial,
  submitLabel = 'Save supplier',
}: {
  action: Action
  initial?: SupplierFormInitial
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, null)
  const [kind, setKind] = useState<SupplierFormInitial['kind']>(initial?.kind ?? 'dealer')

  const issues = state?.issues ?? []
  const issueFor = (path: string) => issues.find((i) => i.path === path)?.message

  return (
    <form action={formAction}>
      {state?.error && <div className="adm-flash adm-flash-error">{state.error}</div>}

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Type</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-field">
            <label>Supplier kind</label>
            <select
              name="kind"
              value={kind ?? 'dealer'}
              onChange={(e) => setKind(e.target.value as SupplierFormInitial['kind'])}
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} — {o.hint}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Company</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-form-grid adm-form-grid-2">
            <div className="adm-field">
              <label>Legal name</label>
              <input
                name="legalName"
                defaultValue={initial?.legalName}
                required
              />
              {issueFor('legalName') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{issueFor('legalName')}</div>
              )}
            </div>
            <div className="adm-field">
              <label>Trading name (optional)</label>
              <input
                name="tradingName"
                defaultValue={initial?.tradingName ?? ''}
                placeholder="e.g. Van Choices"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Primary contact</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-form-grid adm-form-grid-3">
            <div className="adm-field">
              <label>Name</label>
              <input
                name="primaryContactName"
                defaultValue={initial?.primaryContactName}
                required
              />
              {issueFor('primaryContactName') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>
                  {issueFor('primaryContactName')}
                </div>
              )}
            </div>
            <div className="adm-field">
              <label>Email</label>
              <input
                name="primaryContactEmail"
                type="email"
                defaultValue={initial?.primaryContactEmail}
                required
              />
              {issueFor('primaryContactEmail') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>
                  {issueFor('primaryContactEmail')}
                </div>
              )}
            </div>
            <div className="adm-field">
              <label>Phone</label>
              <input
                name="primaryContactPhone"
                defaultValue={initial?.primaryContactPhone ?? ''}
              />
            </div>
            <div className="adm-field" style={{ gridColumn: 'span 3' }}>
              <label>Website</label>
              <input
                name="website"
                defaultValue={initial?.website ?? ''}
                placeholder="www.example.com"
              />
              {issueFor('website') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{issueFor('website')}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Address (optional)</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-form-grid adm-form-grid-3">
            <div className="adm-field" style={{ gridColumn: 'span 3' }}>
              <label>Line 1</label>
              <input name="addressLine1" defaultValue={initial?.addressLine1 ?? ''} />
            </div>
            <div className="adm-field" style={{ gridColumn: 'span 3' }}>
              <label>Line 2</label>
              <input name="addressLine2" defaultValue={initial?.addressLine2 ?? ''} />
            </div>
            <div className="adm-field">
              <label>City</label>
              <input name="addressCity" defaultValue={initial?.addressCity ?? ''} />
            </div>
            <div className="adm-field">
              <label>Postcode</label>
              <input
                name="addressPostcode"
                defaultValue={initial?.addressPostcode ?? ''}
              />
              {issueFor('addressPostcode') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>
                  {issueFor('addressPostcode')}
                </div>
              )}
            </div>
            <div className="adm-field">
              <label>Country</label>
              <input
                name="addressCountry"
                defaultValue={initial?.addressCountry ?? 'United Kingdom'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Notes</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-field">
            <label>Internal notes (not shown to customer)</label>
            <textarea name="notes" rows={4} defaultValue={initial?.notes ?? ''} />
          </div>
        </div>
      </div>

      <div className="adm-form-actions">
        <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
