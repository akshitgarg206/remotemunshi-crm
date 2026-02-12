import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { listChats, listChatMessages, type ChakraChat, type ChakraChatMessage } from '@/lib/whatsapp/client'

/**
 * POST — Sync WhatsApp chat history from ChakraHQ into OmniDesk
 * Pulls all chats + messages, creates contacts/conversations/messages in Supabase
 */
export const POST = apiHandler(async (req, { supabase }) => {
  // Use admin client to bypass RLS for bulk inserts
  const admin = createAdminClient()

  // Get whatsapp account info for phone_number_id
  const { data: waAccounts } = await supabase
    .from('whatsapp_accounts')
    .select('phone_number_id, display_phone_number')
    .order('created_at', { ascending: true })
    .limit(1)

  const waAccount = waAccounts?.[0]
  if (!waAccount) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_ACCOUNT', message: 'No WhatsApp account configured. Add one in Settings > WhatsApp first.' } },
      { status: 400 }
    )
  }

  const stats = { chats: 0, messages: 0, contacts: 0, skipped: 0, errors: [] as string[] }

  // Fetch all chats from ChakraHQ (paginate through all pages)
  let allChats: ChakraChat[] = []
  let page = 1
  while (true) {
    const batch = await listChats({ page, limit: 100 })
    if (!batch.length) break
    allChats = allChats.concat(batch)
    if (batch.length < 100) break
    page++
  }

  console.log(`WhatsApp sync: found ${allChats.length} chats from ChakraHQ`)

  for (const chat of allChats) {
    try {
      if (chat.provider !== 'WHATSAPP') continue

      // Extract phone number from chat
      const phoneNumber = chat.providerHandle || chat.primaryContactHandle?.value || ''
      if (!phoneNumber) {
        stats.skipped++
        continue
      }

      const normalizedPhone = phoneNumber.replace(/\D/g, '')
      const contactName = chat.primaryContact?.name
        || [chat.primaryContact?.firstName, chat.primaryContact?.lastName].filter(Boolean).join(' ')
        || `WhatsApp ${normalizedPhone}`

      // Find or create contact
      const { data: existingContact } = await admin
        .from('contacts')
        .select('id, name')
        .or(`mobile.eq.${normalizedPhone},mobile.eq.+${normalizedPhone},mobile.eq.${normalizedPhone.replace(/^91/, '')}`)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      let contactId: string
      if (existingContact) {
        contactId = existingContact.id
      } else {
        const { data: newContact, error: contactErr } = await admin
          .from('contacts')
          .insert({ name: contactName, mobile: normalizedPhone, notes: 'Imported from ChakraHQ' })
          .select('id')
          .single()
        if (contactErr) {
          stats.errors.push(`Contact create failed for ${normalizedPhone}: ${contactErr.message}`)
          continue
        }
        contactId = newContact.id
        stats.contacts++
      }

      // Check if conversation already exists for this contact + whatsapp
      const { data: existingConv } = await admin
        .from('support_conversations')
        .select('id')
        .eq('contact_id', contactId)
        .eq('channel', 'whatsapp')
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle()

      let conversationId: string
      if (existingConv) {
        conversationId = existingConv.id
      } else {
        const { data: newConv, error: convErr } = await admin
          .from('support_conversations')
          .insert({
            contact_id: contactId,
            channel: 'whatsapp',
            status: chat.status === 'CLOSED' ? 'closed' : 'open',
            subject: `WhatsApp: ${contactName}`,
            last_message_at: chat.latestMessageTs ? new Date(chat.latestMessageTs).toISOString() : new Date().toISOString(),
            last_message_preview: chat.latestMessage?.text?.substring(0, 200) || '',
            metadata: {
              phone_number_id: waAccount.phone_number_id,
              display_phone_number: waAccount.display_phone_number?.replace(/\D/g, ''),
              chakra_chat_id: chat.id,
            },
          })
          .select('id')
          .single()

        if (convErr) {
          stats.errors.push(`Conversation create failed for ${contactName}: ${convErr.message}`)
          continue
        }
        conversationId = newConv.id
        stats.chats++
      }

      // Fetch all messages for this chat
      let allMessages: ChakraChatMessage[] = []
      let msgPage = 1
      while (true) {
        const batch = await listChatMessages(chat.id, { page: msgPage, limit: 1000 })
        if (!batch.length) break
        allMessages = allMessages.concat(batch)
        if (batch.length < 1000) break
        msgPage++
      }

      if (!allMessages.length) continue

      // Check which messages already exist (by external ID in metadata)
      const externalIds = allMessages.map(m => m.externalId).filter(Boolean)
      const { data: existingMsgs } = await admin
        .from('support_messages')
        .select('metadata')
        .eq('conversation_id', conversationId)
        .not('metadata', 'is', null)

      const existingExternalIds = new Set(
        (existingMsgs || [])
          .map(m => (m.metadata as Record<string, unknown>)?.chakra_message_id || (m.metadata as Record<string, unknown>)?.whatsapp_message_id)
          .filter(Boolean)
      )

      // Prepare messages for bulk insert (skip duplicates)
      const newMessages = allMessages
        .filter(m => !existingExternalIds.has(m.externalId) && !existingExternalIds.has(m.id))
        .map(m => ({
          conversation_id: conversationId,
          direction: m.direction === 'OUTBOUND' ? 'outbound' as const : 'inbound' as const,
          message_type: mapChakraDataType(m.dataType),
          content: m.text || m.body?.text?.body || extractContentFromBody(m) || '[No content]',
          channel: 'whatsapp' as const,
          attachments: m.attachments || [],
          is_internal: false,
          created_at: m.timestamp ? new Date(m.timestamp).toISOString() : new Date(m.createdAt).toISOString(),
          metadata: {
            chakra_message_id: m.id,
            whatsapp_message_id: m.externalId || null,
            delivery_status: m.deliveryStatus?.toLowerCase() || null,
            imported: true,
          },
        }))

      if (newMessages.length) {
        // Insert in batches of 100
        for (let i = 0; i < newMessages.length; i += 100) {
          const batch = newMessages.slice(i, i + 100)
          const { error: insertErr } = await admin.from('support_messages').insert(batch)
          if (insertErr) {
            stats.errors.push(`Message insert failed for chat ${chat.id} batch ${i}: ${insertErr.message}`)
          } else {
            stats.messages += batch.length
          }
        }

        // Update conversation last_message_at from the latest message
        const latest = newMessages[newMessages.length - 1]
        await admin
          .from('support_conversations')
          .update({
            last_message_at: latest.created_at,
            last_message_preview: latest.content.substring(0, 200),
          })
          .eq('id', conversationId)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      stats.errors.push(`Chat ${chat.id}: ${errMsg}`)
      console.error(`WhatsApp sync error for chat ${chat.id}:`, err)
    }
  }

  console.log('WhatsApp sync complete:', stats)

  return NextResponse.json({
    success: true,
    data: {
      chats_imported: stats.chats,
      messages_imported: stats.messages,
      contacts_created: stats.contacts,
      chats_skipped: stats.skipped,
      errors: stats.errors.slice(0, 20), // cap error list
    },
  })
}, { requirePermission: { module: 'settings', action: 'create' } })

function mapChakraDataType(dataType: string): 'text' | 'image' | 'file' | 'audio' | 'video' {
  switch (dataType?.toLowerCase()) {
    case 'image': return 'image'
    case 'audio': return 'audio'
    case 'video': return 'video'
    case 'document': return 'file'
    default: return 'text'
  }
}

function extractContentFromBody(msg: ChakraChatMessage): string {
  if (!msg.body) return ''
  // Try various nested formats ChakraHQ might use
  if (msg.body.text?.body) return msg.body.text.body
  if (typeof msg.body === 'string') return msg.body
  // Image/video/doc with caption
  for (const key of ['image', 'video', 'document', 'audio'] as const) {
    const media = msg.body[key] as Record<string, unknown> | undefined
    if (media?.caption) return media.caption as string
  }
  return ''
}
