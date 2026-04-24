'use client'

/**
 * Shared customer create/edit form. Used by /admin/customers/new (no initial)
 * and /admin/customers/[id]/edit (seeded initial). The server action is passed
 * in by the parent — keeps the form body identical between routes.
 */

import { useActionState, useState } from 'react'
import type { ActionResult } from './actions/customers'

export interface CustomerFormInitial {
  type?: 'business' | 'personal'
  salutation?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dob?: string
  position?: string
  companyName?: string
  companiesHouseNumber?: string
  vatNumber?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressPostcode?: string
  addressCountry?: string
  notes?: string
  marketingOptOut?: boolean
}

type Action = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>

export function CustomerForm({
  action,
  initial,
  submitLabel = 'Save customer',
}: {
  action: Action
  initial?: CustomerFormInitial
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, null)
  const [type, setType] = useState<'business' | 'personal'>(initial?.type ?? 'business')

  const issues = state?.issues ?? []
  const issueFor = (path: string) => issues.find((i) => i.path === path)?.message

  return (
    <form action={formAction}>
      {state?.error && <div className="adm-flash adm-flash-error">{state.error}</div>}

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Type & contact</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-form-grid adm-form-grid-2" style={{ marginBottom: 16 }}>
            <div className="adm-field">
              <label>Customer type</label>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'business' | 'personal')}
              >
                <option value="business">Business (company / sole trader)</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div className="adm-field">
              <label>Title</label>
              <select name="salutation" defaultValue={initial?.salutation ?? 'Mr'}>
                {['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Mx'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="adm-form-grid adm-form-grid-3">
            <div className="adm-field">
              <label>First name</label>
              <input
                name="firstName"
                defaultValue={initial?.firstName}
                required
                autoComplete="given-name"
              />
              {issueFor('firstName') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{issueFor('firstName')}</div>
              )}
            </div>
            <div className="adm-field">
              <label>Last name</label>
              <input
                name="lastName"
                defaultValue={initial?.lastName}
                required
                autoComplete="family-name"
              />
              {issueFor('lastName') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{issueFor('lastName')}</div>
              )}
            </div>
            <div className="adm-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                defaultValue={initial?.email}
                required
                autoComplete="email"
              />
              {issueFor('email') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>{issueFor('email')}</div>
              )}
            </div>
            <div className="adm-field">
              <label>Phone</label>
              <input name="phone" defaultValue={initial?.phone} autoComplete="tel" />
            </div>
            <div className="adm-field">
              <label>Date of birth</label>
              <input name="dob" type="date" defaultValue={initial?.dob} />
            </div>
            {type === 'business' && (
              <div className="adm-field">
                <label>Position</label>
                <input name="position" defaultValue={initial?.position} />
              </div>
            )}
          </div>
        </div>
      </div>

      {type === 'business' && (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-card-head">
            <h2 className="adm-card-title">Company</h2>
          </div>
          <div className="adm-card-body">
            <div className="adm-form-grid adm-form-grid-3">
              <div className="adm-field" style={{ gridColumn: 'span 2' }}>
                <label>Company name</label>
                <input name="companyName" defaultValue={initial?.companyName} />
              </div>
              <div className="adm-field">
                <label>Companies House #</label>
                <input
                  name="companiesHouseNumber"
                  defaultValue={initial?.companiesHouseNumber}
                />
              </div>
              <div className="adm-field">
                <label>VAT number</label>
                <input name="vatNumber" defaultValue={initial?.vatNumber} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Billing address</h2>
        </div>
        <div className="adm-card-body">
          <div className="adm-form-grid adm-form-grid-3">
            <div className="adm-field" style={{ gridColumn: 'span 3' }}>
              <label>Address line 1</label>
              <input
                name="addressLine1"
                defaultValue={initial?.addressLine1}
                required
                autoComplete="address-line1"
              />
              {issueFor('billingAddress.line1') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>
                  {issueFor('billingAddress.line1')}
                </div>
              )}
            </div>
            <div className="adm-field" style={{ gridColumn: 'span 3' }}>
              <label>Address line 2 (optional)</label>
              <input
                name="addressLine2"
                defaultValue={initial?.addressLine2}
                autoComplete="address-line2"
              />
            </div>
            <div className="adm-field">
              <label>Town / city</label>
              <input
                name="addressCity"
                defaultValue={initial?.addressCity}
                required
                autoComplete="address-level2"
              />
            </div>
            <div className="adm-field">
              <label>Postcode</label>
              <input
                name="addressPostcode"
                defaultValue={initial?.addressPostcode}
                required
                autoComplete="postal-code"
              />
              {issueFor('billingAddress.postcode') && (
                <div style={{ color: '#dc2626', fontSize: 12 }}>
                  {issueFor('billingAddress.postcode')}
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
            <textarea name="notes" rows={4} defaultValue={initial?.notes} />
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-card-head">
          <h2 className="adm-card-title">Communication preferences</h2>
        </div>
        <div className="adm-card-body">
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              name="marketingOptOut"
              defaultChecked={initial?.marketingOptOut ?? false}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong style={{ fontSize: 13 }}>
                Opt out of optional comms (NPS, referrals)
              </strong>
              <br />
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Service emails — order confirmed, ETA changes, ready for
                handover, delivered — always send regardless of this setting.
              </span>
            </span>
          </label>
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
