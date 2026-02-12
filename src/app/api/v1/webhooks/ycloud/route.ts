import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processInboundMessage, processStatusUpdate } from '@/lib/whatsapp/process-inbound'

/**
 * POST — YCloud webhook handling all 17 WhatsApp event types:
 *
 * MESSAGING (core):
 *   whatsapp.inbound_message.received     → inbound message → OmniDesk
 *   whatsapp.message.updated              → delivery status (sent/delivered/read/failed)
 *
 * PHONE NUMBER:
 *   whatsapp.phone_number.deleted         → number removed from YCloud
 *   whatsapp.phone_number.name_updated    → display name approved/rejected
 *   whatsapp.phone_number.quality_updated → quality rating changed (GREEN/YELLOW/RED)
 *
 * TEMPLATE:
 *   whatsapp.template.reviewed            → approved/rejected/paused/disabled
 *   whatsapp.template.quality_updated     → quality rating changed
 *   whatsapp.template.category_updated    → category reclassified
 *
 * ACCOUNT:
 *   whatsapp.business_account.updated     → ban/restriction/policy violation
 *   whatsapp.business_account.deleted     → WABA deleted
 *
 * PAYMENTS:
 *   whatsapp.payment.updated              → payment captured/pending
 *
 * SMB (Small Business / coexistence):
 *   whatsapp.smb.history                  → chat history shared/declined
 *   whatsapp.smb.message.echoes           → messages sent via WA Business App
 *   whatsapp.smb.app.state.sync           → contacts added/edited/removed in WA App
 *
 * USER PREFERENCES:
 *   whatsapp.user.preferences             → user stopped/resumed marketing messages
 *
 * OTHER:
 *   contact.unsubscribe.created           → user unsubscribed
 *   contact.subscribe.updated             → user re-subscribed
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Verify YCloud signature
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

    console.log('YCloud webhook received:', payload.type, payload.id)

    const supabase = createAdminClient()

    switch (payload.type) {
      // ---- CORE MESSAGING ----
      case 'whatsapp.inbound_message.received':
        if (payload.whatsappInboundMessage) {
          await handleInboundMessage(supabase, payload.whatsappInboundMessage)
        }
        break

      case 'whatsapp.message.updated':
        if (payload.whatsappMessage) {
          await handleStatusUpdate(supabase, payload.whatsappMessage)
        }
        break

      // ---- PHONE NUMBER EVENTS ----
      case 'whatsapp.phone_number.deleted':
        if (payload.whatsappPhoneNumber) {
          await handlePhoneNumberDeleted(supabase, payload.whatsappPhoneNumber)
        }
        break

      case 'whatsapp.phone_number.name_updated':
        if (payload.whatsappPhoneNumber) {
          await handlePhoneNumberNameUpdate(supabase, payload.whatsappPhoneNumber)
        }
        break

      case 'whatsapp.phone_number.quality_updated':
        if (payload.whatsappPhoneNumber) {
          await handlePhoneNumberQualityUpdate(supabase, payload.whatsappPhoneNumber)
        }
        break

      // ---- TEMPLATE EVENTS ----
      case 'whatsapp.template.reviewed':
      case 'whatsapp.template.quality_updated':
      case 'whatsapp.template.category_updated':
        console.log('YCloud template event:', payload.type, JSON.stringify(payload.whatsappTemplate || {}))
        break

      // ---- ACCOUNT EVENTS ----
      case 'whatsapp.business_account.updated':
        if (payload.whatsappBusinessAccount) {
          await handleBusinessAccountUpdate(supabase, payload.whatsappBusinessAccount, payload.type)
        }
        break

      case 'whatsapp.business_account.deleted':
        if (payload.whatsappBusinessAccount) {
          console.warn('YCloud ALERT: WhatsApp Business Account DELETED:', payload.whatsappBusinessAccount.id)
          await handleBusinessAccountUpdate(supabase, payload.whatsappBusinessAccount, payload.type)
        }
        break

      // ---- PAYMENT EVENTS ----
      case 'whatsapp.payment.updated':
        console.log('YCloud payment event:', JSON.stringify(payload.whatsappPayment || {}))
        break

      // ---- SMB / COEXISTENCE EVENTS ----
      case 'whatsapp.smb.history':
        console.log('YCloud SMB history event:', JSON.stringify(payload.whatsappSmbHistory || {}))
        break

      case 'whatsapp.smb.message.echoes':
        if (payload.whatsappInboundMessage) {
          // Echo messages from WA Business App — treat as inbound for conversation tracking
          await handleInboundMessage(supabase, payload.whatsappInboundMessage)
          console.log('YCloud: processed SMB echo message')
        }
        break

      case 'whatsapp.smb.app.state.sync':
        console.log('YCloud SMB app state sync:', JSON.stringify(payload).substring(0, 500))
        break

      // ---- USER PREFERENCE EVENTS ----
      case 'whatsapp.user.preferences':
        console.log('YCloud user preferences event:', JSON.stringify(payload).substring(0, 500))
        break

      // ---- CONTACT SUBSCRIPTION EVENTS ----
      case 'contact.unsubscribe.created':
      case 'contact.subscribe.updated':
        console.log('YCloud contact subscription event:', payload.type, JSON.stringify(payload).substring(0, 500))
        break

      default:
        console.log('YCloud webhook: unhandled event type:', payload.type)
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
  whatsappPhoneNumber?: YCloudPhoneNumber
  whatsappTemplate?: YCloudTemplate
  whatsappBusinessAccount?: YCloudBusinessAccount
  whatsappPayment?: Record<string, unknown>
  whatsappSmbHistory?: Record<string, unknown>
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

interface YCloudPhoneNumber {
  id?: string
  phoneNumber?: string
  displayPhoneNumber?: string
  wabaId?: string
  nameStatus?: string // APPROVED, DECLINED, EXPIRED, etc.
  qualityRating?: string // GREEN, YELLOW, RED
  messagingLimit?: string
  status?: string
}

interface YCloudTemplate {
  id?: string
  wabaId?: string
  name?: string
  language?: string
  category?: string
  status?: string // APPROVED, REJECTED, PAUSED, DISABLED
  qualityScore?: { score?: string }
  reason?: string
}

interface YCloudBusinessAccount {
  id?: string
  name?: string
  banState?: string // SCHEDULE_FOR_DISABLE, DISABLE, REINSTATE
  violationType?: string
  restriction?: { restrictionType?: string }
}

// ---- Handlers ----

async function handleInboundMessage(supabase: ReturnType<typeof createAdminClient>, msg: YCloudInboundMessage) {
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

async function handlePhoneNumberDeleted(supabase: ReturnType<typeof createAdminClient>, phone: YCloudPhoneNumber) {
  const phoneNum = phone.displayPhoneNumber || phone.phoneNumber || ''
  console.warn('YCloud ALERT: Phone number deleted:', phoneNum)

  if (phoneNum) {
    const normalized = phoneNum.replace(/\D/g, '')
    await supabase
      .from('whatsapp_accounts')
      .update({ status: 'disconnected' })
      .like('display_phone_number', `%${normalized.slice(-10)}%`)
  }
}

async function handlePhoneNumberNameUpdate(supabase: ReturnType<typeof createAdminClient>, phone: YCloudPhoneNumber) {
  const status = phone.nameStatus || 'unknown'
  const phoneNum = phone.displayPhoneNumber || phone.phoneNumber || ''
  console.log('YCloud: phone number name update:', phoneNum, 'status:', status)

  // Update business_name status in metadata
  if (phoneNum) {
    const normalized = phoneNum.replace(/\D/g, '')
    const { data: account } = await supabase
      .from('whatsapp_accounts')
      .select('id, metadata')
      .like('display_phone_number', `%${normalized.slice(-10)}%`)
      .limit(1)
      .maybeSingle()

    if (account) {
      const meta = (account.metadata as Record<string, unknown>) || {}
      await supabase
        .from('whatsapp_accounts')
        .update({
          metadata: { ...meta, name_status: status, name_updated_at: new Date().toISOString() },
        })
        .eq('id', account.id)
    }
  }
}

async function handlePhoneNumberQualityUpdate(supabase: ReturnType<typeof createAdminClient>, phone: YCloudPhoneNumber) {
  const quality = phone.qualityRating || 'unknown'
  const phoneNum = phone.displayPhoneNumber || phone.phoneNumber || ''
  console.log('YCloud: phone quality update:', phoneNum, 'rating:', quality)

  if (quality === 'RED') {
    console.warn('YCloud ALERT: Phone number quality is RED (at risk of being blocked):', phoneNum)
  }

  if (phoneNum) {
    const normalized = phoneNum.replace(/\D/g, '')
    const { data: account } = await supabase
      .from('whatsapp_accounts')
      .select('id, metadata')
      .like('display_phone_number', `%${normalized.slice(-10)}%`)
      .limit(1)
      .maybeSingle()

    if (account) {
      const meta = (account.metadata as Record<string, unknown>) || {}
      await supabase
        .from('whatsapp_accounts')
        .update({
          metadata: {
            ...meta,
            quality_rating: quality,
            messaging_limit: phone.messagingLimit || meta.messaging_limit,
            quality_updated_at: new Date().toISOString(),
          },
        })
        .eq('id', account.id)
    }
  }
}

async function handleBusinessAccountUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  account: YCloudBusinessAccount,
  eventType: string
) {
  const wabaId = account.id || ''
  const banState = account.banState
  const violation = account.violationType

  console.warn('YCloud ALERT: Business account event:', eventType, {
    wabaId,
    banState,
    violation,
    restriction: account.restriction,
  })

  // If account is being disabled/banned, mark all numbers as disconnected
  if (banState === 'DISABLE' || eventType === 'whatsapp.business_account.deleted') {
    const { data: accounts } = await supabase
      .from('whatsapp_accounts')
      .select('id, metadata')
      .eq('waba_id', 'ycloud')

    if (accounts?.length) {
      for (const acct of accounts) {
        const meta = (acct.metadata as Record<string, unknown>) || {}
        if (meta.provider === 'ycloud') {
          await supabase
            .from('whatsapp_accounts')
            .update({
              status: 'disconnected',
              metadata: {
                ...meta,
                ban_state: banState || 'deleted',
                violation_type: violation,
                disconnected_at: new Date().toISOString(),
              },
            })
            .eq('id', acct.id)
        }
      }
    }
  }
}

function mapToMetaMessage(msg: YCloudInboundMessage) {
  const mapMedia = (m?: YCloudMedia) => {
    if (!m) return undefined
    return {
      id: m.id || '',
      mime_type: m.mime_type || '',
      sha256: m.sha256,
      caption: m.caption,
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
