/**
 * Process inbound WhatsApp messages and status updates
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { downloadAndUploadMedia } from './media'
import type { WhatsAppProvider } from './client'

// WhatsApp webhook payload types
interface WhatsAppWebhookEntry {
  id: string
  changes: WhatsAppChange[]
}

interface WhatsAppChange {
  value: {
    messaging_product: string
    metadata: { display_phone_number: string; phone_number_id: string }
    contacts?: WhatsAppContact[]
    messages?: WhatsAppMessage[]
    statuses?: WhatsAppStatus[]
  }
  field: string
}

interface WhatsAppContact {
  profile: { name: string }
  wa_id: string
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'reaction' | 'button' | 'interactive'
  text?: { body: string }
  image?: WhatsAppMediaInfo
  audio?: WhatsAppMediaInfo
  video?: WhatsAppMediaInfo
  document?: WhatsAppMediaInfo & { filename?: string }
  sticker?: WhatsAppMediaInfo
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  contacts?: unknown[]
  reaction?: { message_id: string; emoji: string }
  button?: { text: string; payload: string }
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } }
}

interface WhatsAppMediaInfo {
  id: string
  mime_type: string
  sha256?: string
  caption?: string
  _ycloud_link?: string
}

interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: { code: number; title: string }[]
}

export interface WebhookPayload {
  object: string
  entry: WhatsAppWebhookEntry[]
}

/**
 * Normalize phone number: strip leading + and any non-digit characters
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Map WhatsApp message type → OmniDesk message_type
 */
function mapMessageType(waType: string): 'text' | 'image' | 'file' | 'audio' | 'video' {
  switch (waType) {
    case 'text':
    case 'button':
    case 'interactive':
    case 'reaction':
    case 'location':
    case 'contacts':
      return 'text'
    case 'image':
    case 'sticker':
      return 'image'
    case 'audio':
      return 'audio'
    case 'video':
      return 'video'
    case 'document':
      return 'file'
    default:
      return 'text'
  }
}

/**
 * Extract text content from any message type
 */
function extractContent(msg: WhatsAppMessage): string {
  switch (msg.type) {
    case 'text':
      return msg.text?.body || ''
    case 'image':
      return msg.image?.caption || '[Image]'
    case 'audio':
      return '[Audio message]'
    case 'video':
      return msg.video?.caption || '[Video]'
    case 'document':
      return msg.document?.caption || `[Document: ${msg.document?.filename || 'file'}]`
    case 'sticker':
      return '[Sticker]'
    case 'location':
      return msg.location?.name || msg.location?.address || `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`
    case 'contacts':
      return '[Contact card]'
    case 'reaction':
      return msg.reaction?.emoji || '[Reaction]'
    case 'button':
      return msg.button?.text || '[Button reply]'
    case 'interactive':
      return msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive reply]'
    default:
      return '[Unsupported message type]'
  }
}

/**
 * Process a single inbound WhatsApp message
 */
export async function processInboundMessage(params: {
  supabase: SupabaseClient
  message: WhatsAppMessage
  contact: WhatsAppContact
  phoneNumberId: string
  displayPhoneNumber: string
  provider?: WhatsAppProvider
}): Promise<void> {
  const { supabase, message, contact, phoneNumberId, displayPhoneNumber, provider } = params
  const senderPhone = normalizePhone(contact.wa_id)
  const senderName = contact.profile.name

  // 1. Find or create contact by mobile
  let dbContact = await findContactByPhone(supabase, senderPhone)
  if (!dbContact) {
    dbContact = await createContact(supabase, senderName, senderPhone)
  }

  // 2. Find or create open conversation for this contact + channel + phone_number_id
  let conversation = await findOpenConversation(supabase, dbContact.id, phoneNumberId)
  if (!conversation) {
    conversation = await createConversation(supabase, dbContact, phoneNumberId, displayPhoneNumber)
  }

  // 3. Handle media attachments
  const attachments: { name: string; url: string; type: string; size?: number }[] = []
  const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'] as const

  for (const mt of mediaTypes) {
    const mediaData = message[mt as keyof WhatsAppMessage] as WhatsAppMediaInfo | undefined
    if (message.type === mt && mediaData) {
      try {
        const uploaded = await downloadAndUploadMedia({
          supabase,
          mediaId: mediaData.id,
          conversationId: conversation.id,
          provider,
          mediaUrl: mediaData._ycloud_link,
        })
        attachments.push({
          name: (mt === 'document' && message.document?.filename) || `${mt}.${uploaded.mimeType.split('/')[1] || 'bin'}`,
          url: uploaded.url,
          type: uploaded.mimeType,
          size: uploaded.size,
        })
      } catch (err) {
        console.error(`Failed to download ${mt} media:`, err)
      }
    }
  }

  // 4. Extract text content
  const content = extractContent(message)

  // 5. Insert message
  const { error: msgError } = await supabase
    .from('support_messages')
    .insert({
      conversation_id: conversation.id,
      direction: 'inbound',
      message_type: mapMessageType(message.type),
      content,
      channel: 'whatsapp',
      attachments: attachments.length > 0 ? attachments : [],
      metadata: {
        whatsapp_message_id: message.id,
        phone_number_id: phoneNumberId,
        sender_phone: senderPhone,
        sender_name: senderName,
        original_type: message.type,
      },
    })

  if (msgError) {
    console.error('Failed to insert message:', msgError)
    return
  }

  // 6. Update conversation
  const { data: conv } = await supabase
    .from('support_conversations')
    .select('unread_count')
    .eq('id', conversation.id)
    .single()

  await supabase
    .from('support_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 200),
      unread_count: (conv?.unread_count || 0) + 1,
      status: 'open',
    })
    .eq('id', conversation.id)
}

/**
 * Process delivery status updates
 */
export async function processStatusUpdate(params: {
  supabase: SupabaseClient
  status: WhatsAppStatus
}): Promise<void> {
  const { supabase, status } = params

  // Find message by whatsapp_message_id in metadata
  const { data: messages } = await supabase
    .from('support_messages')
    .select('id, metadata')
    .eq('metadata->>whatsapp_message_id', status.id)
    .limit(1)

  if (!messages?.length) return

  const message = messages[0]
  const metadata = (message.metadata as Record<string, unknown>) || {}

  await supabase
    .from('support_messages')
    .update({
      metadata: {
        ...metadata,
        delivery_status: status.status,
        delivery_timestamp: status.timestamp,
        ...(status.errors?.length ? { delivery_errors: status.errors } : {}),
      },
    })
    .eq('id', message.id)
}

// ---- Helper functions ----

async function findContactByPhone(supabase: SupabaseClient, phone: string) {
  // Try exact match first, then with/without country code variations
  const { data } = await supabase
    .from('contacts')
    .select('id, name, email, mobile')
    .or(`mobile.eq.${phone},mobile.eq.+${phone},mobile.eq.${phone.replace(/^91/, '')}`)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  return data
}

async function createContact(supabase: SupabaseClient, name: string, phone: string) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      name,
      mobile: phone,
      notes: 'Auto-created from WhatsApp',
    })
    .select('id, name, email, mobile')
    .single()

  if (error) throw new Error(`Failed to create contact: ${error.message}`)
  return data
}

async function findOpenConversation(supabase: SupabaseClient, contactId: string, phoneNumberId: string) {
  const { data } = await supabase
    .from('support_conversations')
    .select('id, unread_count, metadata')
    .eq('contact_id', contactId)
    .eq('channel', 'whatsapp')
    .in('status', ['open', 'waiting'])
    .eq('metadata->>phone_number_id', phoneNumberId)
    .is('deleted_at', null)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function createConversation(
  supabase: SupabaseClient,
  contact: { id: string; name: string },
  phoneNumberId: string,
  displayPhoneNumber: string
) {
  const { data, error } = await supabase
    .from('support_conversations')
    .insert({
      contact_id: contact.id,
      channel: 'whatsapp',
      status: 'open',
      subject: `WhatsApp: ${contact.name}`,
      metadata: {
        phone_number_id: phoneNumberId,
        display_phone_number: displayPhoneNumber,
      },
    })
    .select('id, unread_count, metadata')
    .single()

  if (error) throw new Error(`Failed to create conversation: ${error.message}`)
  return data
}
