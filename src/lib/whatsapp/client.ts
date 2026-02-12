/**
 * WhatsApp client — multi-provider support (ChakraHQ + YCloud)
 * Provider is stored in whatsapp_accounts.metadata.provider
 */

import { SupabaseClient } from '@supabase/supabase-js'

export type WhatsAppProvider = 'chakrahq' | 'ycloud'

// ---- ChakraHQ config ----

const CHAKRA_API_BASE = 'https://api.chakrahq.com/v1/ext/plugin/whatsapp'
const WA_API_VERSION = 'v21.0'

function getChakraConfig() {
  const pluginId = process.env.CHAKRA_PLUGIN_ID
  const accessToken = process.env.CHAKRA_ACCESS_TOKEN
  if (!pluginId || !accessToken) {
    throw new Error('ChakraHQ not configured. Set CHAKRA_PLUGIN_ID and CHAKRA_ACCESS_TOKEN env vars.')
  }
  return { pluginId, accessToken }
}

// ---- YCloud config ----

const YCLOUD_API_BASE = 'https://api.ycloud.com/v2'

function getYCloudConfig() {
  const apiKey = process.env.YCLOUD_API_KEY
  if (!apiKey) {
    throw new Error('YCloud not configured. Set YCLOUD_API_KEY env var.')
  }
  return { apiKey }
}

// ---- Provider detection ----

export async function getProviderForPhoneNumberId(
  supabase: SupabaseClient,
  phoneNumberId: string
): Promise<WhatsAppProvider> {
  const { data } = await supabase
    .from('whatsapp_accounts')
    .select('metadata')
    .eq('phone_number_id', phoneNumberId)
    .limit(1)
    .maybeSingle()

  const meta = (data?.metadata as Record<string, unknown>) || {}
  return (meta.provider as WhatsAppProvider) || 'chakrahq'
}

function getMessagesUrl(phoneNumberId: string): string {
  const { pluginId } = getChakraConfig()
  return `${CHAKRA_API_BASE}/${pluginId}/api/${WA_API_VERSION}/${phoneNumberId}/messages`
}

function getMediaInfoUrl(mediaId: string): string {
  const { pluginId } = getChakraConfig()
  return `${CHAKRA_API_BASE}/${pluginId}/api/${WA_API_VERSION}/${mediaId}`
}

interface SendTextParams {
  phoneNumberId: string
  to: string
  body: string
  previewUrl?: boolean
}

interface SendMediaParams {
  phoneNumberId: string
  to: string
  type: 'image' | 'audio' | 'video' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
}

interface SendTemplateParams {
  phoneNumberId: string
  to: string
  templateName: string
  languageCode?: string
  components?: unknown[]
}

export interface WhatsAppApiResponse {
  messaging_product: string
  contacts: { input: string; wa_id: string }[]
  messages: { id: string }[]
}

/**
 * Parse ChakraHQ's response to a normalized WhatsAppApiResponse.
 * ChakraHQ returns { _data: { whatsappMessageId } } for pass-through,
 * or the raw Meta response depending on the endpoint.
 */
function parseResponse(raw: Record<string, unknown>): WhatsAppApiResponse {
  // ChakraHQ wrapper format
  if (raw._data && typeof raw._data === 'object') {
    const data = raw._data as Record<string, unknown>
    const msgId = (data.whatsappMessageId as string) || ''
    return {
      messaging_product: 'whatsapp',
      contacts: [],
      messages: [{ id: msgId }],
    }
  }
  // Raw Meta format (if pass-through returns it directly)
  return raw as unknown as WhatsAppApiResponse
}

export async function sendTextMessage(params: SendTextParams): Promise<WhatsAppApiResponse> {
  const { phoneNumberId, to, body, previewUrl = false } = params
  const { accessToken } = getChakraConfig()

  const url = getMessagesUrl(phoneNumberId)
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: previewUrl, body },
  }

  console.log('WhatsApp sendTextMessage:', { url, to, phoneNumberId })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const rawJson = await res.json().catch(() => ({}))
  console.log('WhatsApp sendTextMessage response:', { status: res.status, ok: res.ok, body: JSON.stringify(rawJson) })

  if (!res.ok) {
    throw new Error(`WhatsApp send error: ${res.status} ${JSON.stringify(rawJson)}`)
  }

  return parseResponse(rawJson as Record<string, unknown>)
}

export async function sendMediaMessage(params: SendMediaParams): Promise<WhatsAppApiResponse> {
  const { phoneNumberId, to, type, mediaUrl, caption, filename } = params
  const { accessToken } = getChakraConfig()

  const mediaPayload: Record<string, unknown> = { link: mediaUrl }
  if (caption) mediaPayload.caption = caption
  if (filename && type === 'document') mediaPayload.filename = filename

  const res = await fetch(getMessagesUrl(phoneNumberId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      [type]: mediaPayload,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`WhatsApp send error: ${res.status} ${JSON.stringify(err)}`)
  }

  return parseResponse(await res.json())
}

export async function sendTemplateMessage(params: SendTemplateParams): Promise<WhatsAppApiResponse> {
  const { phoneNumberId, to, templateName, languageCode = 'en', components } = params
  const { accessToken } = getChakraConfig()

  const res = await fetch(getMessagesUrl(phoneNumberId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components ? { components } : {}),
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`WhatsApp template send error: ${res.status} ${JSON.stringify(err)}`)
  }

  return parseResponse(await res.json())
}

export async function markMessageRead(params: {
  phoneNumberId: string
  messageId: string
}): Promise<void> {
  const { accessToken } = getChakraConfig()

  await fetch(getMessagesUrl(params.phoneNumberId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: params.messageId,
    }),
  })
}

export async function downloadMedia(params: {
  mediaId: string
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const { accessToken } = getChakraConfig()

  // Step 1: Get media URL from ID (through ChakraHQ pass-through)
  const metaRes = await fetch(getMediaInfoUrl(params.mediaId), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!metaRes.ok) throw new Error(`Failed to get media URL: ${metaRes.status}`)

  const metaData = await metaRes.json()
  // ChakraHQ may wrap in _data or return raw
  const mediaInfo = metaData._data || metaData
  const url = mediaInfo.url
  const mimeType = mediaInfo.mime_type

  // Step 2: Download actual media bytes
  // Try through ChakraHQ first (the URL might be a Meta URL requiring their token)
  const mediaRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!mediaRes.ok) throw new Error(`Failed to download media: ${mediaRes.status}`)

  const arrayBuffer = await mediaRes.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), mimeType: mimeType || 'application/octet-stream' }
}

// ---- ChakraHQ Chat APIs (non-pass-through, ChakraHQ's own endpoints) ----

const CHAKRA_CHAT_BASE = 'https://api.chakrahq.com/v1/ext'

export interface ChakraChat {
  id: string
  provider: string
  providerHandle: string
  providerHandleId: string
  initiatedDirection: string
  primaryContact: {
    id: string
    name: string
    firstName: string
    lastName: string
    photo: string | null
  } | null
  primaryContactHandle: {
    id: string
    value: string
    type: string
  } | null
  latestMessage: {
    text: string
    direction: string
    timestamp: number
    dataType: string
  } | null
  latestMessageTs: number
  status: string
  createdAt: number
  updatedAt: number
}

export interface ChakraChatMessage {
  id: string
  chat: string
  externalId: string
  provider: string
  dataType: string
  body: { text?: { body: string }; [key: string]: unknown } | null
  text: string
  attachments: { url: string; type: string; name?: string }[] | null
  deliveryStatus: string
  direction: string
  timestamp: number
  createdAt: number
  updatedAt: number
}

/**
 * List all chats from ChakraHQ (paginated, max 100 per page)
 */
export async function listChats(params?: { page?: number; limit?: number }): Promise<ChakraChat[]> {
  const { accessToken } = getChakraConfig()
  const res = await fetch(`${CHAKRA_CHAT_BASE}/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderField: 'updatedAt',
      limit: params?.limit || 100,
      page: params?.page || 1,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ChakraHQ list chats error: ${res.status} ${JSON.stringify(err)}`)
  }

  const json = await res.json()
  return (json._data || []) as ChakraChat[]
}

/**
 * List messages for a specific chat (paginated, max 1000 per page)
 */
export async function listChatMessages(chatId: string, params?: { page?: number; limit?: number }): Promise<ChakraChatMessage[]> {
  const { accessToken } = getChakraConfig()
  const res = await fetch(`${CHAKRA_CHAT_BASE}/chat/${chatId}/message`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: params?.limit || 1000,
      page: params?.page || 1,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ChakraHQ list messages error: ${res.status} ${JSON.stringify(err)}`)
  }

  const json = await res.json()
  return (json._data || []) as ChakraChatMessage[]
}

/**
 * Discover connected WhatsApp phone numbers via ChakraHQ config
 */
export async function discoverPhoneNumbers(): Promise<{
  pluginId: string
  phoneNumbers: { phoneNumberId: string; displayNumber: string; verifiedName: string }[]
}> {
  const { pluginId, accessToken } = getChakraConfig()

  // Try the config endpoint first
  const configRes = await fetch(`${CHAKRA_API_BASE.replace('/plugin/whatsapp', '')}/config`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (configRes.ok) {
    const config = await configRes.json()
    // Extract phone number info from config if available
    const data = config._data || config
    if (data.whatsappPhoneNumbers || data.phoneNumbers) {
      const numbers = data.whatsappPhoneNumbers || data.phoneNumbers || []
      return {
        pluginId,
        phoneNumbers: Array.isArray(numbers)
          ? numbers.map((n: Record<string, string>) => ({
              phoneNumberId: n.phoneNumberId || n.phone_number_id || n.id || '',
              displayNumber: n.displayPhoneNumber || n.display_phone_number || n.phoneNumber || '',
              verifiedName: n.verifiedName || n.verified_name || n.name || '',
            }))
          : [],
      }
    }
  }

  return { pluginId, phoneNumbers: [] }
}

// ---- YCloud send functions ----

export async function ycloudSendText(params: {
  from: string
  to: string
  body: string
}): Promise<WhatsAppApiResponse> {
  const { apiKey } = getYCloudConfig()

  const res = await fetch(`${YCLOUD_API_BASE}/whatsapp/messages/sendDirectly`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      type: 'text',
      text: { body: params.body },
    }),
  })

  const rawJson = await res.json().catch(() => ({}))
  console.log('YCloud sendText response:', { status: res.status, body: JSON.stringify(rawJson) })

  if (!res.ok) {
    throw new Error(`YCloud send error: ${res.status} ${JSON.stringify(rawJson)}`)
  }

  return {
    messaging_product: 'whatsapp',
    contacts: [{ input: params.to, wa_id: params.to }],
    messages: [{ id: rawJson.wabaMessageId || rawJson.id || '' }],
  }
}

export async function ycloudSendMedia(params: {
  from: string
  to: string
  type: 'image' | 'audio' | 'video' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
}): Promise<WhatsAppApiResponse> {
  const { apiKey } = getYCloudConfig()

  const mediaPayload: Record<string, unknown> = { link: params.mediaUrl }
  if (params.caption) mediaPayload.caption = params.caption
  if (params.filename && params.type === 'document') mediaPayload.filename = params.filename

  const res = await fetch(`${YCLOUD_API_BASE}/whatsapp/messages/sendDirectly`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      type: params.type,
      [params.type]: mediaPayload,
    }),
  })

  const rawJson = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`YCloud media send error: ${res.status} ${JSON.stringify(rawJson)}`)
  }

  return {
    messaging_product: 'whatsapp',
    contacts: [{ input: params.to, wa_id: params.to }],
    messages: [{ id: rawJson.wabaMessageId || rawJson.id || '' }],
  }
}

export async function ycloudSendTemplate(params: {
  from: string
  to: string
  templateName: string
  languageCode?: string
  components?: unknown[]
}): Promise<WhatsAppApiResponse> {
  const { apiKey } = getYCloudConfig()

  const res = await fetch(`${YCLOUD_API_BASE}/whatsapp/messages/sendDirectly`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode || 'en' },
        ...(params.components ? { components: params.components } : {}),
      },
    }),
  })

  const rawJson = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`YCloud template send error: ${res.status} ${JSON.stringify(rawJson)}`)
  }

  return {
    messaging_product: 'whatsapp',
    contacts: [{ input: params.to, wa_id: params.to }],
    messages: [{ id: rawJson.wabaMessageId || rawJson.id || '' }],
  }
}

export async function downloadMediaYCloud(params: {
  mediaUrl: string
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const { apiKey } = getYCloudConfig()

  const res = await fetch(params.mediaUrl, {
    headers: { 'X-API-Key': apiKey },
  })
  if (!res.ok) throw new Error(`YCloud media download failed: ${res.status}`)

  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  const arrayBuffer = await res.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), mimeType: contentType }
}

// ---- Unified dispatch (provider-aware) ----

export async function sendTextMessageForConversation(params: {
  supabase: SupabaseClient
  phoneNumberId: string
  to: string
  body: string
}): Promise<WhatsAppApiResponse> {
  const { supabase, phoneNumberId, to, body } = params
  const provider = await getProviderForPhoneNumberId(supabase, phoneNumberId)

  if (provider === 'ycloud') {
    // YCloud uses display_phone_number as `from` (E.164)
    const { data: acct } = await supabase
      .from('whatsapp_accounts')
      .select('display_phone_number')
      .eq('phone_number_id', phoneNumberId)
      .single()
    const from = acct?.display_phone_number?.replace(/\D/g, '') || ''
    return ycloudSendText({ from, to, body })
  }

  return sendTextMessage({ phoneNumberId, to, body })
}

export async function sendMediaMessageForConversation(params: {
  supabase: SupabaseClient
  phoneNumberId: string
  to: string
  type: 'image' | 'audio' | 'video' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
}): Promise<WhatsAppApiResponse> {
  const { supabase, phoneNumberId, to, type, mediaUrl, caption, filename } = params
  const provider = await getProviderForPhoneNumberId(supabase, phoneNumberId)

  if (provider === 'ycloud') {
    const { data: acct } = await supabase
      .from('whatsapp_accounts')
      .select('display_phone_number')
      .eq('phone_number_id', phoneNumberId)
      .single()
    const from = acct?.display_phone_number?.replace(/\D/g, '') || ''
    return ycloudSendMedia({ from, to, type, mediaUrl, caption, filename })
  }

  return sendMediaMessage({ phoneNumberId, to, type, mediaUrl, caption, filename })
}
