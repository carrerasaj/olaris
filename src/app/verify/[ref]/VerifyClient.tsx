'use client'

/**
 * Client-side PDF verifier.
 *
 * Drag/drop a PDF → the browser hashes it locally with SubtleCrypto → compare
 * to the recorded SHA-256. Nothing is uploaded. Also exposes the crypto proof
 * so anyone can re-verify the Ed25519 signature over the order's canonical
 * JSON hash themselves, using the public key at /.well-known.
 */

import { useState, type DragEvent } from 'react'

interface Signer {
  role: 'customer' | 'rep'
  name: string
  email: string
  signedAt: string
  ip: string | null
  geo: string | null
  documentSha256: string
  serverSignature: string
  keyFingerprint: string
}

interface View {
  ref: string
  status: string
  createdAt: string
  signedAt: string
  vehicle: string
  totalGBP: string
  customerName: string
  signers: Signer[]
  pdf: { url: string; sha256: string; sizeBytes: number | null } | null
  pubkeyUrl: string
}

type VerifyStatus = 'idle' | 'hashing' | 'match' | 'mismatch' | 'error'

export function VerifyClient({ view }: { view: View }) {
  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  async function handleFile(file: File) {
    setErrorMsg(null)
    setFileName(file.name)
    setStatus('hashing')
    try {
      const buf = await file.arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', buf)
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      setFileHash(hex)
      setStatus(view.pdf && hex === view.pdf.sha256 ? 'match' : 'mismatch')
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Hashing failed')
    }
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const customerSig = view.signers.find((s) => s.role === 'customer')
  const repSig = view.signers.find((s) => s.role === 'rep')

  return (
    <div className="sgn-page">
      <div className="sgn-header">
        <OlarisLogo />
        <div className="tag">Verified signed order</div>
      </div>

      {/* ─── Summary card ─── */}
      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Order {view.ref}</h2>
          <span
            style={{
              background: '#d1fae5',
              color: '#065f46',
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            ✓ {view.status}
          </span>
        </div>
        <div className="sgn-card-body">
          <dl className="sgn-kv">
            <dt>Vehicle</dt>
            <dd>{view.vehicle}</dd>
            <dt>Customer</dt>
            <dd>{view.customerName}</dd>
            <dt>Total</dt>
            <dd className="mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {view.totalGBP}
            </dd>
            <dt>Created</dt>
            <dd>{view.createdAt}</dd>
            <dt>Signed</dt>
            <dd>{view.signedAt}</dd>
          </dl>
        </div>
      </div>

      {/* ─── PDF verify dropzone ─── */}
      {view.pdf && (
        <div className="sgn-card">
          <div className="sgn-card-head">
            <h2 className="sgn-card-title">Verify a downloaded PDF</h2>
          </div>
          <div className="sgn-card-body">
            <p style={{ fontSize: 13, color: '#334155', marginTop: 0, marginBottom: 14, lineHeight: 1.55 }}>
              Drop the signed PDF here to confirm it matches our record. The file is hashed locally
              in your browser — nothing is uploaded.
            </p>

            <label
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              style={{
                display: 'block',
                padding: '28px 20px',
                border: `2px dashed ${dragActive ? '#06b6d4' : '#cbd5e1'}`,
                background: dragActive ? '#ecfeff' : '#f8fafc',
                borderRadius: 10,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background .12s, border-color .12s',
              }}
            >
              <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}>
                <strong>Drag PDF here</strong> or click to choose
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                File stays in your browser — hashed with SubtleCrypto.
              </div>
              <input
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </label>

            {fileName && (
              <div style={{ marginTop: 14, fontSize: 12, color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>{fileName}</strong>
                {status === 'hashing' && ' — hashing…'}
              </div>
            )}

            {status === 'match' && (
              <div
                className="sgn-alert sgn-alert-success"
                style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <strong>Match — this is the officially generated PDF.</strong>
                  <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', color: '#065f46' }}>
                    {fileHash}
                  </div>
                </div>
              </div>
            )}

            {status === 'mismatch' && (
              <div
                className="sgn-alert sgn-alert-error"
                style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <div>
                  <strong>No match — this PDF has been modified or isn't from Olaris.</strong>
                  <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', color: '#991b1b' }}>
                    your file: {fileHash}
                    <br />
                    on record: {view.pdf.sha256}
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="sgn-alert sgn-alert-error" style={{ marginTop: 14 }}>
                Couldn't hash that file{errorMsg ? `: ${errorMsg}` : ''}.
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e4e9f1',
                borderRadius: 8,
                fontSize: 12,
                color: '#334155',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Recorded PDF</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>
                SHA-256: {view.pdf.sha256}
                {view.pdf.sizeBytes != null && (
                  <>
                    <br />
                    Size: {view.pdf.sizeBytes.toLocaleString('en-GB')} bytes
                  </>
                )}
              </div>
              <a
                href={view.pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sgn-btn sgn-btn-ghost"
                style={{ marginTop: 10, padding: '7px 14px', fontSize: 12 }}
              >
                Download this PDF
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Signatures ─── */}
      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Signatures</h2>
        </div>
        <div className="sgn-card-body">
          {customerSig && <SignerRow label="Customer" s={customerSig} />}
          {repSig && <SignerRow label="Olaris representative" s={repSig} />}
        </div>
      </div>

      {/* ─── Cryptographic proof ─── */}
      <div className="sgn-card">
        <div className="sgn-card-head">
          <h2 className="sgn-card-title">Cryptographic proof</h2>
        </div>
        <div className="sgn-card-body">
          <p style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.6, marginTop: 0 }}>
            Each signature binds a SHA-256 hash of the order data at sign time. The hash is then
            signed with our Ed25519 server key. You can verify the signatures yourself using the
            public key we publish at the URL below — no special tooling beyond a standard Ed25519
            verify function.
          </p>

          <ProofRow label="Document SHA-256" value={customerSig?.documentSha256 ?? repSig?.documentSha256 ?? '—'} />
          {customerSig && (
            <ProofRow label="Customer Ed25519 signature" value={customerSig.serverSignature} />
          )}
          {repSig && <ProofRow label="Rep Ed25519 signature" value={repSig.serverSignature} />}
          <ProofRow
            label="Public key fingerprint"
            value={customerSig?.keyFingerprint ?? repSig?.keyFingerprint ?? '—'}
          />
          <div style={{ fontSize: 12, marginTop: 14 }}>
            <a
              href={view.pubkeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0891b2', textDecoration: 'none', fontWeight: 600 }}
            >
              View public key →
            </a>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', marginTop: 18, lineHeight: 1.55 }}>
        If anything on this page doesn't match what you expected, contact{' '}
        <a href="mailto:alan@olaris.co.uk" style={{ color: '#64748b' }}>
          alan@olaris.co.uk
        </a>
        .
      </p>
    </div>
  )
}

function SignerRow({ label, s }: { label: string; s: Signer }) {
  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px dashed #e4e9f1',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <strong style={{ fontFamily: 'Manrope, sans-serif', color: '#0b1e3f', fontSize: 14 }}>
          {label}
        </strong>
        <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, letterSpacing: 0.5 }}>
          ✓ SIGNED
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#334155', marginBottom: 3 }}>{s.name}</div>
      <div style={{ fontSize: 11.5, color: '#64748b' }}>{s.email}</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
        {s.signedAt}
        {s.ip && ` · ${s.ip}`}
        {s.geo && ` · ${s.geo}`}
      </div>
    </div>
  )
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 3 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: '#0f172a',
          wordBreak: 'break-all',
          background: '#f8fafc',
          padding: '8px 10px',
          borderRadius: 4,
          border: '1px solid #e4e9f1',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function OlarisLogo() {
  return (
    <svg viewBox="0 0 300 60" width="132" height="26">
      <defs>
        <linearGradient id="v-arcL" x1="0" y1="10" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="v-arcR" x1="40" y1="10" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M22 6 A20 20 0 0 0 22 50" stroke="url(#v-arcL)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M22 6 A20 20 0 0 1 22 50" stroke="url(#v-arcR)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="28" r="2" fill="#06B6D4" />
      <text x="54" y="38" fontFamily="Manrope, sans-serif" fontSize="30" fontWeight="700" letterSpacing="-0.5" fill="#0b1e3f">Olaris</text>
    </svg>
  )
}
