/**
 * WhatsApp client — routes through ChakraHQ pass-through API
 * ChakraHQ proxies to Meta Cloud API using same request format
 */

const CHAKRA_API_BASE = 'https://api.chakrahq.com/v1/ext/plugin/whatsapp'
const WA_API_VERSION = 'v21.0'

function getConfig() {
  const pluginId = process.env.CHAKRA_PLUGIN_ID
  const accessToken = process.env.CHAKRA_ACCESS_TOKEN
  if (!pluginId || !accessToken) {
    throw new Error('ChakraHQ not configured. Set CHAKRA_PLUGIN_ID and CHAKRA_ACCESS_TOKEN env vars.')
  }
  return { pluginId, accessToken }
}

function getMessagesUrl(phoneNumberId: string): string {
  const { pluginId } = getConfig()
  return `${CHAKRA_API_BASE}/${pluginId}/api/${WA_API_VERSION}/${phoneNumberId}/messages`
}

function getMediaInfoUrl(mediaId: string): string {
  const { pluginId } = getConfig()
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
  const { accessToken } = getConfig()

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
      type: 'text',
      text: { preview_url: previewUrl, body },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`WhatsApp send error: ${res.status} ${JSON.stringify(err)}`)
  }

  return parseResponse(await res.json())
}

export async function sendMediaMessage(params: SendMediaParams): Promise<WhatsAppApiResponse> {
  const { phoneNumberId, to, type, mediaUrl, caption, filename } = params
  const { accessToken } = getConfig()

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
  const { accessToken } = getConfig()

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
  const { accessToken } = getConfig()

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
  const { accessToken } = getConfig()

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

/**
 * Discover connected WhatsApp phone numbers via ChakraHQ config
 */
export async function discoverPhoneNumbers(): Promise<{
  pluginId: string
  phoneNumbers: { phoneNumberId: string; displayNumber: string; verifiedName: string }[]
}> {
  const { pluginId, accessToken } = getConfig()

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
