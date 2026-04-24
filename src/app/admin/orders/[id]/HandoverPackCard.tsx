/**
 * Handover-pack card on the order detail page.
 *
 * Three states:
 *   1. Too early — not yet ready_for_handover; empty hint.
 *   2. Ready / delivered, no pack yet — "Generate handover pack" button.
 *   3. Pack exists — show meta + download + regenerate button.
 */

import { fmtDateTime } from '@/lib/format'
import type { Order } from '@/db/schema'

interface Props {
  order: Order
  existing: {
    id: string
    blobUrl: string
    sha256: string
    sizeBytes: number | null
    uploadedAt: Date
  } | null
  generate: () => Promise<void>
}

export function HandoverPackCard({ order, existing, generate }: Props) {
  const allowed =
    order.status === 'ready_for_handover' || order.status === 'delivered'

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-card-head">
        <h2 className="adm-card-title">Handover pack</h2>
      </div>
      <div className="adm-card-body">
        {!allowed && (
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Available once the order is <strong>ready for handover</strong> or
            delivered — we need the VIN + reg captured first.
          </p>
        )}

        {allowed && !existing && (
          <div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
              Generate the handover pack PDF. It's frozen at the moment of
              generation — if details change, regenerate to create a fresh pack
              (the prior is kept on record).
            </p>
            <form action={generate}>
              <button
                type="submit"
                className="adm-btn adm-btn-primary adm-btn-sm"
              >
                Generate handover pack
              </button>
            </form>
          </div>
        )}

        {allowed && existing && (
          <div>
            <dl className="adm-kv">
              <dt>Generated</dt>
              <dd>{fmtDateTime(existing.uploadedAt)}</dd>
              <dt>Size</dt>
              <dd className="mono">
                {existing.sizeBytes
                  ? `${(existing.sizeBytes / 1024).toFixed(1)} kB`
                  : '—'}
              </dd>
              <dt>SHA-256</dt>
              <dd
                className="mono"
                style={{ fontSize: 10, wordBreak: 'break-all' }}
              >
                {existing.sha256}
              </dd>
            </dl>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <a
                href={`/api/orders/${order.id}/handover-pack`}
                className="adm-btn adm-btn-primary adm-btn-sm"
              >
                Download
              </a>
              <form action={generate}>
                <button
                  type="submit"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  title="Replace the pack with a fresh render from current order data"
                >
                  Regenerate
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
