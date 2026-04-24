/**
 * Delivery lifecycle card for the order detail page.
 *
 * Shown once the order has been signed. Renders:
 *   1. Status pill
 *   2. Logistics summary block (PO, VIN, ETA, reg, handover location)
 *   3. Next-step transition form (only the valid next action is visible)
 *   4. ETA banner (red if past)
 *   5. Inline logistics edit form
 *   6. Post-sign cancel form (destructive)
 *   7. Admin override disclosure (closed by default)
 *
 * Actions are passed in as pre-bound server-action functions so this
 * component stays a pure RSC with no 'use client' overhead.
 */

import { fmtDate, fmtDateTime } from '@/lib/format'
import { OrderStatusPill } from '../../components'
import type { Order } from '@/db/schema'

interface DeliveryCardProps {
  order: Order
  actions: {
    confirm: (formData: FormData) => Promise<void>
    onOrder: (formData: FormData) => Promise<void>
    readyForHandover: (formData: FormData) => Promise<void>
    deliver: (formData: FormData) => Promise<void>
    updateLogistics: (formData: FormData) => Promise<void>
    cancelPostSign: (formData: FormData) => Promise<void>
    override: (formData: FormData) => Promise<void>
  }
}

export function DeliveryCard({ order, actions }: DeliveryCardProps) {
  const status = order.status
  const isPostSign = [
    'signed',
    'confirmed',
    'on_order',
    'ready_for_handover',
    'delivered',
    'cancelled_post_sign',
  ].includes(status)
  if (!isPostSign) return null

  const isTerminal =
    status === 'delivered' || status === 'cancelled_post_sign'
  const canEditLogistics =
    status === 'confirmed' ||
    status === 'on_order' ||
    status === 'ready_for_handover'

  const etaPast =
    order.estimatedDeliveryDate &&
    !isTerminal &&
    new Date(order.estimatedDeliveryDate) < new Date()

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-card-head">
        <h2 className="adm-card-title">Delivery</h2>
        <OrderStatusPill status={status} />
      </div>
      <div className="adm-card-body">
        {/* ── Logistics summary block ────────────────────────── */}
        <LogisticsSummary order={order} />

        {/* ── ETA banner ─────────────────────────────────────── */}
        {order.estimatedDeliveryDate && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 13,
              background: etaPast ? '#fee2e2' : '#eff6ff',
              border: etaPast ? '1px solid #fca5a5' : '1px solid #bfdbfe',
              color: etaPast ? '#991b1b' : '#0b1e3f',
            }}
          >
            {etaPast ? '⚠ ETA past: ' : 'ETA: '}
            <strong>{fmtDate(order.estimatedDeliveryDate)}</strong>
            {etaPast && ' — update or escalate.'}
          </div>
        )}

        {/* ── Forward-transition form (only the next valid step) ── */}
        {!isTerminal && (
          <div style={{ marginTop: 18 }}>
            {status === 'signed' && (
              <TransitionForm action={actions.confirm} label="Mark confirmed">
                <DateOrPoFields />
              </TransitionForm>
            )}
            {status === 'confirmed' && (
              <TransitionForm action={actions.onOrder} label="Mark on order">
                <EtaField defaultValue={order.estimatedDeliveryDate ?? ''} />
              </TransitionForm>
            )}
            {status === 'on_order' && (
              <TransitionForm
                action={actions.readyForHandover}
                label="Mark ready for handover"
              >
                <LogisticsFields order={order} />
              </TransitionForm>
            )}
            {status === 'ready_for_handover' && (
              <TransitionForm action={actions.deliver} label="Mark delivered">
                <ActualDeliveryDateField />
              </TransitionForm>
            )}
          </div>
        )}

        {/* ── Logistics inline edit ──────────────────────────── */}
        {canEditLogistics && (
          <details style={{ marginTop: 18 }}>
            <summary style={styles.summary}>
              Edit logistics (VIN, reg, PO, handover)
            </summary>
            <form action={actions.updateLogistics} style={styles.form}>
              <FullLogisticsFields order={order} />
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e4e9f1',
                  borderRadius: 6,
                  fontSize: 12.5,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    name="forceCustomerEmail"
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <strong>Email customer about this update</strong>
                    <br />
                    <span style={{ color: '#64748b' }}>
                      Force-sends an ETA-changed email even if the drift is
                      within the 7-day threshold. Requires a reason below.
                    </span>
                  </span>
                </label>
                <div
                  className="adm-field"
                  style={{ marginTop: 8, marginBottom: 0 }}
                >
                  <label style={{ fontSize: 11, textTransform: 'uppercase' }}>
                    Reason (used if forcing)
                  </label>
                  <input
                    name="forceCustomerEmailReason"
                    placeholder="e.g. customer called to ask"
                  />
                </div>
              </div>
              <div style={styles.actions}>
                <button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">
                  Save logistics
                </button>
              </div>
            </form>
          </details>
        )}

        {/* ── Post-sign cancel ───────────────────────────────── */}
        {!isTerminal && (
          <details style={{ marginTop: 18 }}>
            <summary style={{ ...styles.summary, color: '#b91c1c' }}>
              Cancel after signing
            </summary>
            <form action={actions.cancelPostSign} style={styles.form}>
              <div className="adm-field">
                <label>Reason (required, min 5 chars)</label>
                <textarea
                  name="reason"
                  rows={3}
                  required
                  minLength={5}
                  placeholder="Why is this being cancelled post-sign?"
                />
              </div>
              <div style={styles.actions}>
                <button type="submit" className="adm-btn adm-btn-danger adm-btn-sm">
                  Confirm cancel
                </button>
              </div>
            </form>
          </details>
        )}

        {/* ── Admin override ─────────────────────────────────── */}
        {!isTerminal && (
          <details style={{ marginTop: 18 }}>
            <summary style={{ ...styles.summary, color: '#64748b' }}>
              Admin override (backfill / recovery)
            </summary>
            <p style={styles.note}>
              Jump to any later stage without going through each transition.
              Writes a single audit event; skipped stamps are filled with now.
              Use sparingly — the step-by-step flow is the happy path.
            </p>
            <form action={actions.override} style={styles.form}>
              <div className="adm-form-grid adm-form-grid-2">
                <div className="adm-field">
                  <label>Target status</label>
                  <select name="targetStatus" defaultValue="confirmed">
                    <option value="confirmed">Confirmed</option>
                    <option value="on_order">On order</option>
                    <option value="ready_for_handover">Ready for handover</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled_post_sign">
                      Cancelled (post-sign)
                    </option>
                  </select>
                </div>
                <div className="adm-field">
                  <label>Reason (required, min 5 chars)</label>
                  <input
                    name="reason"
                    required
                    minLength={5}
                    placeholder="e.g. historical backfill for legacy deal"
                  />
                </div>
              </div>
              <div style={styles.actions}>
                <button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm">
                  Override status
                </button>
              </div>
            </form>
          </details>
        )}

        {/* ── Stamp timeline (compact) ───────────────────────── */}
        <Stamps order={order} />
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function LogisticsSummary({ order }: { order: Order }) {
  const items: Array<[string, string | null]> = [
    ['PO number', order.supplierPoNumber ?? null],
    ['Supplier ref', order.supplierOrderRef ?? null],
    ['ETA', order.estimatedDeliveryDate ? fmtDate(order.estimatedDeliveryDate) : null],
    ['Chassis / VIN', order.chassisNumber ?? null],
    ['Registration', order.registrationPlate ?? null],
    ['Handover at', order.handoverLocation ?? null],
  ]
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        padding: 12,
        background: '#f8fafc',
        border: '1px solid #e4e9f1',
        borderRadius: 6,
      }}
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <div
            style={{
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              fontWeight: 700,
              color: '#64748b',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 13,
              marginTop: 2,
              color: value ? '#0f172a' : '#cbd5e1',
              fontFamily: value ? undefined : undefined,
            }}
          >
            {value ?? '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

function TransitionForm({
  action,
  label,
  children,
}: {
  action: (fd: FormData) => Promise<void>
  label: string
  children: React.ReactNode
}) {
  return (
    <form action={action} style={styles.form}>
      {children}
      <div className="adm-field" style={{ marginTop: 10 }}>
        <label>Note (optional)</label>
        <input name="note" placeholder="Any relevant context for this step" />
      </div>
      <div style={styles.actions}>
        <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm">
          {label}
        </button>
      </div>
    </form>
  )
}

function DateOrPoFields() {
  return (
    <div className="adm-form-grid adm-form-grid-2">
      <div className="adm-field">
        <label>Supplier PO number</label>
        <input name="supplierPoNumber" placeholder="e.g. PO-2026-0421" />
      </div>
      <EtaField />
    </div>
  )
}

function EtaField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="adm-field">
      <label>Estimated delivery date</label>
      <input
        name="estimatedDeliveryDate"
        type="date"
        defaultValue={defaultValue}
      />
    </div>
  )
}

function ActualDeliveryDateField() {
  return (
    <div className="adm-field">
      <label>Actual delivery date</label>
      <input
        name="actualDeliveryDate"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
      />
    </div>
  )
}

function LogisticsFields({ order }: { order: Order }) {
  return (
    <div className="adm-form-grid adm-form-grid-2">
      <div className="adm-field">
        <label>Chassis / VIN</label>
        <input
          name="chassisNumber"
          defaultValue={order.chassisNumber ?? ''}
          placeholder="17-char VIN"
        />
      </div>
      <div className="adm-field">
        <label>Registration plate</label>
        <input
          name="registrationPlate"
          defaultValue={order.registrationPlate ?? ''}
          placeholder="e.g. AB12 CDE"
        />
      </div>
      <div className="adm-field">
        <label>Handover location</label>
        <input
          name="handoverLocation"
          defaultValue={order.handoverLocation ?? ''}
          placeholder="Customer address / dealer site / etc."
        />
      </div>
      <div className="adm-field">
        <label>Handover notes</label>
        <input
          name="handoverNotes"
          defaultValue={order.handoverNotes ?? ''}
          placeholder="Time window, contact on the day, etc."
        />
      </div>
    </div>
  )
}

function FullLogisticsFields({ order }: { order: Order }) {
  return (
    <div className="adm-form-grid adm-form-grid-2">
      <div className="adm-field">
        <label>Supplier PO number</label>
        <input
          name="supplierPoNumber"
          defaultValue={order.supplierPoNumber ?? ''}
        />
      </div>
      <div className="adm-field">
        <label>Supplier order ref</label>
        <input
          name="supplierOrderRef"
          defaultValue={order.supplierOrderRef ?? ''}
        />
      </div>
      <div className="adm-field">
        <label>ETA</label>
        <input
          name="estimatedDeliveryDate"
          type="date"
          defaultValue={order.estimatedDeliveryDate ?? ''}
        />
      </div>
      <div className="adm-field">
        <label>Chassis / VIN</label>
        <input name="chassisNumber" defaultValue={order.chassisNumber ?? ''} />
      </div>
      <div className="adm-field">
        <label>Registration</label>
        <input
          name="registrationPlate"
          defaultValue={order.registrationPlate ?? ''}
        />
      </div>
      <div className="adm-field">
        <label>Handover location</label>
        <input
          name="handoverLocation"
          defaultValue={order.handoverLocation ?? ''}
        />
      </div>
      <div className="adm-field" style={{ gridColumn: 'span 2' }}>
        <label>Handover notes</label>
        <textarea
          name="handoverNotes"
          rows={2}
          defaultValue={order.handoverNotes ?? ''}
        />
      </div>
    </div>
  )
}

function Stamps({ order }: { order: Order }) {
  const entries: Array<[string, Date | null]> = [
    ['Signed', order.signedAt],
    ['Confirmed', order.confirmedAt],
    ['On order', order.onOrderAt],
    ['Ready', order.readyForHandoverAt],
    ['Delivered', order.deliveredAt],
    ['Cancelled (post-sign)', order.cancelledPostSignAt],
  ].filter(([, d]) => !!d) as Array<[string, Date]>
  if (entries.length === 0) return null
  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 12,
        borderTop: '1px solid #e4e9f1',
        fontSize: 12,
        color: '#64748b',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
      }}
    >
      {entries.map(([label, when]) => (
        <span key={label}>
          <strong style={{ color: '#334155' }}>{label}:</strong>{' '}
          {fmtDateTime(when)}
        </span>
      ))}
    </div>
  )
}

const styles = {
  summary: {
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#0b1e3f',
    padding: '8px 0',
  },
  form: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e4e9f1',
  },
  actions: {
    marginTop: 12,
    textAlign: 'right' as const,
  },
  note: {
    fontSize: 12,
    color: '#64748b',
    margin: '6px 0 10px',
    lineHeight: 1.5,
  },
}
