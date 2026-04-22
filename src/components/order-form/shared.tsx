'use client'

/**
 * Shared types, pricing math, and UI primitives for the Olaris order form.
 * Ported from src/components/mockups/form-shared.jsx — typed, Tailwind-agnostic,
 * relies on form.css for styling (the ol-* class namespace).
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

// ─── Domain types ───────────────────────────────────────────────────────────

export type OrderType = 'business' | 'personal'
export type FinanceType = 'BCH' | 'PCH' | 'FL' | 'HP' | 'CP' | 'OP'

export interface Customer {
  salutation: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dob: string
  company: string
  companyNumber: string
  vatNumber: string
  position: string
  billingAddress: string
  billingCity: string
  billingPostcode: string
  billingCountry: string
}

export interface Vehicle {
  category: string
  make: string
  model: string
  derivative: string
  fuel: string
  transmission: string
  colour: string
  trim: string
  registration: string
  co2: number
}

export interface OptionLine {
  id: string
  name: string
  sku: string
  qty: number
  net: number
  vatRate: number
}

export interface Delivery {
  method: string
  address: string
  city: string
  postcode: string
  preferredDate: string
  contact: string
  contactPhone: string
  notes: string
}

export interface Pricing {
  vehicleNet: number
  discount: number
  vatRate: number
  ved: number
  firstRegFee: number
  deliveryFee: number
  numberPlates: number
}

export interface Finance {
  term: number
  annualMileage: number
  initialRental: number
  monthlyNet: number
  balloon: number
}

export interface Addons {
  maintenance: boolean
  maintenanceMonthly: number
  gap: boolean
  gapTotal: number
  tyreCover: boolean
  tyreMonthly: number
  breakdown: boolean
  breakdownMonthly: number
}

export interface PartExchange {
  enabled: boolean
  reg: string
  make: string
  model: string
  mileage: string
  condition: string
  valuation: number
  outstandingFinance: number
}

export interface Consent {
  terms: boolean
  gdpr: boolean
  marketing: boolean
  fcaDisclosure: boolean
}

export interface Signer {
  signed: boolean
  method: 'pending' | 'type' | 'draw'
  name: string
  signedAt: string | null
  ip: string | null
}

export interface Signatures {
  customer: Signer
  representative: Signer
}

export interface Order {
  orderType: OrderType
  financeType: FinanceType
  customer: Customer
  vehicle: Vehicle
  options: OptionLine[]
  delivery: Delivery
  pricing: Pricing
  finance: Finance
  addons: Addons
  partExchange: PartExchange
  notes: string
  consent: Consent
  signatures: Signatures
}

export interface CalcResult {
  optionsNet: number
  netBeforeVat: number
  vat: number
  onRoad: number
  total: number
  monthlyAddons: number
  monthlyTotal: number
  initialPayment: number
  totalFinanceCost: number
}

// String-path setter: 'customer.firstName', 'pricing.vehicleNet', etc.
// Keeps the ergonomic mockup API without losing type safety at the call site
// (the leaf value is still typed where the caller uses it).
export type OrderSetter = (path: string, value: unknown) => void

// ─── Helpers ────────────────────────────────────────────────────────────────

export const fmtGBP = (n: number | string | null | undefined): string =>
  '£' +
  (Number(n) || 0).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// ─── Dot-path state helpers ────────────────────────────────────────────────

// Immutable set for 'a.b.c' paths. Used by the form's `set()` callback.
export function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const out: Record<string, unknown> = { ...(obj as Record<string, unknown>) }
  let cur = out
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    cur[k] = { ...(cur[k] as Record<string, unknown>) }
    cur = cur[k] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]] = value
  return out as T
}

export function makeSetter<T extends object>(
  order: T,
  setOrder: (next: T) => void,
): OrderSetter {
  return (path, value) => setOrder(setPath(order, path, value))
}

// ─── Pricing math ──────────────────────────────────────────────────────────

// Empty defaults used when a sub-object is missing on the input — guards
// against partially-hydrated order shapes (e.g. first paint before state
// settles, or malformed server props).
const EMPTY_PRICING: Pricing = {
  vehicleNet: 0,
  discount: 0,
  vatRate: 20,
  ved: 0,
  firstRegFee: 0,
  deliveryFee: 0,
  numberPlates: 0,
}
const EMPTY_ADDONS: Addons = {
  maintenance: false,
  maintenanceMonthly: 0,
  gap: false,
  gapTotal: 0,
  tyreCover: false,
  tyreMonthly: 0,
  breakdown: false,
  breakdownMonthly: 0,
}
const EMPTY_FINANCE: Finance = {
  term: 0,
  annualMileage: 0,
  initialRental: 0,
  monthlyNet: 0,
  balloon: 0,
}

export function useCalc(order: Order): CalcResult {
  return useMemo(() => {
    const p = order.pricing ?? EMPTY_PRICING
    const a = order.addons ?? EMPTY_ADDONS
    const f = order.finance ?? EMPTY_FINANCE
    const options = order.options || []
    const optionsNet = options.reduce(
      (s, o) => s + (Number(o.net) || 0) * (Number(o.qty) || 0),
      0,
    )
    const netBeforeVat = (p.vehicleNet || 0) + optionsNet - (p.discount || 0)
    const vat = (netBeforeVat * (p.vatRate || 0)) / 100
    const onRoad =
      (p.ved || 0) + (p.firstRegFee || 0) + (p.deliveryFee || 0) + (p.numberPlates || 0)
    const total = netBeforeVat + vat + onRoad

    const monthlyAddons =
      (a.maintenance ? a.maintenanceMonthly : 0) +
      (a.tyreCover ? a.tyreMonthly : 0) +
      (a.breakdown ? a.breakdownMonthly : 0)
    const monthlyTotal = (f.monthlyNet || 0) + monthlyAddons
    const initialPayment = (f.monthlyNet || 0) * (f.initialRental || 0)
    const totalFinanceCost =
      initialPayment +
      (f.monthlyNet || 0) * Math.max(0, (f.term || 0) - (f.initialRental || 0)) +
      (f.balloon || 0)

    return {
      optionsNet,
      netBeforeVat,
      vat,
      onRoad,
      total,
      monthlyAddons,
      monthlyTotal,
      initialPayment,
      totalFinanceCost,
    }
  }, [order])
}

// Auto-save indicator. The actual persistence is wired up by the admin page
// (server action); this hook only reflects UI status.
export interface AutosaveState {
  status: 'idle' | 'saving' | 'saved'
  at: Date | null
}

export function useAutosave(order: Order): AutosaveState {
  const [state, setState] = useState<AutosaveState>({ status: 'idle', at: null })
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setState({ status: 'saving', at: null })
    const t = setTimeout(() => setState({ status: 'saved', at: new Date() }), 650)
    return () => clearTimeout(t)
  }, [order])
  return state
}

// ─── Low-level building blocks ─────────────────────────────────────────────

interface FieldProps {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, hint, required, children, className = '' }: FieldProps) {
  return (
    <div className={`ol-field ${className}`}>
      <label className={`ol-label ${required ? 'ol-label-req' : ''}`}>{label}</label>
      {children}
      {hint && <div className="ol-hint">{hint}</div>}
    </div>
  )
}

interface MoneyInputProps {
  value: number | string
  onChange?: (v: number) => void
  placeholder?: string
  readOnly?: boolean
  calc?: boolean
}

export function MoneyInput({ value, onChange, placeholder, readOnly, calc }: MoneyInputProps) {
  return (
    <div className="ol-input-prefix">
      <span className="ol-prefix">£</span>
      <input
        type="text"
        inputMode="decimal"
        className={`ol-input ${calc ? 'ol-calc' : ''} ${readOnly ? 'ol-readonly' : ''}`}
        value={typeof value === 'number' ? value.toFixed(2) : (value ?? '')}
        onChange={(e) =>
          onChange && onChange(Number(e.target.value.replace(/[^\d.]/g, '')) || 0)
        }
        placeholder={placeholder || '0.00'}
        readOnly={readOnly}
      />
    </div>
  )
}

interface SegOption {
  value: string
  label: string
}

interface SegControlProps {
  value: string
  onChange: (v: string) => void
  options: SegOption[]
}

export function SegControl({ value, onChange, options }: SegControlProps) {
  return (
    <div className="ol-segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface CheckProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sub?: string
}

export function Check({ checked, onChange, label, sub }: CheckProps) {
  return (
    <label className={`ol-check ${checked ? 'is-checked' : ''}`}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <strong>{label}</strong>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--ol-ink-500)', marginTop: 2 }}>{sub}</div>
        )}
      </div>
    </label>
  )
}

interface SectionCardProps {
  num?: string
  title: string
  sub?: string
  right?: ReactNode
  children: ReactNode
}

export function SectionCard({ num, title, sub, right, children }: SectionCardProps) {
  return (
    <section className="ol-section">
      <div className="ol-accent-bar" />
      <header className="ol-section-head">
        <div className="ol-section-head-left">
          {num && <div className="ol-step-num">{num}</div>}
          <div>
            <h2 className="ol-section-title">{title}</h2>
            {sub && <div className="ol-section-sub">{sub}</div>}
          </div>
        </div>
        {right}
      </header>
      <div className="ol-section-body">{children}</div>
    </section>
  )
}

interface PillProps {
  tone?: 'cyan' | 'navy' | 'amber' | 'green'
  children: ReactNode
  icon?: ReactNode
}

export function Pill({ tone = 'cyan', children, icon }: PillProps) {
  return (
    <span className={`ol-pill ol-pill-${tone}`}>
      {icon}
      {children}
    </span>
  )
}

interface TopbarProps {
  orderRef: string
  saveStatus: AutosaveState['status']
  saveAt: Date | null
}

export function Topbar({ orderRef, saveStatus, saveAt }: TopbarProps) {
  const status =
    saveStatus === 'saving'
      ? 'Saving draft…'
      : saveStatus === 'saved' && saveAt
        ? `Draft auto-saved · ${saveAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
        : 'Ready'
  return (
    <div className="ol-topbar">
      <div className="ol-topbar-left">
        <svg viewBox="0 0 300 60" width="132" height="26">
          <defs>
            <linearGradient id="ob-arcL" x1="0" y1="10" x2="40" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id="ob-arcR" x1="40" y1="10" x2="0" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <path d="M22 6 A20 20 0 0 0 22 50" stroke="url(#ob-arcL)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M22 6 A20 20 0 0 1 22 50" stroke="url(#ob-arcR)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="5" cy="28" r="2" fill="#06B6D4" />
          <circle cx="39" cy="28" r="2" fill="#22D3EE" />
          <circle cx="22" cy="6" r="2.5" fill="#F1F5F9" />
          <circle cx="22" cy="50" r="2.5" fill="#F1F5F9" />
          <circle cx="22" cy="28" r="3.5" fill="#06B6D4" opacity="0.3" />
          <circle cx="22" cy="28" r="2" fill="#06B6D4" />
          <text x="54" y="35" fontFamily="Manrope, Inter, sans-serif" fontSize="30" fontWeight="700" letterSpacing="-0.5" fill="#F1F5F9">Olaris</text>
          <text x="54" y="50" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="400" letterSpacing="3" fill="#94A3B8">FLEET INTELLIGENCE</text>
        </svg>
        <div>
          <h1>Vehicle Order Form</h1>
          <div className="ol-sub">Olaris Consulting Ltd · Fleet Desk</div>
        </div>
      </div>
      <div className="ol-topbar-right">
        <div className="ol-saved">
          <span className="ol-saved-dot" />
          <span>{status}</span>
        </div>
        <div className="ol-ref">{orderRef}</div>
      </div>
    </div>
  )
}

// Placeholder banner for the future real Olaris signing flow. Phase 4 replaces
// this with live signing state from the DB (token expiry, party-by-party sig
// status). Keep visual parity with the mockup for now.
interface OlarisEnvelopeStripProps {
  envelopeRef: string
  recipients?: number
}

export function OlarisEnvelopeStrip({ envelopeRef, recipients = 2 }: OlarisEnvelopeStripProps) {
  return (
    <div className="ol-ds-frame">
      <div className="ol-ds-toolbar" style={{ background: '#06B6D4', color: '#fff' }}>
        <div className="ol-ds-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#fff" />
            <path d="M6 8l3 6 9-10" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span>Olaris e-Signature · Envelope prepared</span>
          <span className="ol-ds-badge" style={{ color: '#0891B2' }}>{envelopeRef}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600 }}>Awaiting customer signature</span>
      </div>
      <div className="ol-ds-body" style={{ background: '#ecfeff' }}>
        <div>
          <strong>{recipients} recipients</strong> · Routing order: Customer → Olaris Representative
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="ol-btn ol-btn-ghost ol-btn-sm">Preview envelope</button>
          <button type="button" className="ol-btn ol-btn-accent ol-btn-sm">Send envelope</button>
        </div>
      </div>
    </div>
  )
}

interface SignatureBlockProps {
  role: string
  signer: Signer
  onSign?: () => void
  anchor?: string
}

export function SignatureBlock({ role, signer, onSign, anchor }: SignatureBlockProps) {
  return (
    <div className="ol-sigblock">
      <div className="ol-sigblock-head">
        <span className="ol-sigblock-role">{role}</span>
        {signer.signed ? (
          <Pill tone="green" icon={<Dot color="#059669" />}>Signed</Pill>
        ) : (
          anchor && <span className="ol-ds-anchor">{anchor}</span>
        )}
      </div>
      <div className="ol-sigblock-pad">
        {signer.signed ? (
          <div className="ol-sigblock-signed">{signer.name}</div>
        ) : (
          <button type="button" className="ol-btn ol-btn-accent" onClick={onSign} style={{ marginTop: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            Click to sign here
          </button>
        )}
      </div>
      <div className="ol-sigblock-meta">
        <div>
          Name <strong>{signer.name || '—'}</strong>
        </div>
        <div>
          Signed at{' '}
          <strong>
            {signer.signedAt ? new Date(signer.signedAt).toLocaleString('en-GB') : '—'}
          </strong>
        </div>
        <div>
          IP <strong>{signer.ip || '—'}</strong>
        </div>
      </div>
    </div>
  )
}

export function Dot({ color = '#059669' }: { color?: string }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        background: color,
        display: 'inline-block',
      }}
    />
  )
}
