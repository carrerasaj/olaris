'use client'

/**
 * Two side-by-side pickers on the order detail page:
 *   - Vehicle supplier (dealer / broker / OEM / importer)
 *   - Finance provider (funder)
 *
 * Both are optional. Both use a typeahead <select> backed by the full
 * suppliers list passed in from the server component (<200 suppliers
 * expected for a long time; we render them all, no async search needed).
 *
 * Assigning or clearing each calls its own server action — no "save"
 * button; a change fires immediately. Safe because the actions are
 * idempotent and record audit events regardless.
 */

import { useTransition } from 'react'
import Link from 'next/link'
import type { ActionResult } from '../../actions/suppliers'

interface SupplierOption {
  id: string
  kind: 'dealer' | 'broker' | 'oem_partner' | 'importer' | 'funder'
  displayName: string
  contactName: string
}

export function SupplierSelectors({
  orderId,
  vehicleSuppliers,
  financeProviders,
  assignedVehicleId,
  assignedFinanceId,
  assignVehicle,
  assignFinance,
  assignedVehicleDisplay,
  assignedFinanceDisplay,
}: {
  orderId: string
  vehicleSuppliers: SupplierOption[]
  financeProviders: SupplierOption[]
  assignedVehicleId: string | null
  assignedFinanceId: string | null
  assignedVehicleDisplay: { id: string; name: string; contact: string } | null
  assignedFinanceDisplay: { id: string; name: string; contact: string } | null
  assignVehicle: (supplierId: string | null) => Promise<ActionResult>
  assignFinance: (supplierId: string | null) => Promise<ActionResult>
}) {
  void orderId
  const [pendingVehicle, startVehicleTransition] = useTransition()
  const [pendingFinance, startFinanceTransition] = useTransition()

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <h2 className="adm-card-title">Supplier & finance provider</h2>
      </div>
      <div className="adm-card-body">
        <div className="adm-form-grid adm-form-grid-2" style={{ gap: 20 }}>
          <div className="adm-field">
            <label>Vehicle supplier</label>
            <select
              value={assignedVehicleId ?? ''}
              disabled={pendingVehicle}
              onChange={(e) => {
                const next = e.target.value || null
                startVehicleTransition(async () => {
                  await assignVehicle(next)
                })
              }}
            >
              <option value="">— none —</option>
              {vehicleSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} · {s.kind.replace('_', ' ')}
                </option>
              ))}
            </select>
            {assignedVehicleDisplay && (
              <div style={summaryStyle}>
                <div>
                  <Link
                    href={`/admin/suppliers/${assignedVehicleDisplay.id}`}
                    style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {assignedVehicleDisplay.name}
                  </Link>
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  Contact: {assignedVehicleDisplay.contact}
                </div>
              </div>
            )}
            <div style={hintStyle}>Dealer, broker, OEM partner, or importer.</div>
          </div>

          <div className="adm-field">
            <label>Finance provider (lender)</label>
            <select
              value={assignedFinanceId ?? ''}
              disabled={pendingFinance}
              onChange={(e) => {
                const next = e.target.value || null
                startFinanceTransition(async () => {
                  await assignFinance(next)
                })
              }}
            >
              <option value="">— none / outright purchase —</option>
              {financeProviders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
            {assignedFinanceDisplay && (
              <div style={summaryStyle}>
                <div>
                  <Link
                    href={`/admin/suppliers/${assignedFinanceDisplay.id}`}
                    style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {assignedFinanceDisplay.name}
                  </Link>
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  Contact: {assignedFinanceDisplay.contact}
                </div>
              </div>
            )}
            <div style={hintStyle}>
              Only funders appear here. Olaris is always the broker and never listed.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const summaryStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '10px 12px',
  background: '#f8fafc',
  border: '1px solid #e4e9f1',
  borderRadius: 6,
  fontSize: 13,
}

const hintStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 11.5,
  color: '#64748b',
  lineHeight: 1.4,
}
