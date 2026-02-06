import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['service_id', 'client_id', 'status', 'month', 'year'])

  let query = supabase
    .from('service_deadlines')
    .select(`
      *,
      clients(id, business_name, mobile, email),
      services(id, name, frequency, data_description),
      data_received_by_employee:employees!service_deadlines_data_received_by_fkey(id, name)
    `, { count: 'exact' })
    .is('deleted_at', null)

  if (filters.service_id) query = query.eq('service_id', filters.service_id)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)
  if (filters.status) query = query.eq('status', filters.status)

  // Month/year filter: filter by period_start falling within the month
  if (filters.month && filters.year) {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const endMonth = Number(filters.month) === 12 ? 1 : Number(filters.month) + 1
    const endYear = Number(filters.month) === 12 ? Number(filters.year) + 1 : Number(filters.year)
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    query = query.gte('period_start', startDate).lt('period_start', endDate)
  }

  if (search) {
    query = query.or(`clients.business_name.ilike.%${search}%,services.name.ilike.%${search}%,period_label.ilike.%${search}%`)
  }

  query = query.order(sortBy || 'due_date', { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
})
