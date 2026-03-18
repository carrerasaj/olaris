---
title: "Your Vehicles Are Already Talking. Are You Listening?"
metaTitle: "Connected Vehicle Data: Your Fleet Is Talking"
metaDescription: "15+ manufacturers now share live telemetry via OEM APIs. Most fleets don't know it exists. Here's what changes when you plug in."
category: "Thought Leadership"
headerImage: "Modern vehicle dashboard interface showing real-time telemetry: GPS location, odometer, battery health, tyre pressure, and diagnostic alerts across multiple vehicle brands"
date: 2025-12-03
---

# Your Vehicles Are Already Talking. Are You Listening?

Three years ago, I had a fleet manager tell me she was spending 30 minutes every morning calling drivers to ask their mileage. Thirty minutes. Every day.

When I asked why, she said the mileage reports came in late, often wrong, and they needed an accurate number for the lease company reconciliation.

When I asked if she knew that her vehicles could send that mileage automatically, in real-time, directly to a system that never forgets it — she looked at me like I'd suggested she start reading tea leaves.

The revolution in connected vehicle data has been happening quietly for five years. The industry is only now waking up to what it means.

## The OEM API Shift: From Dongles to Manufacturer Data

For a decade, the telematics industry worked like this: you bought a black box from a vendor, fitted it to your vehicles, and got data from that black box to their dashboard. It was expensive, proprietary, and often worked badly.

That world is ending.

In 2020, major manufacturers started opening their data APIs. Not "we'll think about it." They started *actually doing it*. BMW did it. Mercedes did it. Volkswagen, Ford, Renault, Peugeot, Hyundai, Kia — the list now includes 15+ manufacturers representing 70% of new vehicle sales in Europe.

The shift happened in the background because it happened through platforms like High Mobility, which aggregates OEM APIs into a single integration layer. One connection point. Multiple manufacturers. Real telemetry.

Here's what manufacturers are now willing to share:

**Real-time vehicle telemetry:**
- GPS location (every 5–60 seconds depending on manufacturer)
- Current odometer reading
- Fuel or battery level
- Engine or motor state (on/off, running time)
- Door locks, window position, sunroof state
- Tyre pressure per wheel
- Diagnostic trouble codes
- Battery health (EVs)
- Oil temperature and coolant temperature
- Acceleration and braking events

**Historical data:**
- Complete trip logs
- Mileage trends
- Charging logs (EVs)
- Service schedule reminders
- Maintenance records integration

This isn't guesswork. This isn't driver input. This is the manufacturer's own computers telling you what the vehicle is doing, in real-time, with the accuracy of the onboard systems.

## The Problem: You Probably Don't Know This Data Exists

When I talk to fleet operators about connected vehicle data, I get three responses:

1. "We tried that, it's too complicated" — usually they tried a proprietary aftermarket system that required 40 integrations
2. "We have telematics already" — they do, probably from a third-party box that costs £40–£60 per vehicle per month
3. "Really? Our vehicles can do that?" — this is the honest one

The manufacturers made a bet: they could make data available and that would drive loyalty. They were right. What they didn't account for was that most fleets would have no idea the data was available.

Because it's not advertised. It's not in your vehicle paperwork. It's not something the dealership mentions. It exists in APIs that require technical integration, which feels hard, which means most fleets don't look for it.

You're leaving money on the table because you don't know your vehicle is offering it to you for free.

## What Changes When You Plug In

Let me walk through what actually changes when you move from "I'll ask the driver" to "the vehicle is telling me":

**Today (manual or aftermarket box):**
- Driver submits mileage weekly or monthly
- You cross-check it with a fuel card or odometer photo
- 72 hours later you have somewhat accurate data
- If the number is wrong, you chase it up
- Your lease company wants a reconciliation. You compile it on a spreadsheet
- One driver forgets to log mileage for six weeks. You estimate it.

**With connected vehicle data:**
- The odometer is live. Right now. No entry required.
- You can see mileage by vehicle, by day, by trip
- Lease reconciliation happens automatically every month. You see any discrepancies in real-time.
- Driver behaviour is visible: idle time, harsh acceleration, speeding — not from a black box, from the OEM telemetry
- Charging patterns (EVs) show actual energy consumption and range efficiency
- Tyre pressure alerts come directly from the vehicle. You know when pressure drops before it becomes a roadside repair
- Diagnostic alerts come straight from the manufacturer's system. You know about issues before they become failures

The time saving is obvious. The data accuracy is better. But the operational win is subtler: you're managing your fleet based on reality, not submissions.

## Multi-Manufacturer Visibility: The Hidden Complexity Solved

Here's a question that keeps fleet managers awake: what do you do when your fleet is mixed?

Eight Fords. Six Mercedes. Five Peugeots. Three Hyundais. Two BMWs. One Renault because someone bought it without asking.

Pre-OEM APIs, you had two choices:
1. Fit a black box to every vehicle (cost: £8,000–£12,000, ongoing: £40–£60/vehicle/month)
2. Live with fragmented visibility (no choice, really)

With OEM APIs aggregated through a platform like High Mobility, you get something radically different: complete visibility across all manufacturers from one dashboard.

This changes fleet operations because:

- You see which vehicles are idle regardless of manufacturer
- You understand cross-fleet mileage patterns without manual reconciliation
- Driver behaviour insight works consistently across your whole fleet
- Maintenance scheduling (when you integrate with service records) happens automatically
- You can compare cost per mile by vehicle type without manual data entry

This is genuinely new. A 50-vehicle mixed-brand fleet can now have complete visibility for the first time. Not partial visibility. Not "well, we know about the Fords and rough estimates for the rest." Complete.

## Fleet Utilisation Insights: Where Data Becomes Strategy

Once you're connected, you get something else: actual data on what your vehicles do when nobody's looking.

A fleet manager I worked with connected 34 vehicles to OEM APIs last year. Within 30 days, she discovered:

- 7 vehicles were running for less than 45 minutes per day on average, despite being fully fuelled/charged
- 4 vehicles were idle for 6+ hours during peak working hours regularly
- 2 vehicles had consistently high mileage but low utilisation (sitting in traffic, not delivering)
- 1 vehicle hadn't moved in 8 days
- 3 vehicles were being charged fully every night but only driving 15 miles the next day

She raised these in the operational team meeting. Result:

- The 7 low-use vehicles: reassigned duties or removed from fleet. Saving: £28,000/year in lease costs
- The 4 idle vehicles: discovered they were backup vehicles. Reduced to 1. Saving: £12,000/year
- The 2 high-mileage, low-output vehicles: reallocated to different routes. Saving: £4,000/year in fuel and reduced vehicle stress
- The vehicle sitting idle for 8 days: it had been "lost" from the admin system. Found it, put it back into service
- The 3 vehicles: shifted to battery management scheduling. Saving: battery longevity

Total identified waste: £44,000 per year. The data cost? Zero (OEM APIs are free if your vehicles support them). The integration cost? £3,000 one-time. Payback: 3 weeks.

This is what happens when you actually see what your fleet is doing.

## Privacy and Data Governance: Doing It Right

The obvious question: if the manufacturer is sharing this data, who else can see it?

This matters. Real-time GPS shows where your vehicles are. Mileage data shows driver patterns. Diagnostic codes can reveal vehicle problems. This is sensitive operational data.

Here's how it works properly:

**Vehicle manufacturer:** Holds the data in encrypted form. You access it via API. The manufacturer never shares it with anyone else without your explicit permission.

**Your fleet management platform:** Receives the data from the manufacturer's API. Stores it encrypted at rest. You control who within your organisation can access it. You control how long it's retained.

**Your drivers:** Generally don't know that real-time location and mileage is being tracked. This creates a governance question. Are you telling them? What are you tracking? What's the purpose?

UK employment law requires that tracking is:
- Proportionate to a legitimate business purpose
- Clearly communicated to employees
- Not excessive (live-tracking everyone's location 24/7 vs tracking idle time during working hours are very different)
- Compliant with GDPR if you're processing personal data

The best fleets are transparent about it: "We track mileage for lease reconciliation and vehicle maintenance. We monitor route efficiency to improve operations. We don't track personal journeys outside working hours."

Proper data governance actually builds trust. Sneaky tracking destroys it.

## Getting Connected: The Practical Path

Here's how to actually do this:

**Step 1: Audit your fleet** — What manufacturers do you have? Which ones support OEM APIs? (Check with your dealer or use a platform like High Mobility to see support)

**Step 2: Identify your integration point** — Direct API integration with each manufacturer, or through an aggregator. Aggregators are easier for mixed fleets.

**Step 3: Plan what you'll use** — Not every data point is valuable for every fleet. Mileage and location? Essential. Tyre pressure? Important if you're managing your own maintenance. Acceleration events? Important if you're managing driver behaviour.

**Step 4: Set up the plumbing** — One-time technical integration. Usually 3–8 weeks for multi-manufacturer support.

**Step 5: Use the data** — This is where it gets real. You've got visibility. Now what? Identify the operational problem you want to solve first. Lease reconciliation? Utilisation? Maintenance? Pick one, use the data to solve it, then expand.

## The Honest Truth About Old Telematics

If you're currently using a third-party telematics box (the kind fitted under the OBD-II port or hardwired to the engine), I'm going to be direct: it's becoming obsolete.

It works. It's fine. But you're paying £40–£60 per vehicle per month (£480–£720 per year) for data that your vehicle is now willing to give you for free.

The data is also usually worse: it's delayed, it's interpreted through someone else's algorithm, it's not as accurate as the manufacturer's own systems.

Moving to OEM APIs isn't about replacing a system. It's about getting better data, real-time, for lower cost. The aftermarket box has had a good run. Its run is ending.

## Why This Matters in 2026

This isn't hype. This is the infrastructure shift that's been happening in the background for three years, and it's now reaching the point where it's cheaper and better to use OEM APIs than to maintain legacy telematics.

By 2027, most new vehicles will come with full API support. By 2030, it'll be assumed. The question isn't "should we connect to OEM data?" It's "why would we *not*?"

The fleets that move early get two advantages:
1. **Better data for decision-making:** You see your operations clearly
2. **Competitive advantage:** Your competitors are still looking at spreadsheets

Your vehicles are already talking. Start listening.

---

**Ready to see what your vehicles are actually telling you?** [Get in touch for a connected data assessment](/contact) or [explore Olaris' vehicle connectivity platform](/platform).
