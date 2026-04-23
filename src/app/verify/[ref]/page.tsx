/**
 * Public verification page. Anyone with an order reference can check:
 *   - The order exists and is signed (status: signed / delivered)
 *   - The signed PDF on record, with its SHA-256
 *   - Both signers' Ed25519 signatures over the canonical order hash
 *   - Links to the published public key and the (downloadable) PDF
 *
 * No auth. The response contains nothing PII-sensitive beyond what's on the
 * printed signed PDF — name, email, IP of signers at sign time.
 *
 * Anyone can verify the document integrity themselves by:
 *   1. Downloading the PDF
 *   2. Computing its SHA-256 locally
 *   3. Comparing to the value on this page
 *   4. Fetching /.well-known/olaris-signing-pubkey.json
 *   5. Running ed25519 verify over the document_sha256 field using the
 *      server_signature and the pubkey
 */

import Link from 'next/link'
import { desc, eq, inArray } from 'drizzle-orm'
import {
  db,
  orders,
  customers,
  signatures,
  documents,
  suppliers,
} from '@/db/client'
import { fmtDateTime, fmtGBPFromPence } from '@/lib/format'
import { mintDownloadToken } from '@/lib/pdf/download-token'
import { VerifyClient } from './VerifyClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  const refNorm = ref.trim().toUpperCase()

  const rows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.ref, refNorm))
    .limit(1)

  if (rows.length === 0) {
    return (
      <div className="sgn-shell">
        <NotFoundCard ref={refNorm} />
      </div>
    )
  }

  const { order, customer } = rows[0]
  const isSigned = order.status === 'signed' || order.status === 'delivered'

  if (!isSigned) {
    return (
      <div className="sgn-shell">
        <NotSignedCard ref={order.ref} status={order.status} />
      </div>
    )
  }

  const [sigs, pdfRow] = await Promise.all([
    db.select().from(signatures).where(eq(signatures.orderId, order.id)),
    db
      .select()
      .from(documents)
      .where(eq(documents.orderId, order.id))
      .orderBy(desc(documents.uploadedAt))
      .limit(1),
  ])

  // Resolve supplier + finance provider names for display. /verify is public
  // so we show the party names but no contact details (those are internal).
  const supplierIds = [order.vehicleSupplierId, order.financeProviderId].filter(
    (x): x is string => !!x,
  )
  const supplierRows =
    supplierIds.length > 0
      ? await db.select().from(suppliers).where(inArray(suppliers.id, supplierIds))
      : []
  const vehicleSupplierName = order.vehicleSupplierId
    ? (() => {
        const s = supplierRows.find((x) => x.id === order.vehicleSupplierId)
        return s ? (s.tradingName ?? s.legalName) : null
      })()
    : null
  const financeProviderName = order.financeProviderId
    ? (() => {
        const s = supplierRows.find((x) => x.id === order.financeProviderId)
        return s ? (s.tradingName ?? s.legalName) : null
      })()
    : null

  const view = {
    ref: order.ref,
    status: order.status,
    createdAt: fmtDateTime(order.createdAt),
    signedAt: order.signedAt ? fmtDateTime(order.signedAt) : '—',
    vehicle: `${order.vehicle.make} ${order.vehicle.model}`,
    totalGBP: fmtGBPFromPence(order.totalAmountPence),
    customerName: `${customer.firstName} ${customer.lastName}`,
    vehicleSupplierName,
    financeProviderName,
    signers: sigs.map((s) => ({
      role: s.signerRole,
      name: s.signerName,
      email: s.signerEmail,
      signedAt: fmtDateTime(s.signedAt),
      ip: s.ip,
      geo: [s.geoCity, s.geoCountry].filter(Boolean).join(', ') || null,
      documentSha256: s.documentSha256,
      serverSignature: s.serverSignature,
      keyFingerprint: s.signingKeyFingerprint,
    })),
    // Private Blob store — the stored `blobUrl` is NOT directly
    // dereferenceable. Route downloads through our redirector, which
    // authenticates the caller and streams the PDF from Blob.
    pdf: pdfRow[0]
      ? {
          url: `/api/orders/${order.id}/pdf?t=${encodeURIComponent(
            mintDownloadToken(order.id),
          )}`,
          sha256: pdfRow[0].sha256,
          sizeBytes: pdfRow[0].sizeBytes,
        }
      : null,
    pubkeyUrl: '/.well-known/olaris-signing-pubkey.json',
  }

  return (
    <div className="sgn-shell">
      <VerifyClient view={view} />
      <Footer />
    </div>
  )
}

function NotFoundCard({ ref }: { ref: string }) {
  return (
    <div className="sgn-empty">
      <div className="sgn-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <h1>Order not found</h1>
      <p>
        No record of order <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{ref}</strong>.
        Check the reference and try again.
      </p>
    </div>
  )
}

function NotSignedCard({ ref, status }: { ref: string; status: string }) {
  return (
    <div className="sgn-empty">
      <div
        className="sgn-empty-icon"
        style={{ background: '#fef3c7', color: '#b45309' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h1>Order not yet signed</h1>
      <p>
        Order <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{ref}</strong> is currently{' '}
        <strong>{status}</strong>. A verification page becomes available once both parties have
        signed.
      </p>
    </div>
  )
}

function Footer() {
  return (
    <div className="sgn-footer">
      Olaris Consulting Ltd · Charlbury OX7 3EG
      <br />
      Authorised and regulated by the FCA ·{' '}
      <Link href="/privacy-policy" style={{ color: '#64748b' }}>
        Privacy
      </Link>{' '}
      ·{' '}
      <Link href="/terms" style={{ color: '#64748b' }}>
        Terms
      </Link>
    </div>
  )
}
