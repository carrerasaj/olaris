// Shared admin UI fragments that multiple server pages import.

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
