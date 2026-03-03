import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Store your Orbis webhook secret in environment variables
const WEBHOOK_SECRET = process.env.ORBIS_WEBHOOK_SECRET || '';

/**
 * Verify HMAC-SHA256 signature from Orbis Fleet
 * Orbis signs with: JSON.stringify(payload, sort_keys, compact_separators)
 */
function verifySignature(payload: string, secret: string, signature: string): boolean {
  if (!secret || !signature) return false;

  // Orbis sends: sha256=<hex>
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(
      JSON.stringify(JSON.parse(payload), Object.keys(JSON.parse(payload)).sort(), 0)
        .replace(/\s/g, '')
    )
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
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
 * Receives webhook events from Orbis Fleet Management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature') || '';
    const eventType = request.headers.get('x-webhook-event') || '';
    const deliveryId = request.headers.get('x-webhook-delivery-id') || '';
    const timestamp = request.headers.get('x-webhook-timestamp') || '';

    // 1. Verify signature
    if (WEBHOOK_SECRET && !verifySignature(body, WEBHOOK_SECRET, signature)) {
      console.error(`[Orbis Webhook] Invalid signature for delivery ${deliveryId}`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 2. Parse the payload
    const payload = JSON.parse(body);

    // 3. Log receipt (replace with your actual processing logic)
    console.log(`[Orbis Webhook] Received: ${eventType} | Delivery: ${deliveryId} | Time: ${timestamp}`);

    // 4. Route by event type
    switch (eventType) {
      case 'expense.claim_submitted':
        console.log('[Orbis Webhook] Expense claim submitted:', payload);
        // TODO: Process new expense claim
        break;

      case 'expense.claim_approved':
        console.log('[Orbis Webhook] Expense claim approved:', payload);
        // TODO: Process approved claim (e.g. trigger payroll)
        break;

      case 'expense.batch_submitted':
        console.log('[Orbis Webhook] Expense batch submitted:', payload);
        // TODO: Process batch submission
        break;

      default:
        console.log(`[Orbis Webhook] Unhandled event type: ${eventType}`, payload);
    }

    // 5. Return 200 promptly (Orbis expects 2xx)
    return NextResponse.json({
      received: true,
      delivery_id: deliveryId,
      event_type: eventType
    });

  } catch (error) {
    console.error('[Orbis Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint accepts POST requests only.' },
    { status: 405 }
  );
}
