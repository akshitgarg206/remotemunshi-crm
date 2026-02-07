import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createClientSchema } from '@/lib/validators/clients'
import { generateOnboardingTasks } from '@/lib/tasks/generate-onboarding-tasks'

// GET /api/v1/clients — List clients (paginated, filtered, sorted)
export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'business_entity', 'auditor_id', 'group_id'])

  let query = supabase
    .from('clients')
    .select('*, client_assignees(employee_id), client_services(service_id)', { count: 'exact' })
    .is('deleted_at', null)

  // Search
  if (search) {
    query = query.or(`business_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%,gstin.ilike.%${search}%,pan.ilike.%${search}%`)
  }

  // Filters
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.business_entity) query = query.eq('business_entity', filters.business_entity)
  if (filters.auditor_id) query = query.eq('auditor_id', filters.auditor_id)

  // Sort & paginate
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'clients', action: 'read' } })

// POST /api/v1/clients — Create client
export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createClientSchema.parse(body)

  const { group_ids, service_ids, assignee_ids, ...clientData } = validated

  // Insert client
  const { data: client, error } = await supabase
    .from('clients')
    .insert({ ...clientData, created_by: employeeId })
    .select()
    .single()

  if (error) throw error

  // Insert junction records
  if (assignee_ids?.length) {
    await supabase.from('client_assignees').insert(
      assignee_ids.map((eid, i) => ({
        client_id: client.id,
        employee_id: eid,
        is_primary: i === 0,
      }))
    )
  }

  if (service_ids?.length) {
    await supabase.from('client_services').insert(
      service_ids.map((sid) => ({ client_id: client.id, service_id: sid }))
    )
  }

  if (group_ids?.length) {
    await supabase.from('client_group_members').insert(
      group_ids.map((gid) => ({ client_id: client.id, group_id: gid }))
    )
  }

  // Auto-create onboarding tasks (non-blocking — don't fail client creation)
  try {
    await generateOnboardingTasks({
      clientId: client.id,
      serviceIds: service_ids || [],
      employeeId: employeeId!,
      supabase,
    })
  } catch {
    // Silently continue — onboarding task failure shouldn't block client creation
  }

  return NextResponse.json({ success: true, data: client }, { status: 201 })
}, { requirePermission: { module: 'clients', action: 'create' } })
