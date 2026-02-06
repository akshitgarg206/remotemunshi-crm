import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createConversationSchema } from '@/lib/validators/support-conversations'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'channel', 'assigned_employee_id', 'is_spam', 'client_id'])

  let query = supabase
    .from('support_conversations')
    .select(`
      *,
      client:clients(id, business_name),
      contact:contacts(id, name, email, phone),
      assigned_employee:employees!support_conversations_assigned_employee_id_fkey(id, name, email)
    `, { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`subject.ilike.%${search}%,last_message_preview.ilike.%${search}%`)
  }

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.channel) query = query.eq('channel', filters.channel)
  if (filters.assigned_employee_id) query = query.eq('assigned_employee_id', filters.assigned_employee_id)
  if (filters.is_spam) query = query.eq('is_spam', filters.is_spam === 'true')
  if (filters.client_id) query = query.eq('client_id', filters.client_id)

  const orderCol = sortBy === 'last_message_at' ? 'last_message_at' : sortBy
  query = query.order(orderCol, { ascending: sortOrder === 'asc' })
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
  const validated = createConversationSchema.parse(body)

  const { data, error } = await supabase
    .from('support_conversations')
    .insert({ ...validated, created_by: employeeId })
    .select(`
      *,
      client:clients(id, business_name),
      contact:contacts(id, name, email, phone),
      assigned_employee:employees!support_conversations_assigned_employee_id_fkey(id, name, email)
    `)
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
})
