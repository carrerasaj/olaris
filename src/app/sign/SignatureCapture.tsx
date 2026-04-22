'use client'

/**
 * Signature capture — typed or drawn. Emits a unified payload:
 *   { type: 'typed', data: string }  — the full name the signer typed
 *   { type: 'drawn', data: string }  — base64 PNG of the canvas contents
 *
 * Parent owns the "committed" signature (passed back via onChange). Parent
 * decides when to render this vs. a read-only preview; we just emit.
 */

import { useEffect, useRef, useState } from 'react'

export type SignaturePayload =
  | { type: 'typed'; data: string }
  | { type: 'drawn'; data: string }

type Tab = 'typed' | 'drawn'

interface Props {
  defaultName?: string
  onChange: (payload: SignaturePayload | null) => void
}

export function SignatureCapture({ defaultName = '', onChange }: Props) {
  const [tab, setTab] = useState<Tab>('typed')
  const [typedName, setTypedName] = useState(defaultName)

  // When tab or typed name changes, push up the current payload. This keeps
  // the parent's "signature data" in sync with whatever tab is active.
  useEffect(() => {
    if (tab === 'typed') {
      onChange(typedName.trim() ? { type: 'typed', data: typedName.trim() } : null)
    }
    // drawn tab's onChange is wired up inside the canvas component below
  }, [tab, typedName, onChange])

  return (
    <div>
      <div role="tablist" aria-label="Signature method" style={tabRowStyle}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'typed'}
          onClick={() => setTab('typed')}
          style={tabStyle(tab === 'typed')}
        >
          Type it
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'drawn'}
          onClick={() => setTab('drawn')}
          style={tabStyle(tab === 'drawn')}
        >
          Draw it
        </button>
      </div>

      {tab === 'typed' && (
        <div>
          <label htmlFor="sig-typed" style={labelStyle}>
            Your full legal name
          </label>
          <input
            id="sig-typed"
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="First and last name"
            autoComplete="name"
            style={inputStyle}
          />
          <div style={previewStyle}>
            {typedName.trim() ? (
              <span style={cursiveStyle}>{typedName.trim()}</span>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                Your signature will appear here
              </span>
            )}
          </div>
          <p style={helperStyle}>
            By typing your name, you're applying your signature electronically.
            This is legally binding under the UK Electronic Communications Act 2000.
          </p>
        </div>
      )}

      {tab === 'drawn' && <DrawnSignature onChange={(payload) => onChange(payload)} />}
    </div>
  )
}

// Canvas-based drawn-signature pad. 500x160 logical, scaled to devicePixelRatio.
function DrawnSignature({
  onChange,
}: {
  onChange: (payload: SignaturePayload | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<{ x: number; y: number } | null>(null)
  const hasDrawnRef = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    c.width = rect.width * dpr
    c.height = rect.height * dpr
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0b1e3f'
    ctx.lineWidth = 2
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current
    if (!c) return { x: 0, y: 0 }
    const rect = c.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current
    if (!c) return
    c.setPointerCapture(e.pointerId)
    drawingRef.current = true
    lastRef.current = getPoint(e)
    hasDrawnRef.current = true
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx || !lastRef.current) return
    const p = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastRef.current.x, lastRef.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastRef.current = p
  }

  const end = () => {
    drawingRef.current = false
    lastRef.current = null
    const c = canvasRef.current
    if (!c || !hasDrawnRef.current) return
    onChange({ type: 'drawn', data: c.toDataURL('image/png') })
  }

  const clear = () => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    hasDrawnRef.current = false
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        style={{
          width: '100%',
          height: 160,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          background: '#fff',
          touchAction: 'none',
          cursor: 'crosshair',
          display: 'block',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <p style={{ ...helperStyle, margin: 0 }}>
          Draw your signature. Clear and start over if needed.
        </p>
        <button
          type="button"
          onClick={clear}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

// ─── styles ─────────────────────────────────────────────────────────────

const tabRowStyle: React.CSSProperties = {
  display: 'inline-flex',
  background: '#f1f5f9',
  padding: 3,
  borderRadius: 8,
  gap: 2,
  marginBottom: 16,
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  border: 'none',
  background: active ? '#fff' : 'transparent',
  color: active ? '#0b1e3f' : '#64748b',
  fontWeight: active ? 600 : 500,
  padding: '7px 14px',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: active ? '0 1px 2px rgba(15,23,42,.05)' : 'none',
})

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#334155',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#fff',
  boxSizing: 'border-box',
}

const previewStyle: React.CSSProperties = {
  minHeight: 72,
  marginTop: 14,
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #e4e9f1',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const cursiveStyle: React.CSSProperties = {
  fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive',
  fontSize: 36,
  color: '#1e3a8a',
  lineHeight: 1,
}

const helperStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: '#64748b',
  lineHeight: 1.45,
  marginTop: 10,
  marginBottom: 0,
}
