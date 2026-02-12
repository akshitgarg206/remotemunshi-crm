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
 * Must await processing before returning — Vercel kills serverless functions after response.
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

    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('WhatsApp webhook: invalid JSON body:', rawBody.substring(0, 500))
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    console.log('WhatsApp webhook received:', JSON.stringify({
      object: payload.object,
      entryCount: payload.entry?.length,
      firstEntry: payload.entry?.[0] ? {
        id: payload.entry[0].id,
        changesCount: payload.entry[0].changes?.length,
        field: payload.entry[0].changes?.[0]?.field,
        hasMessages: !!payload.entry[0].changes?.[0]?.value?.messages,
        hasStatuses: !!payload.entry[0].changes?.[0]?.value?.statuses,
        phoneNumberId: payload.entry[0].changes?.[0]?.value?.metadata?.phone_number_id,
      } : null,
    }))

    if (payload.object !== 'whatsapp_business_account') {
      console.log('WhatsApp webhook: ignoring non-whatsapp object:', payload.object)
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // MUST await — Vercel terminates serverless functions after response returns
    await processWebhookEntries(payload)

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
 * Process webhook entries — awaited before returning response
 */
async function processWebhookEntries(payload: WebhookPayload): Promise<void> {
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
            console.log('Processed inbound message:', msg.id, 'from:', msg.from, 'type:', msg.type)
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
