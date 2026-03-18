---
title: "Five Systems, One Spreadsheet, and a Prayer: Why Fleet Data Needs a Single View"
metaTitle: "Fleet Data Management: Why Single-View Matters"
metaDescription: "Telematics, fuel cards, DVLA, maintenance, insurance scattered across systems. Here's how to bring it together without rip-and-replace."
category: "Thought Leadership"
headerImage: "Fleet operations dashboard with integrated data feeds: telematics, fuel cards, maintenance schedules, insurance renewals, and DVLA information unified in one interface"
date: 2026-01-14
---

# Five Systems, One Spreadsheet, and a Prayer: Why Fleet Data Needs a Single View

Monday morning. 9:47 AM.

A fleet manager at a 35-vehicle operation is doing this:

- Checking the telematics dashboard for vehicle location and fuel level (System A)
- Opening a spreadsheet for manual mileage tracking because the last system didn't sync properly (System B: Excel)
- Reviewing the fuel card provider's app for daily spend and anomalies (System C)
- Pulling DVLA data from a spreadsheet that someone updates monthly from the DVLA checker tool (System D: Excel again)
- Checking a shared calendar for insurance renewals and MOT dates that someone wrote there (System E: Google Calendar)
- Looking at a maintenance log that the workshop manager emailed weekly (System F: Email attachment)

Six systems. Five different logins. Three spreadsheets. One email thread that has 47 messages in it.

By 10:15 AM, she's spent 28 minutes gathering data that should take 90 seconds.

By 11:30 AM, she's found a discrepancy: the DVLA says one vehicle's MOT is overdue, but the calendar says it was done last week. Which is right? She has to email the workshop.

By 2:30 PM, she's finally reconciled the data. Turns out the DVLA was two days behind the calendar. She didn't need to take action. She just needed to know which source was current.

By 4:00 PM, she's updating the spreadsheet manually because the telematics system doesn't export in the format she needs for the compliance audit. She's transcribing numbers.

This is fleet management in 2026 for most operators. It's not a technology problem. It's a fragmentation problem.

And it costs real money.

## The Hidden Cost of Fragmentation

Let me quantify this because the number is shocking.

A fleet manager earning £32,000/year works 220 days per year. That's 1,760 working hours. If she spends 20% of her day (8 hours per week) gathering and reconciling data across systems, that's 416 hours per year.

Cost: £7,500/year for just the labour wasted on system fragmentation.

But that's not the real cost. The real cost is in the decisions she doesn't make because the data is too scattered to see clearly.

She can't run a utilisation report quickly because utilisation requires telematics (distance), fuel cards (cost), and DVLA (vehicle age). They're in three systems. By the time she's manually combined them, three weeks have passed and the insight is stale.

She can't spot an insurance renewal before it lapses because the calendar is separate from the vehicle system, and two vehicles changed hands between teams and nobody updated the calendar.

She can't identify which vehicles should be de-fleeted early because depreciation data, maintenance cost data, and utilisation data are in three places. She doesn't put them together.

The scattered data costs her fleet £30,000–£60,000 per year in missed decisions. Vehicles kept too long. Insurance lapses that cost a day of vehicle downtime. Maintenance issues that could have been caught early if the data was visible.

The £7,500 in labour waste is actually the smallest problem.

## What "Single Pane of Glass" Actually Means

Every software vendor talks about single pane of glass. It means nothing.

Because there are two radically different interpretations:

**Bad interpretation:** "Buy our all-in-one system that will replace your ERP, your fuel card provider, your insurance broker, and your telematics vendor."

Cost: £200,000+ upfront, 6-month implementation, 3 months of parallel running, replacement of systems you already have expertise in, massive disruption.

**Good interpretation:** "Bring all your existing systems together in one place so you see everything in context."

Cost: £15,000–£40,000 upfront, 4-6 week implementation, works with your current vendors, no replacement needed.

I'm describing the second one. That's what matters.

Your telematics vendor is good at telematics. Your fuel card provider is good at fuel reconciliation. Your DVLA checker is good at compliance tracking. Don't replace them. Connect them.

A proper single-view system:
- Pulls real-time telematics data from your current provider
- Pulls fuel card data from your fuel provider's API
- Pulls DVLA compliance data from your DVLA checker
- Pulls maintenance records from your workshop system (if it has an API) or imports them manually
- Pulls insurance renewal dates from your insurance broker
- Centralises all of it with your vehicle register as the key

Then you see everything in one place. A single dashboard where you can run a report that shows: vehicle, location, fuel level, last service date, next MOT, insurance expiry, utilisation, cost per mile.

You don't have one system of record. You have one view of many systems of record.

That's not hard. That's just connected thinking. And it changes fleet operations completely.

## The Integration Approach: Don't Rip and Replace

Here's why most fleets don't do this: they think it requires replacing everything.

It doesn't.

You can build a single-view system on top of your existing infrastructure in 4-6 weeks using APIs that already exist.

**Telematics:** If your provider has an API (most do), you can pull live vehicle data. If they don't, you can export daily extracts.

**Fuel cards:** Shell, BP, Arval, Lex, Ryder — most provide API access. If not, they provide daily CSV exports.

**DVLA data:** You're probably using a service like GOV.UK DVLA checker or a commercial checker like Venson or Hypercare. They have APIs. You can pull your vehicle register and compliance status daily.

**Maintenance:** If your workshop uses a system like WorkWave or Opus, it probably has API access. If not, they email reports weekly or monthly. You can import them.

**Insurance:** Most brokers can flag renewal dates in an automated format. If not, you manually enter them (5 minutes for a 50-vehicle fleet).

Four to six weeks of integration work. One unified system. Everything connected.

**Total cost:** £15,000–£30,000 depending on complexity
**Time to value:** 4 weeks
**ROI payback:** 2–3 months (from labour savings alone)

Compare that to the cost of buying a new all-in-one system that replaces your existing vendors: £200,000+, 6 months, massive disruption, and you're paying them instead of your current vendors.

The connected approach wins on cost, speed, and risk.

## What Connected Fleet Data Actually Enables

Let me show you what changes when you have a real single view.

**Scenario: Compliance reporting (currently takes 3 hours).**

Your insurance company asks for confirmation that all your vehicles have valid MOT and insurance. Currently, you'd:
- Export your vehicle list from the DVLA tool
- Check each one against your calendar
- Chase up missing dates with the workshop or broker
- Compile a spreadsheet
- Send it

Time: 3–4 hours per vehicle, minimum.

With a single view: You click "Compliance Report." The system shows all vehicles, MOT dates, insurance expiry dates, any out-of-compliance items. You send the report. Done. Time: 5 minutes.

**Scenario: Cost per mile analysis (currently takes 6 hours).**

Your finance team asks: which vehicles are our most expensive to operate?

Currently, you need to manually combine:
- Utilisation from telematics (miles driven)
- Fuel cost from fuel cards
- Maintenance cost from workshop records
- Depreciation from your lease records
- Insurance cost from broker

You create a spreadsheet. You manually reconcile each vehicle. You build a ranking. Time: 6 hours.

With a single view: You click "Cost Per Mile." The system pulls all this data, correlates it by vehicle, and shows you a ranked list. Finance gets the answer in 2 minutes.

**Scenario: Vehicle replacement timing (currently happens by chance).**

You need to know: which vehicles should be de-fleeted this year for optimal financial performance?

Currently, you'd have to manually compare:
- Age of vehicle (from DVLA)
- Total depreciation so far (from lease company records and depreciation tables)
- Maintenance cost trend (from workshop data over time)
- Remaining lease term (from your files)
- Market value (requires a separate valuation check)

This is so time-consuming that most fleets just follow the lease schedule. They don't optimise.

With a single view: The system shows predicted depreciation, maintenance cost forecast, and optimal replacement date for each vehicle. You can make actual financial decisions about when to de-fleet.

**Scenario: Driver coaching based on data (currently doesn't happen).**

You want to coach drivers on fuel efficiency. Currently, you'd have to manually connect:
- Fuel consumption per vehicle (from fuel card data)
- Driver assignment (from... somewhere, probably a spreadsheet)
- Telematics data (harsh braking, idle time, aggressive acceleration)

By the time you've pulled all this together, the month is over. The driver has moved to a different vehicle.

With a single view: The system automatically flags: "Driver A, vehicle L34 YXZ, 15% worse fuel economy than baseline. Harsh braking events: 23 in last week (target: <8). Recommended coaching: acceleration management and route planning."

The insight is current and actionable. The driver gets coached. Fuel cost improves.

## Real Examples: What Connected Data Actually Changes

**Example 1: Catching compliance drift early**

A 40-vehicle fleet using separate telematics and DVLA systems. The fleet manager reviewed DVLA data quarterly. One vehicle's MOT lapsed for 6 weeks before she noticed. The vehicle sat idle (downtime), the driver had to take alternative transport, and the company was technically operating an un-MOTed vehicle.

With a single view: The system alerts the moment an MOT approaches expiry (3 weeks out). The moment it lapses, it's flagged in red on the main dashboard. No vehicle sits idle. No compliance risk.

**Example 2: Identifying and removing waste**

A logistics company with 28 vehicles. When they connected their telematics to their fuel card data and maintenance records, they discovered:
- 3 vehicles were doing 40% fewer miles than the contract allowance
- 1 vehicle had been "moved" to a different team 18 months ago and was no longer active
- 2 vehicles were costing 45% more in maintenance than identical models

Decision: Remove the 4 under-utilised vehicles, consolidate work. Maintenance issue on 2 vehicles: deep diagnostic found worn suspension components. Replaced. Cost: £8,000. Saved: £28,000/year in lease costs and maintenance.

**Example 3: Data-driven fleet optimisation**

A field service company with 22 vehicles connected their telematics, fuel cards, and customer management system. They discovered:
- Vehicle utilisation varied by 40% (some doing 80 miles/day, others doing 120)
- Driver shifts didn't align with vehicle routing (some drivers had high idle time waiting for jobs)
- 8 vehicles could handle the workload of 10 through better scheduling

Decisions: Reallocate routes to balance utilisation, adjust driver schedules, de-fleet 2 vehicles early. Result: same service level with 18 vehicles instead of 22. Saving: £36,000/year.

None of these insights happened by accident. They happened because the data was visible.

## The Decision-Making Speed Advantage

Here's the thing that doesn't show up in spreadsheets but matters massively in real operations:

**Decision speed.**

With fragmented data: "I'll run that report and send it by Thursday."
With connected data: "I can see it right now."

That difference is enormous in operational scenarios.

A driver calls in: "My vehicle won't start. Can you send me a replacement?"

**Fragmented approach:** You check telematics for location. You check the vehicle schedule (somewhere) to see what's assigned. You check fuel card history to see if there's a pattern. You check maintenance records to see if there's a known issue. You call the workshop. You call the leasing company. You spend 45 minutes finding a replacement.

**Connected approach:** You see location, fuel history, maintenance record, assigned driver, and available vehicles in 60 seconds. You direct the driver to a nearby vehicle that's available. Time: 3 minutes.

The replacement might cost the same. But your driver's downtime is 40 minutes shorter. Your service delivery is 40 minutes faster. Your customer satisfaction is measurably better.

Do this 20 times per year (not unusual for a 40-vehicle fleet) and you've recovered 13+ hours of operational responsiveness.

## Starting Small: The Phase Approach

You don't have to connect everything at once. Smart fleets phase the integration:

**Phase 1 (Week 1-2):** Connect telematics and vehicle register. Now you have real-time visibility of where your vehicles are and what they're doing.

**Phase 2 (Week 3-4):** Add fuel card data. Now you can run utilisation vs. cost analysis.

**Phase 3 (Week 5-6):** Add DVLA compliance data. Now you have automated MOT and insurance tracking.

**Phase 4 (ongoing):** Add maintenance, insurance, driver data as you go.

By phase 3, you're already seeing benefits. By the end, you have true single-view operations.

## Why This Matters to Your Fleet's Future

The fleets that operate with fragmented data are optimising on incomplete information. They make reasonable decisions based on what they can see, but they're flying partly blind.

The fleets that have a single view of their data are optimising on complete information. They catch problems earlier. They make better decisions. They avoid waste.

The difference compounds over time. A fleet that catches one major problem early (a vehicle issue, a compliance drift, a utilisation mismatch) saves £5,000–£15,000. Do that twice a year and you've paid for the integration four times over.

Your data is already in your systems. It's already being tracked. You're just not seeing it together. That's fixable. And it's worth fixing.

---

**Ready to bring your fleet data together?** [Talk to us about a single-view integration](/contact) or [explore how Olaris connects your systems](/platform).
