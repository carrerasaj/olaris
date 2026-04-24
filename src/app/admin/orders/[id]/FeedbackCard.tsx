/**
 * Feedback (NPS) card on the order detail page. Shows the customer's
 * submitted score + comment if any; otherwise an "Awaiting feedback"
 * state. Once delivered, exposes a "Send feedback request now" button
 * to bypass the NPS_day_2 cron — useful when the auto-mailer is
 * suppressed or the admin wants to nudge.
 */

import { fmtDateTime } from '@/lib/format'
import { NpsScorePill } from '../../components'
import type { Feedback } from '@/db/schema'

interface Props {
  orderStatus: string
  feedback: Feedback | null
  resendNps?: () => Promise<void>
  npsAlreadySent: boolean
}

export function FeedbackCard({
  orderStatus,
  feedback,
  resendNps,
  npsAlreadySent,
}: Props) {
  const delivered = orderStatus === 'delivered'

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-card-head">
        <h2 className="adm-card-title">Customer feedback</h2>
      </div>
      <div className="adm-card-body">
        {!delivered && !feedback && (
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Available once the order is delivered. The NPS request is sent
            automatically two days later.
          </p>
        )}

        {delivered && !feedback && (
          <div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
              {npsAlreadySent
                ? 'NPS request emailed; awaiting customer response.'
                : 'NPS request will be sent automatically two days after delivery.'}
            </p>
            {resendNps && (
              <form action={resendNps}>
                <button
                  type="submit"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                >
                  {npsAlreadySent
                    ? 'Resend feedback request'
                    : 'Send feedback request now'}
                </button>
              </form>
            )}
          </div>
        )}

        {feedback && (
          <div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <NpsScorePill score={feedback.score} />
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Submitted {fmtDateTime(feedback.submittedAt)}
              </span>
            </div>
            {feedback.comment ? (
              <blockquote
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e4e9f1',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#0f172a',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {feedback.comment}
              </blockquote>
            ) : (
              <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                No comment left.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
