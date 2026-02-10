import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processInboundMessage, processStatusUpdate, type WebhookPayload } from '@/lib/whatsapp/process-inbound'

/**
 * GET — Webhook verification (Meta sends this when you register the webhook URL)
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
 * POST — Incoming messages and status updates from WhatsApp
 * Always return 200 to prevent Meta retries.
 * Signature verification via X-Hub-Signature-256.
 */
export async function POST(req: NextRequest) {
  // Always return 200 — even on processing errors (Meta retries on non-200)
  try {
    // Verify HMAC signature
    const signature = req.headers.get('x-hub-signature-256')
    const rawBody = await req.text()

    if (!verifySignature(rawBody, signature)) {
      console.error('WhatsApp webhook: invalid signature')
      return NextResponse.json({ status: 'ok' }, { status: 200 })
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
 * Verify X-Hub-Signature-256 using META_APP_SECRET
 */
function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false

  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) {
    console.error('META_APP_SECRET not configured')
    return false
  }

  // Use Web Crypto API (Edge-compatible)
  // For serverless: we do sync HMAC comparison
  // Note: crypto.subtle is async but we need sync here — use createHmac
  const crypto = require('crypto')
  const expectedSignature =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
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

      // Look up access token for this phone number
      const { data: account } = await supabase
        .from('whatsapp_accounts')
        .select('access_token')
        .eq('phone_number_id', phoneNumberId)
        .eq('status', 'active')
        .single()

      if (!account) {
        console.error(`No active WhatsApp account for phone_number_id: ${phoneNumberId}`)
        continue
      }

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
              accessToken: account.access_token,
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
