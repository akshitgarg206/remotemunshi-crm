/**
 * WhatsApp Cloud API client wrapper
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

interface SendTextParams {
  phoneNumberId: string
  accessToken: string
  to: string
  body: string
  previewUrl?: boolean
}

interface SendMediaParams {
  phoneNumberId: string
  accessToken: string
  to: string
  type: 'image' | 'audio' | 'video' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
}

interface WhatsAppApiResponse {
  messaging_product: string
  contacts: { input: string; wa_id: string }[]
  messages: { id: string }[]
}

interface TokenExchangeResponse {
  access_token: string
  token_type: string
}

export async function sendTextMessage(params: SendTextParams): Promise<WhatsAppApiResponse> {
  const { phoneNumberId, accessToken, to, body, previewUrl = false } = params

  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
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
    throw new Error(`WhatsApp API error: ${res.status} ${JSON.stringify(err)}`)
  }

  return res.json()
}

export async function sendMediaMessage(params: SendMediaParams): Promise<WhatsAppApiResponse> {
  const { phoneNumberId, accessToken, to, type, mediaUrl, caption, filename } = params

  const mediaPayload: Record<string, unknown> = { link: mediaUrl }
  if (caption) mediaPayload.caption = caption
  if (filename && type === 'document') mediaPayload.filename = filename

  const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
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
    throw new Error(`WhatsApp API error: ${res.status} ${JSON.stringify(err)}`)
  }

  return res.json()
}

export async function markMessageRead(params: {
  phoneNumberId: string
  accessToken: string
  messageId: string
}): Promise<void> {
  await fetch(`${GRAPH_API_BASE}/${params.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
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
  accessToken: string
}): Promise<{ buffer: Buffer; mimeType: string }> {
  // Step 1: Get media URL from ID
  const metaRes = await fetch(`${GRAPH_API_BASE}/${params.mediaId}`, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  })
  if (!metaRes.ok) throw new Error(`Failed to get media URL: ${metaRes.status}`)
  const { url, mime_type } = await metaRes.json()

  // Step 2: Download actual media bytes
  const mediaRes = await fetch(url, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  })
  if (!mediaRes.ok) throw new Error(`Failed to download media: ${mediaRes.status}`)

  const arrayBuffer = await mediaRes.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), mimeType: mime_type }
}

export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResponse> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) throw new Error('Meta app credentials not configured')

  const res = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      `client_id=${appId}&client_secret=${appSecret}&code=${code}`,
    { method: 'GET' }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed: ${res.status} ${JSON.stringify(err)}`)
  }

  return res.json()
}

export async function getPhoneNumberDetails(params: {
  phoneNumberId: string
  accessToken: string
}): Promise<{
  display_phone_number: string
  verified_name: string
  quality_rating: string
}> {
  const res = await fetch(
    `${GRAPH_API_BASE}/${params.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
    { headers: { Authorization: `Bearer ${params.accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed to get phone details: ${res.status} ${JSON.stringify(err)}`)
  }

  return res.json()
}
