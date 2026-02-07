import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createComplianceEntrySchema } from '@/lib/validators/compliance'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['compliance_type', 'status', 'client_id', 'financial_year_id'])

  let query = supabase.from('compliance_entries').select('*, clients(id, business_name), financial_years(id, name)', { count: 'exact' }).is('deleted_at', null)
  if (search) query = query.or(`form_name.ilike.%${search}%,reference_no.ilike.%${search}%`)
  if (filters.compliance_type) query = query.eq('compliance_type', filters.compliance_type)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)
  if (filters.financial_year_id) query = query.eq('financial_year_id', filters.financial_year_id)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + pageSize - 1)
  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({ success: true, data, meta: paginationMeta(count || 0, page, pageSize) })
}, { requirePermission: { module: 'compliance', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createComplianceEntrySchema.parse(body)
  const { data, error } = await supabase.from('compliance_entries').insert({ ...validated, created_by: employeeId }).select().single()
  if (error) throw error
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'compliance', action: 'create' } })
