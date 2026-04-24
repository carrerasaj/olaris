/**
 * Transactional email templates for Olaris.
 *
 * Each exported function returns { subject, html, text } ready to hand to
 * sendEmail(). Templates are plain HTML with inline styles — no React
 * Email dependency. They're simple enough not to warrant one.
 *
 * Style: white card on navy background, Inter/Manrope fonts, cyan accent.
 * Mirrors the admin sign-in email for visual continuity.
 */

interface OrderSentInput {
  customerFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  totalGBP: string
  signingUrl: string
  expiresAt: Date
}

export function orderSentEmail(input: OrderSentInput) {
  const expiry = input.expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return {
    subject: `Your Olaris order is ready to review and sign — ${input.orderRef}`,
    html: cardTemplate(`
      <h1 style="${H1}">Ready for your signature</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Your order for the <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>
        is ready for you to review and sign.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Order reference</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.orderRef)}</td></tr>
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Drive-away total</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:15px;color:#0b1e3f;font-weight:700;border-top:1px solid #e4e9f1">${escapeHtml(input.totalGBP)}</td></tr>
      </table>
      <div style="text-align:center;margin:28px 0">
        <a href="${input.signingUrl}" style="${BTN}">Review & sign order</a>
      </div>
      <p style="${SMALL}">
        This link expires on <strong>${expiry}</strong> and can only be used once.
        If you didn't expect this email, please ignore it.
      </p>
      <p style="${SMALL}">
        Any questions? Just reply to this email.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

Your order for the ${input.vehicleMake} ${input.vehicleModel} is ready for you to review and sign.

Order reference: ${input.orderRef}
Drive-away total: ${input.totalGBP}

Review and sign: ${input.signingUrl}

This link expires on ${expiry} and can only be used once.

Any questions? Just reply to this email.

— Olaris Consulting Ltd`,
  }
}

interface OtpInput {
  code: string
  customerFirstName: string
  orderRef: string
}

export function otpEmail(input: OtpInput) {
  return {
    subject: `Your Olaris verification code: ${input.code}`,
    html: cardTemplate(`
      <h1 style="${H1}">Your verification code</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Use this code to finish signing your order
        <strong style="font-family:'JetBrains Mono',monospace">${escapeHtml(input.orderRef)}</strong>:
      </p>
      <div style="text-align:center;margin:28px 0">
        <div style="display:inline-block;font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;letter-spacing:0.2em;color:#0b1e3f;background:#ecfeff;border:2px solid #06b6d4;border-radius:10px;padding:18px 28px">${escapeHtml(input.code)}</div>
      </div>
      <p style="${SMALL}">
        This code expires in <strong>10 minutes</strong>. If you didn't request it, someone may be trying to sign into your order — please contact us.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

Your Olaris verification code for order ${input.orderRef} is:

  ${input.code}

This code expires in 10 minutes. If you didn't request it, please contact us.

— Olaris Consulting Ltd`,
  }
}

interface QuoteSentInput {
  customerFirstName: string
  quoteRef: string
  vehicleMake: string
  vehicleModel: string
  totalGBP: string
  monthlyGBP: string | null
  viewUrl: string
  expiresAt: Date
}

export function quoteSentEmail(input: QuoteSentInput) {
  const expiry = input.expiresAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const monthlyRow = input.monthlyGBP
    ? `<tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Monthly</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:15px;color:#0b1e3f;font-weight:700;border-top:1px solid #e4e9f1">${escapeHtml(input.monthlyGBP)}</td></tr>`
    : ''
  return {
    subject: `Your Olaris quote — ${input.vehicleMake} ${input.vehicleModel} (${input.quoteRef})`,
    html: cardTemplate(`
      <h1 style="${H1}">Your quote is ready</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Thanks for your interest. Here's your quote for the
        <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>.
        Full breakdown at the link below.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Quote reference</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.quoteRef)}</td></tr>
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Drive-away total</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:15px;color:#0b1e3f;font-weight:700;border-top:1px solid #e4e9f1">${escapeHtml(input.totalGBP)}</td></tr>
        ${monthlyRow}
      </table>
      <div style="text-align:center;margin:28px 0">
        <a href="${input.viewUrl}" style="${BTN}">View your quote</a>
      </div>
      <p style="${SMALL}">
        This quote is valid until <strong>${expiry}</strong>. To accept it, just reply to
        this email or give us a call — we'll prepare the order for signing.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

Thanks for your interest. Here's your quote for the ${input.vehicleMake} ${input.vehicleModel}.

Quote reference: ${input.quoteRef}
Drive-away total: ${input.totalGBP}${input.monthlyGBP ? `\nMonthly: ${input.monthlyGBP}` : ''}

View your quote: ${input.viewUrl}

This quote is valid until ${expiry}. To accept it, just reply to this email or give us a call — we'll prepare the order for signing.

— Olaris Consulting Ltd`,
  }
}

// ─── Phase 12 — customer delivery lifecycle ─────────────────────────────

interface OrderConfirmedInput {
  customerFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  etaLabel: string | null // pre-formatted date string or null
}

export function orderConfirmedEmail(input: OrderConfirmedInput) {
  const etaRow = input.etaLabel
    ? `<tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Estimated delivery</td><td style="padding:14px 18px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #e4e9f1">${escapeHtml(input.etaLabel)}</td></tr>`
    : ''
  return {
    subject: `Your order has been placed with the dealer — ${input.orderRef}`,
    html: cardTemplate(`
      <h1 style="${H1}">Your order is confirmed with the dealer</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Good news — your <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>
        has been placed with the supplier and the order is now in progress.
        We'll keep you updated as it moves through build and delivery.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Order reference</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.orderRef)}</td></tr>
        ${etaRow}
      </table>
      <p style="${SMALL}">
        Any questions, just reply to this email.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

Your ${input.vehicleMake} ${input.vehicleModel} has been placed with the supplier and the order is now in progress.

Order reference: ${input.orderRef}${input.etaLabel ? `\nEstimated delivery: ${input.etaLabel}` : ''}

We'll keep you updated as it moves through build and delivery.

— Olaris Consulting Ltd`,
  }
}

interface OrderEtaChangedInput {
  customerFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  previousEtaLabel: string | null
  newEtaLabel: string
}

export function orderEtaChangedEmail(input: OrderEtaChangedInput) {
  return {
    subject: `Updated ETA for your order — ${input.orderRef}`,
    html: cardTemplate(`
      <h1 style="${H1}">Updated delivery estimate</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        The supplier has updated the expected delivery for your
        <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Order</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.orderRef)}</td></tr>
        ${input.previousEtaLabel ? `<tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Previous ETA</td><td style="padding:14px 18px;text-align:right;font-size:13px;color:#475569;border-top:1px solid #e4e9f1"><s>${escapeHtml(input.previousEtaLabel)}</s></td></tr>` : ''}
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">New ETA</td><td style="padding:14px 18px;text-align:right;font-size:15px;color:#0b1e3f;font-weight:700;border-top:1px solid #e4e9f1">${escapeHtml(input.newEtaLabel)}</td></tr>
      </table>
      <p style="${SMALL}">
        Any questions, just reply to this email.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

The supplier has updated the expected delivery for your ${input.vehicleMake} ${input.vehicleModel}.

Order: ${input.orderRef}${input.previousEtaLabel ? `\nPrevious ETA: ${input.previousEtaLabel}` : ''}
New ETA: ${input.newEtaLabel}

Any questions, just reply to this email.

— Olaris Consulting Ltd`,
  }
}

interface OrderReadyForHandoverInput {
  customerFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  handoverLocation: string | null
  etaLabel: string | null
}

export function orderReadyForHandoverEmail(input: OrderReadyForHandoverInput) {
  const handoverRow = input.handoverLocation
    ? `<tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Handover at</td><td style="padding:14px 18px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #e4e9f1">${escapeHtml(input.handoverLocation)}</td></tr>`
    : ''
  const etaRow = input.etaLabel
    ? `<tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Expected</td><td style="padding:14px 18px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #e4e9f1">${escapeHtml(input.etaLabel)}</td></tr>`
    : ''
  return {
    subject: `Your ${input.vehicleMake} ${input.vehicleModel} is ready for handover — ${input.orderRef}`,
    html: cardTemplate(`
      <h1 style="${H1}">Ready for handover</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Your <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>
        has arrived and is being prepared for handover. We'll be in touch
        shortly to confirm the exact time.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Order</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.orderRef)}</td></tr>
        ${handoverRow}
        ${etaRow}
      </table>
    `),
    text: `Hi ${input.customerFirstName},

Your ${input.vehicleMake} ${input.vehicleModel} has arrived and is being prepared for handover. We'll be in touch shortly to confirm the exact time.

Order: ${input.orderRef}${input.handoverLocation ? `\nHandover at: ${input.handoverLocation}` : ''}${input.etaLabel ? `\nExpected: ${input.etaLabel}` : ''}

— Olaris Consulting Ltd`,
  }
}

interface OrderDeliveredInput {
  customerFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  registrationPlate: string | null
  handoverPackUrl: string | null
  verifyUrl: string
}

export function orderDeliveredEmail(input: OrderDeliveredInput) {
  const packRow = input.handoverPackUrl
    ? `<div style="text-align:center;margin:24px 0"><a href="${input.handoverPackUrl}" style="${BTN}">Download handover pack</a></div>`
    : ''
  return {
    subject: `Welcome to your ${input.vehicleMake} ${input.vehicleModel}`,
    html: cardTemplate(`
      <div style="text-align:center;margin-bottom:18px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:24px;background:#d1fae5;color:#059669">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>
      <h1 style="${H1};text-align:center">Delivered</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Welcome to your new <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>${input.registrationPlate ? ` <span style="font-family:'JetBrains Mono',monospace">(${escapeHtml(input.registrationPlate)})</span>` : ''}.
        Thanks for trusting us with the order.
      </p>
      ${packRow}
      <p style="${SMALL}">
        Your signed order remains available at
        <a href="${input.verifyUrl}" style="color:#0b1e3f">${escapeHtml(input.verifyUrl)}</a>.
        If anything needs attention, reply to this email.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

Welcome to your new ${input.vehicleMake} ${input.vehicleModel}${input.registrationPlate ? ` (${input.registrationPlate})` : ''}. Thanks for trusting us with the order.

${input.handoverPackUrl ? `Download your handover pack: ${input.handoverPackUrl}\n\n` : ''}Your signed order remains available at: ${input.verifyUrl}

If anything needs attention, reply to this email.

— Olaris Consulting Ltd`,
  }
}

interface NpsRequestInput {
  customerFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  feedbackUrl: string
}

export function npsRequestEmail(input: NpsRequestInput) {
  return {
    subject: `How was your experience with Olaris?`,
    html: cardTemplate(`
      <h1 style="${H1}">Quick feedback — 30 seconds</h1>
      <p style="${P}">Hi ${escapeHtml(input.customerFirstName)},</p>
      <p style="${P}">
        Now that you've had your <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong>
        for a couple of days, we'd really value your feedback on the order
        experience with Olaris — it takes about 30 seconds.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${input.feedbackUrl}" style="${BTN}">Give feedback</a>
      </div>
      <p style="${SMALL}">
        It's a single 0–10 rating plus an optional comment. Order
        <strong style="font-family:'JetBrains Mono',monospace">${escapeHtml(input.orderRef)}</strong>.
      </p>
    `),
    text: `Hi ${input.customerFirstName},

Now that you've had your ${input.vehicleMake} ${input.vehicleModel} for a couple of days, we'd really value your feedback on the order experience with Olaris. It takes about 30 seconds — a single 0–10 rating plus an optional comment.

Feedback: ${input.feedbackUrl}

Order: ${input.orderRef}

— Olaris Consulting Ltd`,
  }
}

interface SupplierPoInput {
  supplierContactName: string
  supplierTradingName: string
  poRef: string
  customerOrderRef: string
  vehicleMake: string
  vehicleModel: string
  vehicleDerivative: string
  purchaseTotalGBP: string
  etaRequested: string | null
  notesToSupplier: string | null
  replyToEmail: string
}

export function supplierPoEmail(input: SupplierPoInput) {
  const notesBlock = input.notesToSupplier
    ? `<div style="padding:14px 16px;background:#f8fafc;border-left:3px solid #06b6d4;border-radius:4px;margin:18px 0"><div style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:6px">Notes from Olaris</div><div style="font-size:13px;color:#0f172a;line-height:1.5;white-space:pre-wrap">${escapeHtml(input.notesToSupplier)}</div></div>`
    : ''
  const etaBlock = input.etaRequested
    ? `<tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Requested delivery</td><td style="padding:14px 18px;text-align:right;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #e4e9f1">${escapeHtml(input.etaRequested)}</td></tr>`
    : ''
  return {
    subject: `Purchase order ${input.poRef} — ${input.vehicleMake} ${input.vehicleModel}`,
    html: cardTemplate(`
      <h1 style="${H1}">Purchase order attached</h1>
      <p style="${P}">Hi ${escapeHtml(input.supplierContactName)},</p>
      <p style="${P}">
        Please find attached our purchase order for a
        <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}${input.vehicleDerivative ? ' ' + escapeHtml(input.vehicleDerivative) : ''}</strong>
        on behalf of our customer.
      </p>
      <p style="${P}">
        We've also attached the customer's signed order for your records — this is
        the legally-executed contract between Olaris and the end customer.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">PO reference</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.poRef)}</td></tr>
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Customer order ref</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #e4e9f1">${escapeHtml(input.customerOrderRef)}</td></tr>
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Purchase total (inc. VAT)</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:15px;color:#0b1e3f;font-weight:700;border-top:1px solid #e4e9f1">${escapeHtml(input.purchaseTotalGBP)}</td></tr>
        ${etaBlock}
      </table>
      ${notesBlock}
      <p style="${SMALL}">
        Please reply to this email to acknowledge and share your PO reference
        + confirmed ETA. Any queries to <a href="mailto:${escapeHtml(input.replyToEmail)}" style="color:#0b1e3f">${escapeHtml(input.replyToEmail)}</a>.
      </p>
    `),
    text: `Hi ${input.supplierContactName},

Please find attached our purchase order for a ${input.vehicleMake} ${input.vehicleModel}${input.vehicleDerivative ? ' ' + input.vehicleDerivative : ''} on behalf of our customer.

PO reference: ${input.poRef}
Customer order ref: ${input.customerOrderRef}
Purchase total (inc. VAT): ${input.purchaseTotalGBP}${input.etaRequested ? `\nRequested delivery: ${input.etaRequested}` : ''}${input.notesToSupplier ? `\n\nNotes:\n${input.notesToSupplier}` : ''}

We've also attached the customer's signed order for your records.

Please reply to this email with your PO reference and confirmed ETA.

— Olaris Consulting Ltd`,
  }
}

interface OrderSignedInput {
  recipientFirstName: string
  orderRef: string
  vehicleMake: string
  vehicleModel: string
  totalGBP: string
  verifyUrl: string
}

export function orderSignedEmail(input: OrderSignedInput) {
  return {
    subject: `Order ${input.orderRef} — fully executed`,
    html: cardTemplate(`
      <div style="text-align:center;margin-bottom:18px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:24px;background:#d1fae5;color:#059669">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>
      <h1 style="${H1};text-align:center">Order signed and complete</h1>
      <p style="${P}">Hi ${escapeHtml(input.recipientFirstName)},</p>
      <p style="${P}">
        Your order for the <strong>${escapeHtml(input.vehicleMake)} ${escapeHtml(input.vehicleModel)}</strong> has been fully signed by both parties.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;background:#f8fafc;border-radius:6px">
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Order reference</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:13px;color:#0f172a;font-weight:600">${escapeHtml(input.orderRef)}</td></tr>
        <tr><td style="padding:14px 18px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;border-top:1px solid #e4e9f1">Total</td><td style="padding:14px 18px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:15px;color:#0b1e3f;font-weight:700;border-top:1px solid #e4e9f1">${escapeHtml(input.totalGBP)}</td></tr>
      </table>
      <p style="${P}">
        You can independently verify this signed order at any time using the public verification page:
      </p>
      <div style="text-align:center;margin:20px 0">
        <a href="${input.verifyUrl}" style="${BTN_GHOST}">Verify the signed order</a>
      </div>
      <p style="${SMALL}">
        We'll be in touch shortly with next steps.
      </p>
    `),
    text: `Hi ${input.recipientFirstName},

Your order for the ${input.vehicleMake} ${input.vehicleModel} has been fully signed by both parties.

Order reference: ${input.orderRef}
Total: ${input.totalGBP}

Verify the signed order: ${input.verifyUrl}

We'll be in touch shortly with next steps.

— Olaris Consulting Ltd`,
  }
}

interface DeclinedInput {
  customerName: string
  orderRef: string
  reason: string
  adminUrl: string
}

export function signDeclinedEmail(input: DeclinedInput) {
  return {
    subject: `Order ${input.orderRef} declined by customer`,
    html: cardTemplate(`
      <h1 style="${H1}">Customer declined to sign</h1>
      <p style="${P}">
        <strong>${escapeHtml(input.customerName)}</strong> declined to sign order
        <strong style="font-family:'JetBrains Mono',monospace">${escapeHtml(input.orderRef)}</strong>.
      </p>
      <div style="padding:14px 16px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px;margin:18px 0">
        <div style="font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;margin-bottom:6px">Reason</div>
        <div style="font-size:13px;color:#0f172a;line-height:1.5;white-space:pre-wrap">${escapeHtml(input.reason || '(none provided)')}</div>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${input.adminUrl}" style="${BTN}">View order in admin</a>
      </div>
    `),
    text: `${input.customerName} declined to sign order ${input.orderRef}.

Reason: ${input.reason || '(none provided)'}

View in admin: ${input.adminUrl}`,
  }
}

// ─── shared bits ────────────────────────────────────────────────────────

const H1 =
  'font-family:Manrope,-apple-system,sans-serif;font-size:20px;font-weight:700;color:#0b1e3f;margin:0 0 14px;letter-spacing:-0.01em'
const P =
  'font-family:Inter,-apple-system,sans-serif;font-size:14px;color:#334155;line-height:1.55;margin:0 0 14px'
const SMALL =
  'font-family:Inter,-apple-system,sans-serif;font-size:12px;color:#64748b;line-height:1.55;margin:18px 0 0'
const BTN =
  'display:inline-block;background:#0b1e3f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-family:Inter,-apple-system,sans-serif;font-weight:600;font-size:14px'
const BTN_GHOST =
  'display:inline-block;background:#fff;color:#0b1e3f;text-decoration:none;padding:10px 22px;border-radius:6px;font-family:Inter,-apple-system,sans-serif;font-weight:600;font-size:13px;border:1px solid #cbd5e1'

function cardTemplate(inner: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Inter,-apple-system,sans-serif">
  <table cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e4e9f1;border-radius:10px;overflow:hidden">
    <tr><td style="padding:24px 32px;border-bottom:1px solid #e4e9f1;background:linear-gradient(180deg,#fdfefe 0%,#f8fafc 100%)">
      <div style="font-family:Manrope,sans-serif;font-size:20px;font-weight:700;color:#0b1e3f;letter-spacing:-0.01em">Olaris</div>
      <div style="font-size:10px;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;margin-top:2px;font-weight:600">Fleet Intelligence</div>
    </td></tr>
    <tr><td style="padding:28px 32px">
      ${inner}
    </td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #e4e9f1;background:#f8fafc;font-size:11px;color:#94a3b8;font-family:Inter,-apple-system,sans-serif;line-height:1.5">
      Olaris Consulting Ltd · Charlbury OX7 3EG · Authorised and regulated by the FCA
    </td></tr>
  </table>
</body></html>`
}

// HTML-entity escape to avoid injection in templated fields (customer names,
// free-text reasons, etc. are interpolated). Keep minimal — just the five
// characters that can break HTML context.
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
