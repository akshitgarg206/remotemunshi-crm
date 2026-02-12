import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processInboundMessage, processStatusUpdate } from '@/lib/whatsapp/process-inbound'

/**
 * POST — YCloud webhook for inbound WhatsApp messages and status updates
 * YCloud event types:
 *   whatsapp.inbound_message.received → inbound message
 *   whatsapp.message.updated → delivery status update
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Verify YCloud signature if secret is configured
    const signatureHeader = req.headers.get('ycloud-signature')
    const webhookSecret = process.env.YCLOUD_WEBHOOK_SECRET
    if (webhookSecret && signatureHeader) {
      if (!verifyYCloudSignature(rawBody, signatureHeader, webhookSecret)) {
        console.error('YCloud webhook: invalid signature')
        return NextResponse.json({ status: 'ok' }, { status: 200 })
      }
    }

    let payload: YCloudWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('YCloud webhook: invalid JSON:', rawBody.substring(0, 500))
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    console.log('YCloud webhook received:', JSON.stringify({
      type: payload.type,
      id: payload.id,
    }))

    const supabase = createAdminClient()

    if (payload.type === 'whatsapp.inbound_message.received' && payload.whatsappInboundMessage) {
      await handleInboundMessage(supabase, payload.whatsappInboundMessage)
    } else if (payload.type === 'whatsapp.message.updated' && payload.whatsappMessage) {
      await handleStatusUpdate(supabase, payload.whatsappMessage)
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err) {
    console.error('YCloud webhook error:', err)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}

// ---- YCloud payload types ----

interface YCloudWebhookPayload {
  id: string
  type: string
  apiVersion: string
  createTime: string
  whatsappInboundMessage?: YCloudInboundMessage
  whatsappMessage?: YCloudMessageStatus
}

interface YCloudInboundMessage {
  id: string
  wabaId: string
  from: string
  to: string
  customerProfile?: { name?: string }
  type: string
  text?: { body: string }
  image?: YCloudMedia
  audio?: YCloudMedia
  video?: YCloudMedia
  document?: YCloudMedia & { filename?: string }
  sticker?: YCloudMedia
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  contacts?: unknown[]
  reaction?: { message_id: string; emoji: string }
  button?: { text: string; payload: string }
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } }
  timestamp: string
}

interface YCloudMedia {
  id?: string
  link?: string
  mime_type?: string
  sha256?: string
  caption?: string
}

interface YCloudMessageStatus {
  id: string
  wamid?: string
  wabaId: string
  from: string
  to: string
  status: string
  sendTime?: string
  deliverTime?: string
  readTime?: string
  errorCode?: string
  errorMessage?: string
}

// ---- Handlers ----

async function handleInboundMessage(supabase: ReturnType<typeof createAdminClient>, msg: YCloudInboundMessage) {
  // Map YCloud `to` number → find our whatsapp_account by display_phone_number
  const toNormalized = msg.to.replace(/\D/g, '')
  const { data: account } = await supabase
    .from('whatsapp_accounts')
    .select('phone_number_id, display_phone_number')
    .or(`display_phone_number.like.%${toNormalized.slice(-10)}%`)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!account) {
    console.error('YCloud webhook: no matching whatsapp_account for to:', msg.to)
    return
  }

  // Map to Meta-compatible format for processInboundMessage
  const metaMessage = mapToMetaMessage(msg)
  const metaContact = {
    profile: { name: msg.customerProfile?.name || msg.from },
    wa_id: msg.from,
  }

  await processInboundMessage({
    supabase,
    message: metaMessage,
    contact: metaContact,
    phoneNumberId: account.phone_number_id,
    displayPhoneNumber: account.display_phone_number,
    provider: 'ycloud',
  })

  console.log('YCloud: processed inbound message:', msg.id, 'from:', msg.from, 'type:', msg.type)
}

async function handleStatusUpdate(supabase: ReturnType<typeof createAdminClient>, msg: YCloudMessageStatus) {
  // Map YCloud status to Meta-compatible format
  const statusMap: Record<string, 'sent' | 'delivered' | 'read' | 'failed'> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    undelivered: 'failed',
  }

  const mappedStatus = statusMap[msg.status] || 'sent'
  const messageId = msg.wamid || msg.id

  await processStatusUpdate({
    supabase,
    status: {
      id: messageId,
      status: mappedStatus,
      timestamp: msg.sendTime || msg.deliverTime || msg.readTime || new Date().toISOString(),
      recipient_id: msg.to,
      ...(msg.errorCode ? { errors: [{ code: parseInt(msg.errorCode) || 0, title: msg.errorMessage || 'Unknown error' }] } : {}),
    },
  })
}

function mapToMetaMessage(msg: YCloudInboundMessage) {
  // Map YCloud media objects: add `link` as downloadable URL for YCloud provider
  const mapMedia = (m?: YCloudMedia) => {
    if (!m) return undefined
    return {
      id: m.id || '',
      mime_type: m.mime_type || '',
      sha256: m.sha256,
      caption: m.caption,
      // YCloud-specific: store direct download link
      _ycloud_link: m.link,
    }
  }

  return {
    from: msg.from,
    id: msg.id,
    timestamp: msg.timestamp || new Date().toISOString(),
    type: msg.type as 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'reaction' | 'button' | 'interactive',
    text: msg.text,
    image: mapMedia(msg.image),
    audio: mapMedia(msg.audio),
    video: mapMedia(msg.video),
    document: msg.document ? { ...mapMedia(msg.document)!, filename: msg.document.filename } : undefined,
    sticker: mapMedia(msg.sticker),
    location: msg.location,
    contacts: msg.contacts,
    reaction: msg.reaction,
    button: msg.button,
    interactive: msg.interactive,
  }
}

// ---- Signature verification ----

function verifyYCloudSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    // YCloud-Signature: t=<timestamp>,s=<hmac>
    const parts: Record<string, string> = {}
    for (const pair of signatureHeader.split(',')) {
      const [key, value] = pair.split('=', 2)
      if (key && value) parts[key.trim()] = value.trim()
    }

    const timestamp = parts.t
    const signature = parts.s
    if (!timestamp || !signature) return false

    const crypto = require('crypto')
    const signedPayload = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}
