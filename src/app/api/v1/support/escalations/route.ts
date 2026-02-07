import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createEscalationSchema } from '@/lib/validators/support-escalations'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortOrder } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'tier', 'to_department_id', 'to_employee_id', 'priority'])

  let query = supabase
    .from('support_escalations')
    .select(`
      *,
      ticket:support_tickets(id, ticket_number, subject, status, priority, client_id, conversation_id,
        client:clients(id, business_name),
        conversation:support_conversations(id, channel, subject)
      ),
      from_employee:employees!support_escalations_from_employee_id_fkey(id, name, email),
      to_employee:employees!support_escalations_to_employee_id_fkey(id, name, email),
      to_department:departments(id, name)
    `, { count: 'exact' })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.tier) query = query.eq('tier', filters.tier)
  if (filters.to_department_id) query = query.eq('to_department_id', filters.to_department_id)
  if (filters.to_employee_id) query = query.eq('to_employee_id', filters.to_employee_id)
  if (filters.priority) query = query.eq('priority', filters.priority)

  query = query.order('created_at', { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'communications', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createEscalationSchema.parse(body)

  const { data, error } = await supabase
    .from('support_escalations')
    .insert({ ...validated, from_employee_id: employeeId })
    .select(`
      *,
      ticket:support_tickets(id, ticket_number, subject),
      to_employee:employees!support_escalations_to_employee_id_fkey(id, name, email),
      to_department:departments(id, name)
    `)
    .single()

  if (error) throw error

  // Create notification for target employee/department
  if (validated.to_employee_id) {
    await supabase.from('notifications').insert({
      employee_id: validated.to_employee_id,
      type: 'escalation_received',
      title: 'New Escalation',
      message: `Ticket escalated: ${validated.reason.substring(0, 100)}`,
      entity_type: 'support_escalation',
      entity_id: data.id,
    })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'communications', action: 'create' } })
