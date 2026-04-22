'use client'

/**
 * Long-page single-form order variant (admin-facing).
 * Ported from src/components/mockups/form-variant-a.jsx.
 */

import { useMemo } from 'react'
import {
  Topbar,
  SectionCard,
  Pill,
  OlarisEnvelopeStrip,
  SignatureBlock,
  fmtGBP,
  type Order,
  type OrderSetter,
  type CalcResult,
  type AutosaveState,
} from './shared'
import {
  CustomerSection,
  VehicleSection,
  OptionsSection,
  PartExSection,
  DeliverySection,
  PricingSection,
  FinanceSection,
  AddonsSection,
  DocsSection,
  ConsentSection,
} from './sections'
import './form.css'

interface LongPageFormProps {
  order: Order
  set: OrderSetter
  calc: CalcResult
  saveStatus: AutosaveState['status']
  saveAt: Date | null
  orderRef?: string
  onSendForSignature?: () => void
  onSaveDraft?: () => void
  onDownloadPdf?: () => void
}

const FINANCE_LABELS: Record<Order['financeType'], string> = {
  BCH: 'Business Contract Hire',
  PCH: 'Personal Contract Hire',
  FL: 'Finance Lease',
  HP: 'Hire Purchase',
  CP: 'Contract Purchase',
  OP: 'Outright Purchase',
}

export function LongPageForm({
  order,
  set,
  calc,
  saveStatus,
  saveAt,
  orderRef: orderRefProp,
  onSendForSignature,
  onSaveDraft,
  onDownloadPdf,
}: LongPageFormProps) {
  // In production the ref is server-generated. Fallback to a stable mock only
  // when the caller doesn't supply one (pure preview use).
  const orderRef = useMemo(() => orderRefProp ?? 'OL-2026-04-8F3K', [orderRefProp])
  const partExEnabled = order.partExchange.enabled

  return (
    <div className="ol-form">
      <div className="ol-artboard">
        <Topbar orderRef={orderRef} saveStatus={saveStatus} saveAt={saveAt} />

        <div style={{ padding: '24px 32px 0' }}>
          <div className="ol-banner">
            <div className="ol-banner-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <strong>Quick order — Single page</strong>
              <span>
                Review every section before sending for e-signature. Auto-saves every 30 seconds.
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Pill tone="navy">{FINANCE_LABELS[order.financeType]}</Pill>
              <Pill tone="cyan">{order.vehicle.category}</Pill>
            </div>
          </div>
        </div>

        <div
          className="ol-artboard-inner"
          style={{
            paddingTop: 4,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <div>
            <SectionCard num="01" title="Customer & company" sub="Who this vehicle is being supplied to">
              <CustomerSection order={order} set={set} />
            </SectionCard>

            <SectionCard
              num="02"
              title="Vehicle specification"
              sub="Make, model, derivative, trim"
              right={<Pill tone="cyan">{order.vehicle.make} {order.vehicle.model}</Pill>}
            >
              <VehicleSection order={order} set={set} />
            </SectionCard>

            <SectionCard
              num="03"
              title="Factory options & accessories"
              sub="Itemised extras — VAT applied per line"
              right={
                <span className="ol-mini">
                  {order.options.length} lines · {fmtGBP(calc.optionsNet)} net
                </span>
              }
            >
              <OptionsSection order={order} set={set} />
            </SectionCard>

            {partExEnabled && (
              <SectionCard num="04" title="Part-exchange" sub="Vehicle being traded in (if any)">
                <PartExSection order={order} set={set} />
              </SectionCard>
            )}

            <SectionCard num={partExEnabled ? '05' : '04'} title="Delivery" sub="Where and when we deliver">
              <DeliverySection order={order} set={set} />
            </SectionCard>

            <SectionCard num={partExEnabled ? '06' : '05'} title="Pricing" sub="Net, VAT, VED and on-the-road costs">
              <PricingSection order={order} set={set} calc={calc} />
            </SectionCard>

            <SectionCard num={partExEnabled ? '07' : '06'} title="Finance terms" sub="Term, mileage, monthly rental">
              <FinanceSection order={order} set={set} calc={calc} />
            </SectionCard>

            <SectionCard num={partExEnabled ? '08' : '07'} title="Add-ons & cover" sub="Maintenance, GAP, breakdown, tyres">
              <AddonsSection order={order} set={set} />
            </SectionCard>

            <SectionCard num={partExEnabled ? '09' : '08'} title="Documents" sub="ID, address and income verification">
              <DocsSection />
            </SectionCard>

            <SectionCard num={partExEnabled ? '10' : '09'} title="Consents & disclosures" sub="Terms, FCA, GDPR and marketing">
              <ConsentSection order={order} set={set} />
            </SectionCard>

            <SectionCard
              num={partExEnabled ? '11' : '10'}
              title="E-signature"
              sub="Customer + Olaris representative · Olaris signing envelope"
            >
              <div className="ol-stack" style={{ gap: 16 }}>
                <OlarisEnvelopeStrip envelopeRef={`ENV-${orderRef.slice(-8)}`} recipients={2} />
                <div className="ol-grid ol-grid-2" style={{ gap: 16 }}>
                  <SignatureBlock
                    role="Customer signature · Recipient 1"
                    signer={order.signatures.customer}
                    anchor="\ol:sig1\"
                    onSign={() =>
                      set('signatures.customer', {
                        signed: true,
                        method: 'draw',
                        name: order.customer.firstName + ' ' + order.customer.lastName,
                        signedAt: new Date().toISOString(),
                        ip: null,
                      })
                    }
                  />
                  <SignatureBlock
                    role="Olaris representative · Recipient 2"
                    signer={order.signatures.representative}
                    anchor="\ol:sig2\"
                  />
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--ol-ink-500)',
                    fontFamily: 'var(--ol-font-mono)',
                    lineHeight: 1.6,
                    background: 'var(--ol-ink-50)',
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px dashed var(--ol-line-2)',
                  }}
                >
                  {'// Signature anchors — \\ol:sig1\\, \\ol:date1\\, \\ol:name1\\, \\ol:sig2\\, \\ol:date2\\'}
                  <br />
                  {'// Self-hosted Olaris e-signature · Ed25519 document signing · UK eIDAS SES tier'}
                </div>
              </div>
            </SectionCard>

            <div className="ol-formfooter">
              <div style={{ fontSize: 12, color: 'var(--ol-ink-500)' }}>
                Draft ref{' '}
                <strong className="ol-mono" style={{ color: 'var(--ol-ink-900)' }}>
                  {orderRef}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="ol-btn ol-btn-ghost" onClick={onSaveDraft}>
                  Save draft
                </button>
                <button type="button" className="ol-btn ol-btn-ghost" onClick={onDownloadPdf}>
                  Download PDF
                </button>
                <button
                  type="button"
                  className="ol-btn ol-btn-primary"
                  onClick={onSendForSignature}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  Send for signature
                </button>
              </div>
            </div>
          </div>

          <aside>
            <div className="ol-summary">
              <h3>Order Summary</h3>
              <div className="ol-summary-vehicle">
                {order.vehicle.make} {order.vehicle.model}
              </div>
              <div className="ol-summary-trim">{order.vehicle.derivative}</div>

              <div
                style={{
                  margin: '16px 0 14px',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  border: '1px solid rgba(125,211,252,0.15)',
                }}
              >
                <div className="ol-summary-row" style={{ border: 'none', padding: '4px 0' }}>
                  <span>Customer</span>
                  <span className="v" style={{ fontFamily: 'var(--ol-font-body)' }}>
                    {order.customer.firstName} {order.customer.lastName}
                  </span>
                </div>
                <div className="ol-summary-row" style={{ border: 'none', padding: '4px 0' }}>
                  <span>{order.orderType === 'business' ? 'Company' : 'Email'}</span>
                  <span className="v" style={{ fontFamily: 'var(--ol-font-body)', fontSize: 11.5 }}>
                    {order.orderType === 'business' ? order.customer.company : order.customer.email}
                  </span>
                </div>
              </div>

              <div className="ol-summary-row">
                <span>Vehicle (net − disc)</span>
                <span className="v">{fmtGBP(order.pricing.vehicleNet - order.pricing.discount)}</span>
              </div>
              <div className="ol-summary-row">
                <span>Options ({order.options.length})</span>
                <span className="v">{fmtGBP(calc.optionsNet)}</span>
              </div>
              <div className="ol-summary-row">
                <span>VAT @ {order.pricing.vatRate}%</span>
                <span className="v">{fmtGBP(calc.vat)}</span>
              </div>
              <div className="ol-summary-row">
                <span>VED (first year)</span>
                <span className="v">{fmtGBP(order.pricing.ved)}</span>
              </div>
              <div className="ol-summary-row">
                <span>First reg fee</span>
                <span className="v">{fmtGBP(order.pricing.firstRegFee)}</span>
              </div>
              <div className="ol-summary-row">
                <span>Delivery + plates</span>
                <span className="v">
                  {fmtGBP(order.pricing.deliveryFee + order.pricing.numberPlates)}
                </span>
              </div>

              <div className="ol-summary-total">
                <div className="lbl">Drive-away total</div>
                <div className="amt">{fmtGBP(calc.total)}</div>
              </div>

              {order.financeType !== 'OP' && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    background: 'rgba(34,211,238,0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(125,211,252,0.3)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10.5,
                      color: '#7dd3fc',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Monthly rental
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--ol-font-display)',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fff',
                      marginTop: 2,
                    }}
                  >
                    {fmtGBP(calc.monthlyTotal)}
                    <span
                      style={{
                        fontSize: 11,
                        color: '#7dd3fc',
                        fontWeight: 500,
                        marginLeft: 6,
                      }}
                    >
                      + VAT
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                    {order.finance.term} mo · {order.finance.initialRental}× initial
                  </div>
                </div>
              )}

              <div className="ol-summary-footer">
                Reference{' '}
                <strong style={{ color: '#7dd3fc', fontFamily: 'var(--ol-font-mono)' }}>
                  {orderRef}
                </strong>
                <br />
                Authorised by the FCA · Olaris Consulting Ltd · Charlbury OX7 3EG
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
