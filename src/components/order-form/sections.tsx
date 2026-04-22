'use client'

/**
 * Reusable section bodies shared by the long-page and wizard variants.
 * Ported from src/components/mockups/form-sections.jsx.
 */

import { useState } from 'react'
import type { Order, OrderSetter, CalcResult } from './shared'
import { Field, MoneyInput, Check, fmtGBP } from './shared'

interface SectionProps {
  order: Order
  set: OrderSetter
}

interface SectionWithCalcProps extends SectionProps {
  calc: CalcResult
}

// ─── Customer & Company ────────────────────────────────────────────────────

export function CustomerSection({ order, set }: SectionProps) {
  const c = order.customer
  return (
    <div className="ol-stack" style={{ gap: 20 }}>
      <div>
        <div className="ol-mini" style={{ marginBottom: 10 }}>
          Order type
        </div>
        <div className="ol-grid ol-grid-2">
          <label className={`ol-radio ${order.orderType === 'business' ? 'is-checked' : ''}`}>
            <input
              type="radio"
              checked={order.orderType === 'business'}
              onChange={() => set('orderType', 'business')}
            />
            <div>
              <strong>Business</strong>
              <span style={{ fontSize: 12, color: 'var(--ol-ink-500)' }}>
                Company / Sole trader · VAT reclaimable
              </span>
            </div>
          </label>
          <label className={`ol-radio ${order.orderType === 'personal' ? 'is-checked' : ''}`}>
            <input
              type="radio"
              checked={order.orderType === 'personal'}
              onChange={() => set('orderType', 'personal')}
            />
            <div>
              <strong>Personal</strong>
              <span style={{ fontSize: 12, color: 'var(--ol-ink-500)' }}>
                Individual · VAT inclusive pricing
              </span>
            </div>
          </label>
        </div>
      </div>

      <div>
        <div className="ol-mini" style={{ marginBottom: 10 }}>
          Contact details
        </div>
        <div className="ol-grid ol-grid-6">
          <Field label="Title" className="ol-col-1">
            <select
              className="ol-select"
              value={c.salutation}
              onChange={(e) => set('customer.salutation', e.target.value)}
            >
              {['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Mx'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="First name" required className="ol-col-2">
            <input
              className="ol-input"
              value={c.firstName}
              onChange={(e) => set('customer.firstName', e.target.value)}
            />
          </Field>
          <Field label="Last name" required className="ol-col-3">
            <input
              className="ol-input"
              value={c.lastName}
              onChange={(e) => set('customer.lastName', e.target.value)}
            />
          </Field>
          <Field label="Email" required className="ol-col-3">
            <input
              className="ol-input"
              value={c.email}
              onChange={(e) => set('customer.email', e.target.value)}
            />
          </Field>
          <Field label="Phone" required className="ol-col-2">
            <input
              className="ol-input"
              value={c.phone}
              onChange={(e) => set('customer.phone', e.target.value)}
            />
          </Field>
          <Field label="Date of birth" className="ol-col-1">
            <input
              className="ol-input"
              type="date"
              value={c.dob}
              onChange={(e) => set('customer.dob', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {order.orderType === 'business' && (
        <div>
          <div className="ol-mini" style={{ marginBottom: 10 }}>
            Company details
          </div>
          <div className="ol-grid ol-grid-6">
            <Field label="Company name" required className="ol-col-3">
              <input
                className="ol-input"
                value={c.company}
                onChange={(e) => set('customer.company', e.target.value)}
              />
            </Field>
            <Field label="Companies House #" className="ol-col-1">
              <input
                className="ol-input ol-mono"
                value={c.companyNumber}
                onChange={(e) => set('customer.companyNumber', e.target.value)}
              />
            </Field>
            <Field label="VAT number" className="ol-col-1">
              <input
                className="ol-input ol-mono"
                value={c.vatNumber}
                onChange={(e) => set('customer.vatNumber', e.target.value)}
              />
            </Field>
            <Field label="Position" className="ol-col-1">
              <input
                className="ol-input"
                value={c.position}
                onChange={(e) => set('customer.position', e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}

      <div>
        <div className="ol-mini" style={{ marginBottom: 10 }}>
          Billing address
        </div>
        <div className="ol-grid ol-grid-6">
          <Field label="Address line" required className="ol-col-4">
            <input
              className="ol-input"
              value={c.billingAddress}
              onChange={(e) => set('customer.billingAddress', e.target.value)}
            />
          </Field>
          <Field label="Town / city" required className="ol-col-2">
            <input
              className="ol-input"
              value={c.billingCity}
              onChange={(e) => set('customer.billingCity', e.target.value)}
            />
          </Field>
          <Field label="Postcode" required className="ol-col-2">
            <input
              className="ol-input ol-mono"
              value={c.billingPostcode}
              onChange={(e) => set('customer.billingPostcode', e.target.value)}
            />
          </Field>
          <Field label="Country" className="ol-col-2">
            <input
              className="ol-input"
              value={c.billingCountry}
              onChange={(e) => set('customer.billingCountry', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Vehicle ───────────────────────────────────────────────────────────────

export function VehicleSection({ order, set }: SectionProps) {
  const v = order.vehicle
  return (
    <div className="ol-stack" style={{ gap: 20 }}>
      <div className="ol-grid ol-grid-4">
        <Field label="Category">
          <select
            className="ol-select"
            value={v.category}
            onChange={(e) => set('vehicle.category', e.target.value)}
          >
            {['Passenger Car', 'Commercial Van', 'Pickup', 'SUV', 'EV'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Make" required>
          <input
            className="ol-input"
            value={v.make}
            onChange={(e) => set('vehicle.make', e.target.value)}
          />
        </Field>
        <Field label="Model" required>
          <input
            className="ol-input"
            value={v.model}
            onChange={(e) => set('vehicle.model', e.target.value)}
          />
        </Field>
        <Field label="Fuel type">
          <select
            className="ol-select"
            value={v.fuel}
            onChange={(e) => set('vehicle.fuel', e.target.value)}
          >
            {['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Derivative / trim" required>
        <input
          className="ol-input"
          value={v.derivative}
          onChange={(e) => set('vehicle.derivative', e.target.value)}
        />
      </Field>
      <div className="ol-grid ol-grid-4">
        <Field label="Transmission">
          <select
            className="ol-select"
            value={v.transmission}
            onChange={(e) => set('vehicle.transmission', e.target.value)}
          >
            {['Manual', 'Automatic', 'DSG', 'CVT'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Exterior colour">
          <input
            className="ol-input"
            value={v.colour}
            onChange={(e) => set('vehicle.colour', e.target.value)}
          />
        </Field>
        <Field label="Interior trim">
          <input
            className="ol-input"
            value={v.trim}
            onChange={(e) => set('vehicle.trim', e.target.value)}
          />
        </Field>
        <Field label="Registration plan">
          <select
            className="ol-select"
            value={v.registration}
            onChange={(e) => set('vehicle.registration', e.target.value)}
          >
            {['New Plate (26-reg)', 'Pre-registered', 'Transfer existing plate', 'Cherished plate'].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </Field>
      </div>
      <div className="ol-grid ol-grid-4">
        <Field label="CO₂ (g/km)" hint="Used for VED band">
          <input
            className="ol-input ol-mono"
            value={v.co2}
            onChange={(e) => set('vehicle.co2', Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Notes for dealer" className="ol-col-3">
          <textarea
            className="ol-textarea"
            rows={1}
            value={order.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. apply dealer pre-delivery inspection, hold delivery until..."
          />
        </Field>
      </div>
    </div>
  )
}

// ─── Options (itemised) ────────────────────────────────────────────────────

export function OptionsSection({ order, set }: SectionProps) {
  const addRow = () => {
    const id = 'opt-' + (order.options.length + 1)
    set('options', [
      ...order.options,
      { id, name: '', sku: '', qty: 1, net: 0, vatRate: 20 },
    ])
  }
  const update = (i: number, patch: Partial<Order['options'][number]>) => {
    const next = order.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o))
    set('options', next)
  }
  const remove = (i: number) =>
    set(
      'options',
      order.options.filter((_, idx) => idx !== i),
    )

  const total = order.options.reduce(
    (s, o) => s + (Number(o.net) || 0) * (Number(o.qty) || 0),
    0,
  )

  return (
    <div className="ol-stack">
      <table className="ol-table">
        <thead>
          <tr>
            <th style={{ width: '45%' }}>Option / Accessory</th>
            <th style={{ width: '14%' }}>Part ref</th>
            <th style={{ width: '8%' }} className="ol-num">Qty</th>
            <th style={{ width: '12%' }} className="ol-num">Net £</th>
            <th style={{ width: '10%' }} className="ol-num">VAT %</th>
            <th style={{ width: '12%' }} className="ol-num">Line total</th>
            <th style={{ width: '4%' }}></th>
          </tr>
        </thead>
        <tbody>
          {order.options.map((o, i) => (
            <tr key={o.id}>
              <td>
                <input
                  className="ol-input"
                  style={{ padding: '6px 10px' }}
                  value={o.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Add option description"
                />
              </td>
              <td>
                <input
                  className="ol-input ol-mono"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  value={o.sku}
                  onChange={(e) => update(i, { sku: e.target.value })}
                />
              </td>
              <td className="ol-num">
                <input
                  type="number"
                  className="ol-input ol-mono"
                  style={{ padding: '6px 10px', textAlign: 'right' }}
                  value={o.qty}
                  onChange={(e) => update(i, { qty: Number(e.target.value) || 0 })}
                />
              </td>
              <td className="ol-num">
                <input
                  type="number"
                  step="0.01"
                  className="ol-input ol-mono"
                  style={{ padding: '6px 10px', textAlign: 'right' }}
                  value={o.net}
                  onChange={(e) => update(i, { net: Number(e.target.value) || 0 })}
                />
              </td>
              <td className="ol-num">
                <select
                  className="ol-select"
                  style={{ padding: '6px 24px 6px 8px', fontSize: 12 }}
                  value={o.vatRate}
                  onChange={(e) => update(i, { vatRate: Number(e.target.value) })}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="20">20%</option>
                </select>
              </td>
              <td className="ol-num ol-mono" style={{ fontWeight: 600 }}>
                {fmtGBP((o.net || 0) * (o.qty || 0))}
              </td>
              <td>
                <button
                  type="button"
                  className="ol-btn ol-btn-ghost ol-btn-sm"
                  style={{ padding: '5px 8px' }}
                  onClick={() => remove(i)}
                  aria-label="Remove line"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={7} style={{ padding: 8 }}>
              <button type="button" className="ol-line-add" onClick={addRow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add factory option or accessory
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
        <div className="ol-mini" style={{ marginRight: 12 }}>
          Options subtotal (net)
        </div>
        <div className="ol-mono" style={{ fontWeight: 700, fontSize: 15 }}>
          {fmtGBP(total)}
        </div>
      </div>
    </div>
  )
}

// ─── Delivery ──────────────────────────────────────────────────────────────

export function DeliverySection({ order, set }: SectionProps) {
  const d = order.delivery
  return (
    <div className="ol-stack" style={{ gap: 20 }}>
      <div className="ol-grid ol-grid-2">
        <Field label="Delivery method">
          <select
            className="ol-select"
            value={d.method}
            onChange={(e) => set('delivery.method', e.target.value)}
          >
            {['Driven to address', 'Transporter delivery', 'Collect from Olaris HQ', 'Collect from dealer'].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </Field>
        <Field label="Preferred date" hint="Subject to build slot confirmation">
          <input
            type="date"
            className="ol-input"
            value={d.preferredDate}
            onChange={(e) => set('delivery.preferredDate', e.target.value)}
          />
        </Field>
      </div>
      <div className="ol-grid ol-grid-6">
        <Field label="Delivery address" required className="ol-col-4">
          <input
            className="ol-input"
            value={d.address}
            onChange={(e) => set('delivery.address', e.target.value)}
          />
        </Field>
        <Field label="Town / city" required className="ol-col-2">
          <input
            className="ol-input"
            value={d.city}
            onChange={(e) => set('delivery.city', e.target.value)}
          />
        </Field>
        <Field label="Postcode" required className="ol-col-2">
          <input
            className="ol-input ol-mono"
            value={d.postcode}
            onChange={(e) => set('delivery.postcode', e.target.value)}
          />
        </Field>
        <Field label="On-site contact" className="ol-col-3">
          <input
            className="ol-input"
            value={d.contact}
            onChange={(e) => set('delivery.contact', e.target.value)}
          />
        </Field>
        <Field label="Contact phone" className="ol-col-3">
          <input
            className="ol-input"
            value={d.contactPhone}
            onChange={(e) => set('delivery.contactPhone', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Delivery notes" hint="Gate codes, access restrictions, timing windows, etc.">
        <textarea
          className="ol-textarea"
          value={d.notes}
          onChange={(e) => set('delivery.notes', e.target.value)}
          rows={2}
        />
      </Field>
    </div>
  )
}

// ─── Finance ───────────────────────────────────────────────────────────────

export function FinanceSection({ order, set, calc }: SectionWithCalcProps) {
  const f = order.finance
  const ft = order.financeType
  return (
    <div className="ol-stack" style={{ gap: 18 }}>
      <div>
        <div className="ol-mini" style={{ marginBottom: 10 }}>
          Finance / purchase type
        </div>
        <div className="ol-grid ol-grid-6">
          {(
            [
              { v: 'BCH', label: 'Business Contract Hire', sub: 'Lease · Business' },
              { v: 'PCH', label: 'Personal Contract Hire', sub: 'Lease · Personal' },
              { v: 'FL', label: 'Finance Lease', sub: 'On balance sheet' },
              { v: 'HP', label: 'Hire Purchase', sub: 'Own at end of term' },
              { v: 'CP', label: 'Contract Purchase', sub: 'Optional balloon' },
              { v: 'OP', label: 'Outright Purchase', sub: 'Buy in full' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.v}
              className={`ol-radio ${ft === opt.v ? 'is-checked' : ''}`}
              style={{ padding: '12px 14px' }}
            >
              <input
                type="radio"
                checked={ft === opt.v}
                onChange={() => set('financeType', opt.v)}
              />
              <div>
                <strong style={{ fontSize: 12.5 }}>{opt.label}</strong>
                <span style={{ fontSize: 11, color: 'var(--ol-ink-500)' }}>{opt.sub}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {ft !== 'OP' && (
        <div className="ol-grid ol-grid-4">
          <Field label="Term" hint="months">
            <input
              type="number"
              className="ol-input ol-mono"
              value={f.term}
              onChange={(e) => set('finance.term', Number(e.target.value))}
            />
          </Field>
          <Field label="Annual mileage" hint="km — applies to lease products">
            <input
              type="number"
              className="ol-input ol-mono"
              value={f.annualMileage}
              onChange={(e) => set('finance.annualMileage', Number(e.target.value))}
            />
          </Field>
          <Field label="Initial rental" hint="× monthly payment">
            <select
              className="ol-select"
              value={f.initialRental}
              onChange={(e) => set('finance.initialRental', Number(e.target.value))}
            >
              {[1, 3, 6, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n} monthly
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monthly rental (net)">
            <MoneyInput
              value={f.monthlyNet}
              onChange={(v) => set('finance.monthlyNet', v)}
            />
          </Field>
          {(ft === 'CP' || ft === 'HP') && (
            <Field label="Optional final payment (balloon)" className="ol-col-2">
              <MoneyInput value={f.balloon} onChange={(v) => set('finance.balloon', v)} />
            </Field>
          )}
        </div>
      )}

      <div
        className="ol-grid ol-grid-3"
        style={{
          background: 'var(--ol-ink-50)',
          borderRadius: 8,
          padding: '14px 18px',
          border: '1px solid var(--ol-line)',
        }}
      >
        <div>
          <div className="ol-mini">Initial payment</div>
          <div
            className="ol-mono"
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--ol-navy-900)' }}
          >
            {fmtGBP(calc.initialPayment)}
          </div>
        </div>
        <div>
          <div className="ol-mini">Monthly (incl. add-ons)</div>
          <div
            className="ol-mono"
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--ol-cyan-600)' }}
          >
            {fmtGBP(calc.monthlyTotal)}{' '}
            <span style={{ fontSize: 11, color: 'var(--ol-ink-500)', fontWeight: 500 }}>
              + VAT
            </span>
          </div>
        </div>
        <div>
          <div className="ol-mini">Total cost over {f.term} months</div>
          <div
            className="ol-mono"
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--ol-navy-900)' }}
          >
            {fmtGBP(calc.totalFinanceCost)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Add-ons ───────────────────────────────────────────────────────────────

export function AddonsSection({ order, set }: SectionProps) {
  const a = order.addons
  return (
    <div className="ol-grid ol-grid-2" style={{ gap: 12 }}>
      <Check
        checked={a.maintenance}
        onChange={(v) => set('addons.maintenance', v)}
        label={`Maintenance package · ${fmtGBP(a.maintenanceMonthly)}/mo`}
        sub="Servicing, MOT, consumables & wear items"
      />
      <Check
        checked={a.tyreCover}
        onChange={(v) => set('addons.tyreCover', v)}
        label={`Tyre cover · ${fmtGBP(a.tyreMonthly)}/mo`}
        sub="Replacement tyres from puncture or kerb damage"
      />
      <Check
        checked={a.breakdown}
        onChange={(v) => set('addons.breakdown', v)}
        label={`European breakdown · ${fmtGBP(a.breakdownMonthly)}/mo`}
        sub="24/7 roadside & recovery (UK + EU)"
      />
      <Check
        checked={a.gap}
        onChange={(v) => set('addons.gap', v)}
        label="GAP insurance · single premium"
        sub="Total loss protection (RTI / Vehicle Replacement)"
      />
    </div>
  )
}

// ─── Part-exchange ─────────────────────────────────────────────────────────

export function PartExSection({ order, set }: SectionProps) {
  const p = order.partExchange
  if (!p.enabled) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ color: 'var(--ol-ink-500)', fontSize: 13, marginBottom: 10 }}>
          No vehicle being part-exchanged.
        </div>
        <button
          type="button"
          className="ol-btn ol-btn-ghost ol-btn-sm"
          onClick={() => set('partExchange.enabled', true)}
        >
          + Add part-exchange vehicle
        </button>
      </div>
    )
  }
  return (
    <div className="ol-stack">
      <div className="ol-grid ol-grid-6">
        <Field label="Registration" required className="ol-col-2">
          <input
            className="ol-input ol-mono"
            value={p.reg}
            onChange={(e) => set('partExchange.reg', e.target.value.toUpperCase())}
            placeholder="AB12 CDE"
          />
        </Field>
        <Field label="Make" className="ol-col-2">
          <input
            className="ol-input"
            value={p.make}
            onChange={(e) => set('partExchange.make', e.target.value)}
          />
        </Field>
        <Field label="Model" className="ol-col-2">
          <input
            className="ol-input"
            value={p.model}
            onChange={(e) => set('partExchange.model', e.target.value)}
          />
        </Field>
        <Field label="Mileage" className="ol-col-2">
          <input
            className="ol-input ol-mono"
            value={p.mileage}
            onChange={(e) => set('partExchange.mileage', e.target.value)}
          />
        </Field>
        <Field label="Condition" className="ol-col-2">
          <select
            className="ol-select"
            value={p.condition}
            onChange={(e) => set('partExchange.condition', e.target.value)}
          >
            {['Excellent', 'Good', 'Fair', 'Poor'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Valuation" className="ol-col-2">
          <MoneyInput
            value={p.valuation}
            onChange={(v) => set('partExchange.valuation', v)}
          />
        </Field>
        <Field label="Outstanding finance" className="ol-col-3">
          <MoneyInput
            value={p.outstandingFinance}
            onChange={(v) => set('partExchange.outstandingFinance', v)}
          />
        </Field>
        <Field label="Settlement due" className="ol-col-3">
          <input
            className="ol-input ol-mono ol-calc"
            readOnly
            value={fmtGBP(Math.max(0, p.outstandingFinance - p.valuation))}
          />
        </Field>
      </div>
      <button
        type="button"
        className="ol-btn ol-btn-ghost ol-btn-sm"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => set('partExchange.enabled', false)}
      >
        Remove part-exchange
      </button>
    </div>
  )
}

// ─── Pricing ───────────────────────────────────────────────────────────────

export function PricingSection({ order, set, calc }: SectionWithCalcProps) {
  const p = order.pricing
  return (
    <div className="ol-stack">
      <div className="ol-grid ol-grid-4">
        <Field label="Vehicle net price" required>
          <MoneyInput value={p.vehicleNet} onChange={(v) => set('pricing.vehicleNet', v)} />
        </Field>
        <Field label="Dealer discount">
          <MoneyInput value={p.discount} onChange={(v) => set('pricing.discount', v)} />
        </Field>
        <Field label="VAT rate" hint="Default 20%">
          <select
            className="ol-select"
            value={p.vatRate}
            onChange={(e) => set('pricing.vatRate', Number(e.target.value))}
          >
            <option value="0">0% — Zero rated</option>
            <option value="5">5% — Reduced</option>
            <option value="20">20% — Standard</option>
          </select>
        </Field>
        <Field label="Vehicle Excise Duty" hint="First-year VED (UK)">
          <MoneyInput value={p.ved} onChange={(v) => set('pricing.ved', v)} />
        </Field>
        <Field label="First registration fee" hint="DVLA £55">
          <MoneyInput value={p.firstRegFee} onChange={(v) => set('pricing.firstRegFee', v)} />
        </Field>
        <Field label="Delivery fee">
          <MoneyInput value={p.deliveryFee} onChange={(v) => set('pricing.deliveryFee', v)} />
        </Field>
        <Field label="Number plates">
          <MoneyInput value={p.numberPlates} onChange={(v) => set('pricing.numberPlates', v)} />
        </Field>
        <Field label="Options subtotal (net)">
          <MoneyInput value={calc.optionsNet} calc readOnly />
        </Field>
      </div>

      <div className="ol-price" style={{ marginTop: 6 }}>
        <div className="ol-price-row">
          <span className="ol-price-label">
            Vehicle net <small>after {fmtGBP(p.discount)} discount</small>
          </span>
          <span className="ol-price-value">{fmtGBP(p.vehicleNet - p.discount)}</span>
        </div>
        <div className="ol-price-row">
          <span className="ol-price-label">
            Factory options <small>{order.options.length} items</small>
          </span>
          <span className="ol-price-value">{fmtGBP(calc.optionsNet)}</span>
        </div>
        <div className="ol-price-row">
          <span className="ol-price-label">
            Subtotal <small>(net)</small>
          </span>
          <span className="ol-price-value">
            <strong>{fmtGBP(calc.netBeforeVat)}</strong>
          </span>
        </div>
        <div className="ol-price-row">
          <span className="ol-price-label">
            VAT <small>@ {p.vatRate}%</small>
          </span>
          <span className="ol-price-value">{fmtGBP(calc.vat)}</span>
        </div>
        <div className="ol-price-row">
          <span className="ol-price-label">
            On-the-road costs <small>VED + first reg + delivery + plates</small>
          </span>
          <span className="ol-price-value">{fmtGBP(calc.onRoad)}</span>
        </div>
        <div className="ol-price-row ol-price-total">
          <span className="ol-price-label">
            Total vehicle price <small>drive-away</small>
          </span>
          <span className="ol-price-value">{fmtGBP(calc.total)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Documents upload (placeholder; real uploads wired in Phase 4) ─────────

export function DocsSection() {
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({
    id: true,
    addr: false,
    finance: false,
  })
  const mk = (k: string, label: string, sub: string) => (
    <label className={`ol-upload ${uploaded[k] ? 'is-uploaded' : ''}`}>
      <div className="ol-upload-icon">
        {uploaded[k] ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        )}
      </div>
      <div className="ol-upload-text">
        <strong>{label}</strong>
        <span>
          {uploaded[k] ? 'drivers-license.pdf · 1.2 MB · verified' : sub}
        </span>
      </div>
      <input
        type="file"
        hidden
        onChange={() => setUploaded((s) => ({ ...s, [k]: !s[k] }))}
      />
    </label>
  )
  return (
    <div className="ol-grid ol-grid-3">
      {mk('id', 'Photo ID', 'Passport or driving licence · PDF/JPG · max 10 MB')}
      {mk('addr', 'Proof of address', 'Utility bill or bank statement, dated within 3 months')}
      {mk('finance', 'Proof of income', "Last 3 months' pay slips / SA302 (finance only)")}
    </div>
  )
}

// ─── Consents ──────────────────────────────────────────────────────────────

export function ConsentSection({ order, set }: SectionProps) {
  const c = order.consent
  return (
    <div className="ol-stack" style={{ gap: 8 }}>
      <Check
        checked={c.terms}
        onChange={(v) => set('consent.terms', v)}
        label="I agree to the Olaris Terms of Business and Order Conditions"
        sub="Full terms available at olaris.co.uk/terms. This includes the right to cancel within 14 days under Consumer Rights Act."
      />
      <Check
        checked={c.fcaDisclosure}
        onChange={(v) => set('consent.fcaDisclosure', v)}
        label="I acknowledge the FCA commission disclosure"
        sub="Olaris Consulting Limited is an Appointed Representative authorised and regulated by the FCA. Full commission disclosure will be provided."
      />
      <Check
        checked={c.gdpr}
        onChange={(v) => set('consent.gdpr', v)}
        label="I consent to my personal data being processed for this order (GDPR)"
        sub="Required to fulfil this contract. See our Privacy Policy for retention details."
      />
      <Check
        checked={c.marketing}
        onChange={(v) => set('consent.marketing', v)}
        label="Send me occasional fleet insights and new vehicle offers"
        sub="Optional. Unsubscribe anytime."
      />
    </div>
  )
}
