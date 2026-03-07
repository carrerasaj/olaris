import { NextRequest, NextResponse } from 'next/server'

const BEEHIIV_PUBLICATION_ID = '72d7fe62-5c71-4dec-b1f5-2fbdfefb972b'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const apiKey = process.env.BEEHIIV_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Newsletter service not configured' }, { status: 503 })
  }

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: 'olaris.co.uk',
        utm_medium: 'footer',
      }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
