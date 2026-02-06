import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createNoticeSchema } from '@/lib/validators/notices'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'client_id', 'notice_type_id', 'assigned_to'])

  let query = supabase.from('notices').select('*, clients(id, business_name), notice_types(id, name), employees!notices_assigned_to_fkey(id, name)', { count: 'exact' }).is('deleted_at', null)
  if (search) query = query.or(`section.ilike.%${search}%,remarks.ilike.%${search}%`)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)
  if (filters.notice_type_id) query = query.eq('notice_type_id', filters.notice_type_id)
  if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + pageSize - 1)
  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({ success: true, data, meta: paginationMeta(count || 0, page, pageSize) })
})

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createNoticeSchema.parse(body)
  const { data, error } = await supabase.from('notices').insert({ ...validated, created_by: employeeId }).select().single()
  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
})
