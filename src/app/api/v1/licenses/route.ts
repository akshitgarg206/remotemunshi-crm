import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createLicenseSchema } from '@/lib/validators/licenses'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['client_id'])

  let query = supabase.from('licenses').select('*, clients(id, business_name)', { count: 'exact' }).is('deleted_at', null)
  if (search) query = query.or(`license_name.ilike.%${search}%,registration_no.ilike.%${search}%`)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + pageSize - 1)
  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({ success: true, data, meta: paginationMeta(count || 0, page, pageSize) })
}, { requirePermission: { module: 'licenses', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createLicenseSchema.parse(body)
  const { data, error } = await supabase.from('licenses').insert({ ...validated, created_by: employeeId }).select().single()
  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'licenses', action: 'create' } })
