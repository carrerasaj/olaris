import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.ORBIS_WEBHOOK_SECRET || '';

// In-memory event store (persists between requests on same instance)
// For testing only -- clears on cold start/redeploy
const eventStore: Array<{
  delivery_id: string;
  event_type: string;
  payload: any;
  timestamp: string;
  received_at: string;
  signature_valid: boolean | null;
}> = [];

const MAX_EVENTS = 100;

function verifySignature(payload: string, secret: string, signature: string): boolean {
  if (!secret || !signature) return false;
  try {
    const expectedSig = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(
        JSON.stringify(JSON.parse(payload), Object.keys(JSON.parse(payload)).sort(), 0)
          .replace(/\s/g, '')
      )
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/orbis
 * Receives and stores webhook events from Orbis Fleet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature') || '';
    const eventType = request.headers.get('x-webhook-event') || '';
    const deliveryId = request.headers.get('x-webhook-delivery-id') || '';
    const timestamp = request.headers.get('x-webhook-timestamp') || '';

    // Verify signature
    let signatureValid: boolean | null = null;
    if (WEBHOOK_SECRET) {
      signatureValid = verifySignature(body, WEBHOOK_SECRET, signature);
      if (!signatureValid) {
        console.error(`[Orbis Webhook] Invalid signature for delivery ${deliveryId}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);

    // Store the event
    eventStore.unshift({
      delivery_id: deliveryId,
      event_type: eventType,
      payload,
      timestamp,
      received_at: new Date().toISOString(),
      signature_valid: signatureValid
    });

    // Keep only the last MAX_EVENTS
    if (eventStore.length > MAX_EVENTS) {
      eventStore.splice(MAX_EVENTS);
    }

    console.log(`[Orbis Webhook] Stored: ${eventType} | Delivery: ${deliveryId} | Total events: ${eventStore.length}`);

    return NextResponse.json({
      received: true,
      delivery_id: deliveryId,
      event_type: eventType,
      events_stored: eventStore.length
    });

  } catch (error) {
    console.error('[Orbis Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/orbis
 * Retrieve stored events -- for Olaris systems to poll
 * Query params: ?type=driver.alert&limit=10
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let events = eventStore;

  // Filter by event type if specified
  if (eventType) {
    events = events.filter(e => e.event_type === eventType);
  }

  // Apply limit
  events = events.slice(0, limit);

  return NextResponse.json({
    total_stored: eventStore.length,
    returned: events.length,
    filter: eventType || 'all',
    events
  });
}
