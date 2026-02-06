import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateConversationSchema } from '@/lib/validators/support-conversations'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('support_conversations')
    .select(`
      *,
      client:clients(id, business_name, contact_name, mobile, email, city, state),
      contact:contacts(id, name, email, phone),
      assigned_employee:employees!support_conversations_assigned_employee_id_fkey(id, name, email),
      support_tickets(id, ticket_number, subject, status, priority, sla_due_at),
      support_messages(id, content, direction, message_type, is_internal, sender_employee_id, created_at, attachments, channel)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateConversationSchema.parse(body)

  const { data, error } = await supabase
    .from('support_conversations')
    .update(validated)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('support_conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
