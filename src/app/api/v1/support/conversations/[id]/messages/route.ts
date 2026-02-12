import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { createMessageSchema } from '@/lib/validators/support-messages'
import { sendTextMessage, sendMediaMessage } from '@/lib/whatsapp/client'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { page, pageSize, offset } = parsePagination(req, { defaultPageSize: 50 })

  const { data, error, count } = await supabase
    .from('support_messages')
    .select(`
      *,
      sender:employees!support_messages_sender_employee_id_fkey(id, name, email)
    `, { count: 'exact' })
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'communications', action: 'read' } })

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const validated = createMessageSchema.parse(body)

  const { data: message, error } = await supabase
    .from('support_messages')
    .insert({
      ...validated,
      conversation_id: params.id,
      sender_employee_id: validated.direction === 'outbound' ? employeeId : null,
    })
    .select(`
      *,
      sender:employees!support_messages_sender_employee_id_fkey(id, name, email)
    `)
    .single()

  if (error) throw error

  // Update conversation last_message_at, preview, and unread_count
  const updateData: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
    last_message_preview: validated.content.substring(0, 200),
  }

  if (validated.direction === 'inbound' && !validated.is_internal) {
    // Increment unread count for inbound customer messages
    const { data: conv } = await supabase
      .from('support_conversations')
      .select('unread_count')
      .eq('id', params.id)
      .single()
    updateData.unread_count = (conv?.unread_count || 0) + 1
  }

  if (!validated.is_internal) {
    await supabase
      .from('support_conversations')
      .update(updateData)
      .eq('id', params.id)
  }

  // Send outbound message via WhatsApp if applicable
  if (validated.direction === 'outbound' && !validated.is_internal && message) {
    try {
      const { data: conv } = await supabase
        .from('support_conversations')
        .select('channel, contact_id, metadata')
        .eq('id', params.id)
        .single()

      console.log('WhatsApp outbound check:', { channel: conv?.channel, contact_id: conv?.contact_id, metadata: conv?.metadata })

      if (conv?.channel === 'whatsapp') {
        const convMeta = (conv.metadata as Record<string, string>) || {}
        const phoneNumberId = convMeta.phone_number_id

        if (!phoneNumberId) {
          console.error('WhatsApp outbound: no phone_number_id in conversation metadata')
        }

        if (phoneNumberId) {
          // Get recipient phone from contact
          const { data: contact } = await supabase
            .from('contacts')
            .select('mobile')
            .eq('id', conv.contact_id)
            .single()

          console.log('WhatsApp outbound: contact lookup:', { contact_id: conv.contact_id, mobile: contact?.mobile })

          if (contact?.mobile) {
            const recipientPhone = contact.mobile.replace(/\D/g, '')

            let waResponse
            if (validated.message_type === 'text' || !validated.attachments?.length) {
              waResponse = await sendTextMessage({
                phoneNumberId,
                to: recipientPhone,
                body: validated.content,
              })
            } else if (validated.attachments?.length) {
              const attachment = validated.attachments[0]
              const mediaType = validated.message_type === 'image' ? 'image'
                : validated.message_type === 'audio' ? 'audio'
                : validated.message_type === 'video' ? 'video'
                : 'document'

              waResponse = await sendMediaMessage({
                phoneNumberId,
                to: recipientPhone,
                type: mediaType,
                mediaUrl: attachment.url,
                caption: validated.content !== attachment.name ? validated.content : undefined,
                filename: attachment.name,
              })
            }

            console.log('WhatsApp outbound result:', { waResponse: JSON.stringify(waResponse) })

            // Store WhatsApp message ID in message metadata for delivery tracking
            if (waResponse?.messages?.[0]?.id) {
              const msgMeta = (message.metadata as Record<string, unknown>) || {}
              await supabase
                .from('support_messages')
                .update({
                  metadata: {
                    ...msgMeta,
                    whatsapp_message_id: waResponse.messages[0].id,
                    phone_number_id: phoneNumberId,
                  },
                })
                .eq('id', message.id)
            }
          }
        }
      }
    } catch (waError) {
      // Log but don't fail the API response — message is saved in DB
      console.error('Failed to send WhatsApp message:', waError)
    }
  }

  return NextResponse.json({ success: true, data: message }, { status: 201 })
}, { requirePermission: { module: 'communications', action: 'create' } })
