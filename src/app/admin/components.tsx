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
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`adm-status adm-status-${status}`}>
      <span className="adm-status-dot" />
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
    }[type] ?? type
  )
}
