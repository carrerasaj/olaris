/**
 * Drip-sequence registry.
 *
 * Sequences are code, not database rows. Changing a sequence means a
 * code change + redeploy. That's deliberate for v1 — we want sequences
 * to live in git with review history, not as editable records some
 * admin surface has to manage.
 *
 * A sequence is an ordered list of steps. Each step has a delay from
 * enrolment, a subject line, and html/text builders that receive the
 * lead + any captured context. When a lead is enrolled, the first
 * step's `drip_enrolments` row is inserted with scheduledFor =
 * now + step.delayDays. After each step fires, the cron inserts the
 * NEXT step's row; when no next step exists, the sequence completes.
 *
 * Opt-out: every step is suppressed by the runtime if the lead has
 * `marketingOptOut = true` or `unsubscribedAt != null`. The drip
 * suppression event is still audited in lead_events.
 *
 * Adding a sequence:
 *   1. Declare it below with a stable `id`.
 *   2. Call `enrolLead(lead.id, sequenceId)` from wherever the
 *      capture surface handles the enrolment trigger.
 *   3. The registry + runtime handle the rest.
 */

import type { Lead } from '@/db/schema'

// ─── Step shape ────────────────────────────────────────────────────────

export interface DripStepContext {
  /** The lead row as it exists at send time. */
  lead: Lead
  /** URL-safe unsubscribe link for this lead. Embed in every step. */
  unsubscribeUrl: string
  /** Public site root (e.g. https://olaris.co.uk) for CTA URLs. */
  siteUrl: string
}

export interface DripStep {
  /** Days from enrolment (step 0 is same-day; 2 = +48h). */
  delayDays: number
  /** Stable per-step key used in analytics/audit payloads. */
  key: string
  subject: string
  html: (ctx: DripStepContext) => string
  text: (ctx: DripStepContext) => string
}

export interface DripSequence {
  id: string
  label: string
  /** Free-form audience note — who this sequence is for. Documentation only. */
  audience: string
  steps: DripStep[]
}

// ─── Shared fragments ──────────────────────────────────────────────────

function firstNameSalute(lead: Lead): string {
  return lead.firstName ? `Hi ${lead.firstName},` : 'Hi,'
}

function footerText(ctx: DripStepContext): string {
  return `\n\n—\nAlan Carreras, Olaris\n\nYou're getting this because you used an Olaris tool at ${ctx.siteUrl}. Unsubscribe: ${ctx.unsubscribeUrl}`
}

function footerHtml(ctx: DripStepContext): string {
  return `
<hr style="border:0;border-top:1px solid #e4e9f1;margin:24px 0" />
<p style="font-size:12px;color:#64748b;line-height:1.5">
  Alan Carreras · Olaris<br>
  You're getting this because you used an Olaris tool at ${ctx.siteUrl}.
  <a href="${ctx.unsubscribeUrl}" style="color:#64748b;text-decoration:underline">Unsubscribe</a>.
</p>`
}

// ─── Sequence: post-excess-mileage-calc ────────────────────────────────
//
// Source: Conversion addendum A-06. Seven touches over 21 days, paused
// automatically if the lead replies (T1-03 wires the reply-pause when
// the sequence actually ships). Body copy here is a working first
// draft — T1-03 iterates against real recipients.

const postExcessMileageCalc: DripSequence = {
  id: 'post-excess-mileage-calc',
  label: 'Post-calculator nurture · excess mileage',
  audience: 'Leads captured from the excess mileage calculator PDF-report gate.',
  steps: [
    {
      delayDays: 0,
      key: 'report-delivered',
      subject: 'Your excess mileage report + 3 comparable lease quotes',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>Your PDF report is attached — the numbers you entered, your projected
exposure, and three comparable BCH agreements sized to your actual usage.</p>
<p>If anything in it looks off, reply to this email and I'll take a look personally.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

Your PDF report is attached — the numbers you entered, your projected exposure, and three comparable BCH agreements sized to your actual usage.

If anything in it looks off, reply to this email and I'll take a look personally.${footerText(ctx)}`,
    },
    {
      delayDays: 2,
      key: 'authority-early-signal',
      subject: 'The one question that predicts excess mileage',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>Quick one: when does your fleet team first know a vehicle is trending
over its allowance?</p>
<p>Most teams find out at the annual review — month 10 or 11 of a 36-month
contract. By then the excess is baked in.</p>
<p>The teams that don't get burned see it at month 6, when there's still
time to redistribute mileage, pool allowances, or renegotiate. That's the
signal to build into your reporting, not a number.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

Quick one: when does your fleet team first know a vehicle is trending over its allowance?

Most teams find out at the annual review — month 10 or 11 of a 36-month contract. By then the excess is baked in.

The teams that don't get burned see it at month 6, when there's still time to redistribute mileage, pool allowances, or renegotiate. That's the signal to build into your reporting, not a number.${footerText(ctx)}`,
    },
    {
      delayDays: 5,
      key: 'case-study',
      subject: 'How Orbis flagged an 8k mile overshoot six months early',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>A 180-vehicle fleet we work with had a sales division trending 8,000
miles over allowance by month 9. Their lease report wouldn't have surfaced
it until month 22.</p>
<p>Because we pull live odometer data from the OEM feed, the variance
alert fired at month 6. They pooled allowance across under-used ops
vehicles and saved £43,000 in excess charges at contract end.</p>
<p>The detail isn't the saving — it's that the alert fired 16 months before
the invoice would have landed. That's what you're solving for.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

A 180-vehicle fleet we work with had a sales division trending 8,000 miles over allowance by month 9. Their lease report wouldn't have surfaced it until month 22.

Because we pull live odometer data from the OEM feed, the variance alert fired at month 6. They pooled allowance across under-used ops vehicles and saved £43,000 in excess charges at contract end.

The detail isn't the saving — it's that the alert fired 16 months before the invoice would have landed. That's what you're solving for.${footerText(ctx)}`,
    },
    {
      delayDays: 9,
      key: 'product-education',
      subject: 'BCH vs PCH vs sal-sac — which fits you?',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>Three lease types, three very different fits. Short version:</p>
<ul>
  <li><strong>BCH</strong> — best when the business pays and needs the asset on the balance sheet treatment. Excess mileage is a hard cost.</li>
  <li><strong>PCH</strong> — employee pays personally. No BIK, but no tax benefit either.</li>
  <li><strong>Salary sacrifice</strong> — employee sacrifices gross salary, employer handles the contract. Dramatic savings on EVs thanks to 2% BIK. Complicated on leavers.</li>
</ul>
<p>We published a fuller breakdown at <a href="${ctx.siteUrl}/leasing">${ctx.siteUrl}/leasing</a>.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

Three lease types, three very different fits. Short version:

- BCH — best when the business pays and needs the asset on the balance sheet treatment. Excess mileage is a hard cost.
- PCH — employee pays personally. No BIK, but no tax benefit either.
- Salary sacrifice — employee sacrifices gross salary, employer handles the contract. Dramatic savings on EVs thanks to 2% BIK. Complicated on leavers.

Fuller breakdown: ${ctx.siteUrl}/leasing${footerText(ctx)}`,
    },
    {
      delayDays: 14,
      key: 'pain-activation',
      subject: 'Is your fleet costing 12% more than it should?',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>The fleets we audit average 10–15% preventable cost overhead. It shows
up in three places:</p>
<ol>
  <li>Excess mileage (the one you've seen).</li>
  <li>Driver behaviour — aggressive drivers eat 15–20% more fuel and
      return vehicles in worse condition.</li>
  <li>Compliance admin — manual DVLA checks cost 3× what automated
      monitoring does, and miss endorsements.</li>
</ol>
<p>None of it is visible until you measure it. Which is the point.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

The fleets we audit average 10–15% preventable cost overhead. It shows up in three places:

1. Excess mileage (the one you've seen).
2. Driver behaviour — aggressive drivers eat 15–20% more fuel and return vehicles in worse condition.
3. Compliance admin — manual DVLA checks cost 3× what automated monitoring does, and miss endorsements.

None of it is visible until you measure it. Which is the point.${footerText(ctx)}`,
    },
    {
      delayDays: 18,
      key: 'soft-pitch-audit',
      subject: 'Want a free 30-point fleet audit?',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>We run a free 30-point audit for fleets we think we can help. It covers
compliance, cost, driver risk, and contract structure. Takes us about two
hours of your time, generates a written report.</p>
<p>If you'd like one for your fleet, reply to this email with a good time
and we'll book it in.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

We run a free 30-point audit for fleets we think we can help. It covers compliance, cost, driver risk, and contract structure. Takes us about two hours of your time, generates a written report.

If you'd like one for your fleet, reply to this email with a good time and we'll book it in.${footerText(ctx)}`,
    },
    {
      delayDays: 21,
      key: 'direct-cta',
      subject: 'Book a 20-min call with Alan',
      html: (ctx) => `<p>${firstNameSalute(ctx.lead)}</p>
<p>Last one — I promise. If the calculator output was useful and you'd
like to see what an actual fleet review looks like, 20 minutes on the
phone is usually enough to tell whether we can help.</p>
<p>Book direct: <a href="${ctx.siteUrl}/contact">${ctx.siteUrl}/contact</a></p>
<p>Or just reply to this email with a time that works.</p>
${footerHtml(ctx)}`,
      text: (ctx) => `${firstNameSalute(ctx.lead)}

Last one — I promise. If the calculator output was useful and you'd like to see what an actual fleet review looks like, 20 minutes on the phone is usually enough to tell whether we can help.

Book direct: ${ctx.siteUrl}/contact

Or just reply to this email with a time that works.${footerText(ctx)}`,
    },
  ],
}

// ─── Registry ──────────────────────────────────────────────────────────

export const dripSequences: Record<string, DripSequence> = {
  [postExcessMileageCalc.id]: postExcessMileageCalc,
}

export type DripSequenceId = keyof typeof dripSequences

export function getSequence(id: string): DripSequence | null {
  return dripSequences[id] ?? null
}
