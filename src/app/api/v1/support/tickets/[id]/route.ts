import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateTicketSchema } from '@/lib/validators/support-tickets'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      client:clients(id, business_name, contact_name, mobile, email),
      contact:contacts(id, name, email, phone),
      assigned_employee:employees!support_tickets_assigned_employee_id_fkey(id, name, email),
      assigned_department:departments(id, name),
      conversation:support_conversations(id, channel, status, subject),
      support_escalations(id, tier, status, priority, reason, from_employee_id, to_employee_id, to_department_id, created_at, resolved_at)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'communications', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateTicketSchema.parse(body)

  // Track first response and resolution timestamps
  const updateData: Record<string, unknown> = { ...validated }

  if (validated.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .update(updateData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'communications', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('support_tickets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
