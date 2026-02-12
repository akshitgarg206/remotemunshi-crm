/**
 * WhatsApp media download → Supabase Storage upload
 * Uses ChakraHQ pass-through for media access
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { downloadMedia } from './client'

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
}): Promise<{ url: string; mimeType: string; size: number }> {
  const { supabase, mediaId, conversationId } = params

  // Download from WhatsApp via ChakraHQ pass-through
  const { buffer, mimeType } = await downloadMedia({ mediaId })

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
