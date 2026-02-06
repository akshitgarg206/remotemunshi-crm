import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateEscalationSchema } from '@/lib/validators/support-escalations'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('support_escalations')
    .select(`
      *,
      ticket:support_tickets(id, ticket_number, subject, status, priority, sla_due_at,
        client:clients(id, business_name),
        conversation:support_conversations(id, channel, status, subject)
      ),
      from_employee:employees!support_escalations_from_employee_id_fkey(id, name, email),
      to_employee:employees!support_escalations_to_employee_id_fkey(id, name, email),
      to_department:departments(id, name)
    `)
    .eq('id', params.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Escalation not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateEscalationSchema.parse(body)

  const updateData: Record<string, unknown> = { ...validated }

  if (validated.status === 'acknowledged') {
    updateData.acknowledged_at = new Date().toISOString()
  }
  if (validated.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('support_escalations')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
})
