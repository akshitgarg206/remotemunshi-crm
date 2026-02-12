/**
 * WhatsApp media download → Supabase Storage upload
 * Uses ChakraHQ pass-through for media access
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { downloadMedia, downloadMediaYCloud, type WhatsAppProvider } from './client'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/aac': 'aac',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/amr': 'amr',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
}

export async function downloadAndUploadMedia(params: {
  supabase: SupabaseClient
  mediaId: string
  conversationId: string
  provider?: WhatsAppProvider
  mediaUrl?: string
}): Promise<{ url: string; mimeType: string; size: number }> {
  const { supabase, mediaId, conversationId, provider, mediaUrl } = params

  // Download from WhatsApp — YCloud gives direct URLs, ChakraHQ uses media ID lookup
  let buffer: Buffer
  let mimeType: string
  if (provider === 'ycloud' && mediaUrl) {
    const result = await downloadMediaYCloud({ mediaUrl })
    buffer = result.buffer
    mimeType = result.mimeType
  } else {
    const result = await downloadMedia({ mediaId })
    buffer = result.buffer
    mimeType = result.mimeType
  }

  // Determine file extension
  const ext = MIME_TO_EXT[mimeType] || 'bin'
  const filename = `whatsapp/${conversationId}/${mediaId}.${ext}`

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from('attachments')
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('attachments')
    .getPublicUrl(filename)

  return {
    url: urlData.publicUrl,
    mimeType,
    size: buffer.length,
  }
}
