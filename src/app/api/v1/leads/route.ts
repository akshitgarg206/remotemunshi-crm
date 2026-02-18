import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createLeadSchema } from '@/lib/validators/leads'
import { logActivity } from '@/lib/api/log-activity'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['source', 'stage_id', 'created_by', 'temperature', 'next_follow_up_before'])

  let query = supabase
    .from('leads')
    .select('*, lead_assignees(employee_id), lead_bundles(bundle_id), lead_stages(name, color)', { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (filters.source) query = query.eq('source', filters.source)
  if (filters.stage_id) query = query.eq('stage_id', filters.stage_id)
  if (filters.created_by) query = query.eq('created_by', filters.created_by)
  if (filters.temperature) query = query.eq('temperature', filters.temperature)
  if (filters.next_follow_up_before) query = query.lte('next_follow_up', filters.next_follow_up_before)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'leads', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createLeadSchema.parse(body)
  const { assignee_ids, bundle_ids, ...leadData } = validated

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

  if (bundle_ids?.length) {
    await supabase.from('lead_bundles').insert(
      bundle_ids.map((bid) => ({ lead_id: lead.id, bundle_id: bid }))
    )
  }

  await logActivity(supabase, {
    employeeId,
    action: 'lead_created',
    entityType: 'lead',
    entityId: lead.id,
    newValues: leadData,
    description: `Created lead: ${leadData.business_name}`,
  })

  return NextResponse.json({ success: true, data: lead }, { status: 201 })
}, { requirePermission: { module: 'leads', action: 'create' } })
