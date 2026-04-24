// Shared admin UI fragments that multiple server pages import.

export function SupplierKindPill({ kind }: { kind: string }) {
  const label: Record<string, string> = {
    dealer: 'Dealer',
    broker: 'Broker',
    oem_partner: 'OEM partner',
    importer: 'Importer',
    funder: 'Funder',
  }
  const tone: Record<string, string> = {
    dealer: '#0891b2',
    broker: '#7c3aed',
    oem_partner: '#059669',
    importer: '#b45309',
    funder: '#0b1e3f',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: tone[kind] ?? '#334155',
        background: '#f1f5f9',
        border: `1px solid ${tone[kind] ?? '#cbd5e1'}33`,
      }}
    >
      {label[kind] ?? kind}
    </span>
  )
}


export function OrderStatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partially_signed: 'Part. signed',
    signed: 'Signed',
    confirmed: 'Confirmed',
    on_order: 'On order',
    ready_for_handover: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    cancelled_post_sign: 'Cancelled (post-sign)',
  }
  return (
    <span className={`adm-status adm-status-${status}`}>
      <span className="adm-status-dot" />
      {label[status] ?? status}
    </span>
  )
}

export function SupplierPoStatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    acknowledged: 'Acknowledged',
    cancelled: 'Cancelled',
  }
  const tone: Record<string, { fg: string; bg: string; border: string }> = {
    draft: { fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
    sent: { fg: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' },
    acknowledged: { fg: '#047857', bg: '#d1fae5', border: '#6ee7b7' },
    cancelled: { fg: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  }
  const t = tone[status] ?? { fg: '#334155', bg: '#f1f5f9', border: '#cbd5e1' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.border}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: t.fg,
        }}
      />
      {label[status] ?? status}
    </span>
  )
}

export function QuoteStatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
    converted: 'Converted',
    cancelled: 'Cancelled',
  }
  const tone: Record<string, { fg: string; bg: string; border: string }> = {
    draft: { fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
    sent: { fg: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' },
    viewed: { fg: '#0e7490', bg: '#cffafe', border: '#67e8f9' },
    accepted: { fg: '#047857', bg: '#d1fae5', border: '#6ee7b7' },
    declined: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
    expired: { fg: '#78716c', bg: '#f5f5f4', border: '#d6d3d1' },
    converted: { fg: '#0b1e3f', bg: '#dbeafe', border: '#93c5fd' },
    cancelled: { fg: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  }
  const t = tone[status] ?? { fg: '#334155', bg: '#f1f5f9', border: '#cbd5e1' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.border}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: t.fg,
        }}
      />
      {label[status] ?? status}
    </span>
  )
}

export function auditEventLabel(type: string): string {
  return (
    {
      'customer.created': 'Customer created',
      'customer.updated': 'Customer updated',
      'order.created': 'Order created',
      'order.updated': 'Order updated',
      'order.sent': 'Order sent for signature',
      'order.cancelled': 'Order cancelled',
      'order.delivered': 'Order marked delivered',
      'link.viewed': 'Signing link viewed',
      'otp.requested': 'OTP requested',
      'otp.verified': 'OTP verified',
      'otp.failed': 'OTP failed',
      signed: 'Signature captured',
      'sign.declined': 'Signature declined',
      'pdf.generated': 'PDF generated',
      'pdf.downloaded': 'PDF downloaded',
      'reminder.sent': 'Reminder sent',
      'email.sent': 'Email sent',
      'email.failed': 'Email failed',
      'supplier.created': 'Supplier created',
      'supplier.updated': 'Supplier updated',
      'supplier.deactivated': 'Supplier deactivated',
      'supplier.reactivated': 'Supplier reactivated',
      'order.vehicle_supplier_set': 'Vehicle supplier assigned',
      'order.finance_provider_set': 'Finance provider assigned',
      'order.confirmed': 'Order confirmed by supplier',
      'order.on_order': 'Order placed with supplier',
      'order.ready_for_handover': 'Vehicle ready for handover',
      'order.cancelled_post_sign': 'Order cancelled after signing',
      'order.eta_updated': 'ETA updated',
      'order.chassis_recorded': 'Chassis/VIN recorded',
      'order.reg_recorded': 'Registration plate recorded',
      'order.logistics_updated': 'Logistics details updated',
      'order.status_override': 'Status override (admin)',
      'supplier_po.created': 'Supplier PO drafted',
      'supplier_po.updated': 'Supplier PO updated',
      'supplier_po.sent': 'Supplier PO sent to dealer',
      'supplier_po.acknowledged': 'Supplier PO acknowledged',
      'supplier_po.cancelled': 'Supplier PO cancelled',
      'supplier_po.snapshot_refreshed': 'Supplier PO snapshot refreshed',
      'supplier_po.superseded_by': 'Superseded by new PO',
      'supplier_po.invoice_received': 'Supplier invoice recorded',
      'quote.created': 'Quote created',
      'quote.updated': 'Quote updated',
      'quote.sent': 'Quote sent to customer',
      'quote.viewed': 'Quote viewed by customer',
      'quote.accepted': 'Quote accepted',
      'quote.declined': 'Quote declined',
      'quote.expired': 'Quote expired',
      'quote.converted': 'Quote converted to order',
      'quote.cancelled': 'Quote cancelled',
      'email.suppressed': 'Email suppressed',
      'feedback.requested': 'Feedback requested',
      'feedback.submitted': 'Feedback submitted',
      'feedback.detractor_flagged': 'Detractor flagged for follow-up',
      'handover_pack.generated': 'Handover pack generated',
      'handover_pack.superseded': 'Handover pack superseded',
      'customer.marketing_opt_out_changed': 'Marketing opt-out changed',
    }[type] ?? type
  )
}

/**
 * Coloured pill for an NPS score. Promoter (9–10) green, passive (7–8)
 * amber, detractor (0–6) red. Tiny so it fits inline next to a name.
 */
export function NpsScorePill({ score }: { score: number }) {
  const category =
    score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor'
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    promoter: { bg: '#dcfce7', fg: '#047857', label: 'Promoter' },
    passive: { bg: '#fef3c7', fg: '#78350f', label: 'Passive' },
    detractor: { bg: '#fee2e2', fg: '#b91c1c', label: 'Detractor' },
  }
  const s = styles[category]
  return (
    <span
      title={`NPS ${score} · ${s.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 9px',
        background: s.bg,
        color: s.fg,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {score}
      </span>
      {s.label}
    </span>
  )
}
