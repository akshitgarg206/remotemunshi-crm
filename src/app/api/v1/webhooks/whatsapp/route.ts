import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processInboundMessage, processStatusUpdate, type WebhookPayload } from '@/lib/whatsapp/process-inbound'

/**
 * GET — Webhook verification (Meta/ChakraHQ sends this when you register the webhook URL)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST — Incoming messages and status updates from WhatsApp via ChakraHQ pass-through
 * Always return 200 to prevent retries.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Verify signature if META_APP_SECRET is configured (direct Meta webhook)
    // ChakraHQ pass-through may not include Meta's HMAC — accept gracefully
    const signature = req.headers.get('x-hub-signature-256')
    const appSecret = process.env.META_APP_SECRET
    if (signature && appSecret) {
      if (!verifySignature(rawBody, signature, appSecret)) {
        console.error('WhatsApp webhook: invalid signature')
        return NextResponse.json({ status: 'ok' }, { status: 200 })
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody)

    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Process asynchronously — don't block the response
    processWebhookAsync(payload).catch((err) =>
      console.error('WhatsApp webhook processing error:', err)
    )

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}

/**
 * Verify X-Hub-Signature-256 (optional — only when Meta secret is configured)
 */
function verifySignature(rawBody: string, signature: string, appSecret: string): boolean {
  try {
    const crypto = require('crypto')
    const expectedSignature =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Process webhook entries asynchronously
 */
async function processWebhookAsync(payload: WebhookPayload): Promise<void> {
  const supabase = createAdminClient()

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue

      const { metadata, messages, statuses, contacts } = change.value
      const phoneNumberId = metadata.phone_number_id
      const displayPhoneNumber = metadata.display_phone_number

      // Process incoming messages
      if (messages && contacts) {
        for (const msg of messages) {
          const contact = contacts.find((c) => c.wa_id === msg.from) || contacts[0]
          if (!contact) continue

          try {
            await processInboundMessage({
              supabase,
              message: msg,
              contact,
              phoneNumberId,
              displayPhoneNumber,
            })
          } catch (err) {
            console.error('Failed to process inbound message:', err)
          }
        }
      }

      // Process status updates (delivery receipts)
      if (statuses) {
        for (const status of statuses) {
          try {
            await processStatusUpdate({ supabase, status })
          } catch (err) {
            console.error('Failed to process status update:', err)
          }
        }
      }
    }
  }
}
