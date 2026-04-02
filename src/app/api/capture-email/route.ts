import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const LEADS_FILE = path.join(process.cwd(), 'data', 'email-leads.json')

interface Lead {
  email: string
  source: string
  vehicle_searched: string | null
  timestamp: string
}

function readLeads(): Lead[] {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeLeads(leads: Lead[]) {
  const dir = path.dirname(LEADS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source, vehicle_searched, timestamp } = body

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const lead: Lead = {
      email: email.trim().toLowerCase(),
      source: typeof source === 'string' ? source : 'unknown',
      vehicle_searched: typeof vehicle_searched === 'string' ? vehicle_searched : null,
      timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString(),
    }

    const leads = readLeads()

    // Deduplicate: update existing entry if same email + source, otherwise append
    const existingIdx = leads.findIndex(
      (l) => l.email === lead.email && l.source === lead.source
    )
    if (existingIdx >= 0) {
      leads[existingIdx] = lead
    } else {
      leads.push(lead)
    }

    writeLeads(leads)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function GET() {
  const leads = readLeads()

  return NextResponse.json({
    total: leads.length,
    leads,
  })
}
