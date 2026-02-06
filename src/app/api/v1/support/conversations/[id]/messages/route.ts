import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { createMessageSchema } from '@/lib/validators/support-messages'

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
})

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

  return NextResponse.json({ success: true, data: message }, { status: 201 })
})
