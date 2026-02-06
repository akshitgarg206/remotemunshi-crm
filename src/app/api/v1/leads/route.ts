import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createLeadSchema } from '@/lib/validators/leads'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['source', 'stage_id', 'created_by'])

  let query = supabase
    .from('leads')
    .select('*, lead_assignees(employee_id), lead_services(service_id), lead_stages(name, color)', { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (filters.source) query = query.eq('source', filters.source)
  if (filters.stage_id) query = query.eq('stage_id', filters.stage_id)
  if (filters.created_by) query = query.eq('created_by', filters.created_by)

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
  const validated = createLeadSchema.parse(body)
  const { assignee_ids, service_ids, ...leadData } = validated

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ ...leadData, created_by: employeeId })
    .select()
    .single()

  if (error) throw error

  if (assignee_ids?.length) {
    await supabase.from('lead_assignees').insert(
      assignee_ids.map((eid) => ({ lead_id: lead.id, employee_id: eid }))
    )
  }

  if (service_ids?.length) {
    await supabase.from('lead_services').insert(
      service_ids.map((sid) => ({ lead_id: lead.id, service_id: sid }))
    )
  }

  return NextResponse.json({ success: true, data: lead }, { status: 201 })
})
