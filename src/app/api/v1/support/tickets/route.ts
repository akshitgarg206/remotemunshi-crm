import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createTicketSchema } from '@/lib/validators/support-tickets'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'priority', 'assigned_employee_id', 'assigned_department_id', 'client_id'])

  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      client:clients(id, business_name),
      contact:contacts(id, name, email),
      assigned_employee:employees!support_tickets_assigned_employee_id_fkey(id, name, email),
      assigned_department:departments(id, name),
      conversation:support_conversations(id, channel, status)
    `, { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`subject.ilike.%${search}%,ticket_number.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.assigned_employee_id) query = query.eq('assigned_employee_id', filters.assigned_employee_id)
  if (filters.assigned_department_id) query = query.eq('assigned_department_id', filters.assigned_department_id)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
})

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createTicketSchema.parse(body)

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      ...validated,
      ticket_number: '', // trigger will auto-generate
      created_by: employeeId,
    })
    .select(`
      *,
      client:clients(id, business_name),
      assigned_employee:employees!support_tickets_assigned_employee_id_fkey(id, name, email)
    `)
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
})
