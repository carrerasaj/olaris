---
title: "What is an At-Risk Driver? How to Identify, Score, and Manage Driver Risk"
metaTitle: "What is an At-Risk Driver? Identification & Management Guide | Olaris"
metaDescription: "An at-risk driver is anyone whose behaviour, licence status, or compliance gaps raise their incident risk. How to identify and manage them in your fleet."
category: "Driver Behaviour"
headerImage: "Fleet risk dashboard showing driver risk scores colour-coded by severity, with penalty points, behaviour scores, and compliance status per driver"
date: 2026-03-21
faqSchema:
  - question: "What is an at-risk driver?"
    answer: "An at-risk driver is any driver in your fleet whose behaviour, licence status, or compliance gaps indicate a higher-than-normal probability of being involved in a road incident. Risk is assessed across three dimensions: penalty points and licence validity, driving behaviour (measured via telematics), and compliance documentation status."
  - question: "How do you identify at-risk drivers in a fleet?"
    answer: "At-risk drivers are identified through continuous monitoring of three data sources: DVLA licence records (penalty points, endorsements, validity), telematics data (speeding, harsh braking, harsh acceleration, cornering, night driving), and compliance records (checking schedules, insurance status, MOT validity). A combined risk score gives each driver a single number from 0 to 100."
  - question: "At what point is a driver considered high risk?"
    answer: "In the penalty points dimension, drivers with 9 or more points are high risk, and 12 or more points is critical (automatic ban threshold). In the behaviour scoring dimension, a score below 40 out of 100 is classified as high risk. In compliance terms, any driver with overdue checks, lapsed insurance, or expired documentation is at risk regardless of their other scores."
  - question: "How often should at-risk drivers be checked?"
    answer: "Best practice is risk-proportionate frequency: drivers with 0–3 penalty points get annual DVLA checks, 4–6 points get bi-annual checks, and 7+ points get quarterly checks. Behaviour monitoring via telematics should be continuous. Compliance documentation should be checked whenever an expiry date approaches, not on a fixed schedule."
  - question: "What should you do when you identify an at-risk driver?"
    answer: "The intervention depends on the risk type. For licence issues: increase checking frequency and, if points are approaching 12, consider restricted duties. For behaviour issues: provide near-real-time feedback, enrol in coaching, and consider reward-based improvement programmes. For compliance gaps: immediately verify and update the missing documentation. All interventions should be documented for audit purposes."
  - question: "Does driver risk scoring affect insurance premiums?"
    answer: "Increasingly, yes. Insurers use telematics-based risk data to price fleet policies. Fleets with demonstrably good driving behaviour can achieve premium discounts of 10–15%, while high-risk fleets may face surcharges of 25% or more. The data needs to be evidenced through a scoring system, not just claimed — which is why measurable driver risk programmes have a direct commercial return."
  - question: "Can you reduce driver risk without telematics?"
    answer: "Partially. You can manage licence and compliance risk through regular DVLA checks and document verification. But without telematics, you have no visibility of actual driving behaviour — which is the strongest predictor of incident risk. Licence checks tell you about past offences; telematics tells you about current behaviour. A comprehensive driver risk programme needs both."
---

# What is an At-Risk Driver? How to Identify, Score, and Manage Driver Risk

An at-risk driver is any driver in your fleet whose behaviour, licence status, or compliance gaps make them statistically more likely to be involved in a road incident. Risk doesn't mean they've had an accident — it means the indicators suggest one is more likely unless something changes.

Most fleet managers think they know who their at-risk drivers are. It's the one who's had two accidents in the last year. The one who drives too fast. The one who complained about the speed limiter. But those are the obvious cases. The real risk in most fleets sits with the drivers nobody is watching — the ones whose licence status hasn't been checked in 18 months, whose penalty points crept up without anyone noticing, or whose driving style has gradually deteriorated in ways that don't show up until you look at the data.

After 40 years in the UK automotive sector, I can tell you that the biggest risk in any fleet isn't the driver everyone knows about. It's the one nobody's looking at.

The numbers bear this out. According to the Department for Transport, 1,602 people were killed on Britain's roads in 2024, with a further 27,865 seriously injured (Source: [DfT, Reported Road Casualties Great Britain Annual Report 2024](https://www.gov.uk/government/statistics/reported-road-casualties-great-britain-annual-report-2024/)). Brake, the road safety charity, estimates that more than a third of road fatalities involve someone driving for work. The Occupational Road Safety Alliance (ORSA) puts the cost to UK employers at £2.7 billion per year in lost time, vehicle damage, increased insurance premiums, and legal costs (Source: [ORSA, Facts and Figures](https://orsa.org.uk/facts-and-figures/)). Behind every one of those statistics is a driver whose risk indicators were visible — if anyone had been looking.

## The Three Dimensions of Driver Risk

Driver risk isn't a single metric. It's a combination of three distinct areas, and you need visibility across all of them to get an accurate picture.

### 1. Licence and Compliance Risk

This is the most straightforward dimension to check, and paradoxically the one most fleets get wrong.

A driver becomes at-risk the moment their licence status changes — penalty points added, endorsements recorded, licence approaching expiry, or category entitlement lost. The problem is that these changes happen continuously at the DVLA, and most fleets only check periodically.

Here's how the risk levels break down by penalty points:

**0 to 2 points** — compliant, no action needed. Standard annual DVLA check.

**3 to 5 points** — low risk. Worth noting, but not yet a concern. Annual checking is still appropriate.

**6 to 8 points** — moderate risk. This is the intervention zone. At 6 points, a new driver (within 2 years of passing their test) faces automatic licence revocation. For experienced drivers, 6 points should trigger increased checking frequency — every 6 months at minimum — and a conversation about driving standards.

**9 to 11 points** — high risk. The driver is approaching the 12-point disqualification threshold. Quarterly licence checks. Mandatory driving assessment. Formal discussion about continued driving duties. At this level, you should also be reviewing whether the driver should be on restricted duties or alternative transport.

**12 or more points** — critical. The driver faces a mandatory ban (minimum 6 months for a first totting-up disqualification). If they're still driving for you and you haven't acted on this, your compliance programme has failed.

The critical thing here is frequency. If you check licences annually, a driver could accumulate 11 points in the 364 days between checks and you wouldn't know until the next scheduled review. That's not a gap — that's a canyon. Our [DVLA compliance platform](/features/dvla-compliance) adjusts checking frequency automatically based on the last known penalty points level. The higher the risk, the more frequently we verify. I explained this in more detail in [What is Fleet Compliance?](/blog/what-is-fleet-compliance).

### 2. Driving Behaviour Risk

This is where telematics data transforms driver risk management from guesswork into evidence.

A driver behaviour score — typically measured on a 0 to 100 scale — aggregates multiple indicators of driving style into a single risk metric. The components scored in the [Olaris driver behaviour module](/features/driver-behaviour) are weighted by their correlation with incident probability:

**Speed compliance (25%)** — not just whether a driver exceeds limits, but how often and by how much. The threshold for "harsh" isn't a single number; it's normalised per 100 kilometres driven. A driver averaging more than 5 speeding events per 100km is in the "fair" category. More than 10, and they need improvement.

**Acceleration and braking (20% each)** — harsh acceleration above 3.0 m/s² and harsh braking below -4.0 m/s² are the standard detection thresholds. Extreme events (above 5.0 m/s² acceleration or below -6.0 m/s² braking) carry heavier penalties in the scoring model.

**Cornering (15%)** — hard cornering above 30 degrees per second indicates a driver taking corners too fast. This is particularly relevant for van fleets — the UK industry average for vans is 18 hard cornering events per 100 miles, which tells you how common and how normalised the problem is.

**Time of day (10%)** — driving between 11pm and 5am carries elevated risk. A driver with more than 25% of their driving in this window gets a significant score impact. Over 40% triggers the highest penalty.

**Vehicle stability (5%)** — electronic stability control and ABS activations, tracked per 100 kilometres. Any activation suggests the vehicle reached its handling limits, which means the driver pushed beyond safe parameters.

**Efficiency (5%)** — fuel efficiency and driving smoothness. Not directly a safety metric, but a strong proxy. Smooth drivers are safer drivers.

The resulting score places each driver into a risk band:

**85–100: Excellent** — low risk, eligible for insurance premium discounts (typically 15% reduction).

**70–84: Good** — acceptable risk, minor discount territory (around 5%).

**55–69: Fair** — standard risk. No premium adjustment, but worth monitoring.

**40–54: Needs improvement** — elevated risk. Insurance premiums may increase by 10%. This driver needs intervention.

**0–39: High risk** — significant risk. Insurance premiums increase by 25% or more. Immediate intervention required — restricted duties, mandatory training, or reassignment.

I wrote a full breakdown of how behaviour scoring works, including the gamification and reward systems that actually change behaviour, in [What is Driver Behaviour Scoring?](/blog/what-is-driver-behaviour-scoring).

### 3. Compliance Gap Risk

This is the silent dimension — the risk that exists in the gaps between checks.

A driver becomes at-risk when their documentation is incomplete, overdue, or missing entirely. Insurance lapsed? At-risk. MOT expired on their grey fleet vehicle? At-risk. DVLA check overdue by more than 12 months? At-risk. Nominee authorisation expired? At-risk.

The compliance gap dimension is where most fleet managers have the least visibility, because it requires cross-referencing multiple data sources: DVLA records, insurance documents, MOT dates, vehicle service records, and checking schedules. Doing this manually for 200 drivers is a full-time job. For 2,000 drivers, it's impossible without a system.

In our platform, every driver has a compliance status that updates automatically: compliant, check overdue, not checked, nominee not checked, nominee expired, high risk, or critical. The status is computed from real data — not from assumptions about whether someone remembered to file the paperwork. For a full breakdown of the compliance framework, see [What is Fleet Compliance?](/blog/what-is-fleet-compliance).

## Why Annual Reviews Don't Work

The traditional approach to driver risk management is the annual review. Once a year, someone pulls the licence records, reviews the accident history, and identifies the "problem drivers." This approach has three fatal flaws.

First, risk changes continuously, not annually. A driver can go from compliant to critical in the space of a single weekend — one bad decision, three penalty points, and suddenly they're at the disqualification threshold. Twelve months is too long to wait.

Second, annual reviews identify past risk, not current risk. By the time you're reviewing last year's data, the horse has bolted. The driver who had an incident in February has been driving for another ten months before anyone formally reviews it.

Third, annual reviews don't change behaviour. Telling a driver in December that their braking was too harsh in March is meaningless. The feedback loop is too slow. Behaviour change requires near-real-time feedback — ideally within the same journey or the same day.

## Building a Driver Risk Programme That Works

If you're serious about reducing driver risk, here's the framework that actually delivers results.

**Automate the monitoring.** Every driver should have a continuously updated risk profile that combines their licence status, behaviour score, and compliance status. Don't rely on manual checking — automate it so that changes are detected and flagged in real time.

**Set intervention thresholds.** Define exactly what happens at each risk level. At Olaris, critical alerts (licence expiry within 7 days, 12+ penalty points) require action within 24 hours. High alerts require action within a week. Medium alerts get flagged in the next compliance review. This removes ambiguity — nobody has to decide whether something is "serious enough" to act on.

**Use rewards, not just penalties.** The fleet industry's traditional approach to at-risk drivers is punitive: warnings, disciplinary action, retraining. The data shows this has limited effectiveness. Reward-led programmes — where good driving earns tangible benefits — achieve engagement rates of 80–90%, compared to 5% for penalty-based approaches. I covered the evidence for this in the [driver behaviour scoring](/blog/what-is-driver-behaviour-scoring) piece, including the Lightfoot case study where Asda halved dangerous driving events across 3,000 vehicles.

**Score and rank.** Give every driver a number. Make it visible. Leaderboards, team challenges, monthly reports. Humans are competitive. When driving quality is measured and visible, it improves. When it's invisible, it drifts.

**Close the loop.** When a driver improves, acknowledge it. When they deteriorate, intervene early — not 12 months later. The difference between a good driver risk programme and a compliance checkbox is the speed of the feedback loop. This is where connecting [driver behaviour data to cost tracking](/features/cost-tracking) pays off — the same driver whose risk score is improving is typically the one whose fuel costs are falling and whose vehicle is returning in better condition.

## The Insurance Dividend

Here's the commercial case that gets boardroom attention: driver risk scoring directly affects insurance costs.

According to the Association of British Insurers, fleet motor insurance premiums have risen by an estimated 20–30% since 2022, driven by rising repair costs, parts inflation, and increasingly expensive vehicle technology (Source: [ABI, Motor Insurance Data](https://www.abi.org.uk/)). Insurers are responding by differentiating more aggressively on risk data — and that starts with identifying which drivers are actually driving up your claims experience.

Insurers increasingly use telematics data to price fleet policies. A fleet that can demonstrate low-risk driving behaviour — evidenced by scoring data, not just claims history — qualifies for lower premiums. We've modelled this across five tiers, from a 15% discount for excellent fleets down to a 25% surcharge for high-risk fleets.

The maths is straightforward. If your fleet insurance costs £500,000 a year and you can move your fleet average from "fair" to "good" by identifying and intervening with your at-risk drivers, you're looking at a £25,000 to £75,000 annual saving on premiums alone — before you count the reduction in claims costs, vehicle repair costs, and downtime.

That's the argument that converts driver risk management from an operational task into a strategic investment. You can see how this fits into the [full Olaris platform](/platform), where risk scores, compliance status, and cost data sit in a single operational view — and the [team behind it](/about) has run fleets long enough to know where the real exposures sit.

For drivers who use their own vehicles for work, the same risk framework applies — see [What is Grey Fleet?](/blog/what-is-grey-fleet) for the compliance obligations that most employers underestimate.

## Further Reading

- [Reported Road Casualties Great Britain: Annual Report 2024](https://www.gov.uk/government/statistics/reported-road-casualties-great-britain-annual-report-2024/) — Department for Transport
- [Facts and Figures: Work-Related Road Risk](https://orsa.org.uk/facts-and-figures/) — Occupational Road Safety Alliance
- [In My Workplace: Fleet Road Safety](https://www.brake.org.uk/get-involved/take-action/in-your-workplace) — Brake, the Road Safety Charity
- [DVLA Online Driving Licence Checking Service](https://www.gov.uk/check-driving-information) — GOV.UK
- [Motor Insurance Data](https://www.abi.org.uk/) — Association of British Insurers

## Frequently Asked Questions

### What is an at-risk driver?

An at-risk driver is any driver in your fleet whose behaviour, licence status, or compliance gaps indicate a higher-than-normal probability of being involved in a road incident. Risk is assessed across three dimensions: penalty points and licence validity, driving behaviour (measured via telematics), and compliance documentation status.

### How do you identify at-risk drivers in a fleet?

At-risk drivers are identified through continuous monitoring of three data sources: DVLA licence records (penalty points, endorsements, validity), telematics data (speeding, harsh braking, harsh acceleration, cornering, night driving), and compliance records (checking schedules, insurance status, MOT validity). A combined risk score gives each driver a single number from 0 to 100.

### At what point is a driver considered high risk?

In the penalty points dimension, drivers with 9 or more points are high risk, and 12 or more points is critical (automatic ban threshold). In the behaviour scoring dimension, a score below 40 out of 100 is classified as high risk. In compliance terms, any driver with overdue checks, lapsed insurance, or expired documentation is at risk regardless of their other scores.

### How often should at-risk drivers be checked?

Best practice is risk-proportionate frequency: drivers with 0–3 penalty points get annual DVLA checks, 4–6 points get bi-annual checks, and 7+ points get quarterly checks. Behaviour monitoring via telematics should be continuous. Compliance documentation should be checked whenever an expiry date approaches, not on a fixed schedule.

### What should you do when you identify an at-risk driver?

The intervention depends on the risk type. For licence issues: increase checking frequency and, if points are approaching 12, consider restricted duties. For behaviour issues: provide near-real-time feedback, enrol in coaching, and consider reward-based improvement programmes. For compliance gaps: immediately verify and update the missing documentation. All interventions should be documented for audit purposes.

### Does driver risk scoring affect insurance premiums?

Increasingly, yes. Insurers use telematics-based risk data to price fleet policies. Fleets with demonstrably good driving behaviour can achieve premium discounts of 10–15%, while high-risk fleets may face surcharges of 25% or more. The data needs to be evidenced through a scoring system, not just claimed — which is why measurable driver risk programmes have a direct commercial return.

### Can you reduce driver risk without telematics?

Partially. You can manage licence and compliance risk through regular DVLA checks and document verification. But without telematics, you have no visibility of actual driving behaviour — which is the strongest predictor of incident risk. Licence checks tell you about past offences; telematics tells you about current behaviour. A comprehensive driver risk programme needs both.

---

Driver risk management is one pillar of fleet compliance. Check all ten with our [free compliance checker](/tools/fleet-compliance-checker).
