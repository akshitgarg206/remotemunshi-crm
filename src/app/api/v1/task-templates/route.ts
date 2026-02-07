import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createTaskTemplateSchema } from '@/lib/validators/task-templates'

export const GET = apiHandler(async (req, { supabase }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['service_id', 'frequency', 'is_active'])

  let query = supabase
    .from('recurring_tasks')
    .select(`
      *,
      services(id, name),
      clients(id, business_name),
      recurring_task_assignees(employee_id, employees(id, name, avatar_url)),
      reviewer_1:employees!recurring_tasks_reviewer_1_id_fkey(id, name),
      reviewer_2:employees!recurring_tasks_reviewer_2_id_fkey(id, name)
    `, { count: 'exact' })
    .is('deleted_at', null)

  if (search) {
    query = query.or(`task_name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (filters.service_id) query = query.eq('service_id', filters.service_id)
  if (filters.frequency) query = query.eq('frequency', filters.frequency)
  if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active === 'true')

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    meta: paginationMeta(count || 0, page, pageSize),
  })
}, { requirePermission: { module: 'tasks', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const validated = createTaskTemplateSchema.parse(body)
  const { assignee_ids, ...templateData } = validated

  // Permission check: get employee's role permission_level
  const { data: emp } = await supabase
    .from('employees')
    .select('roles(permission_level)')
    .eq('id', employeeId!)
    .single()

  const permLevel = (emp?.roles as unknown as Record<string, number> | null)?.permission_level ?? 0
  if (permLevel < 5) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to create templates' } },
      { status: 403 }
    )
  }

  const { data: template, error } = await supabase
    .from('recurring_tasks')
    .insert({ ...templateData, created_by: employeeId })
    .select()
    .single()

  if (error) throw error

  if (assignee_ids?.length) {
    await supabase.from('recurring_task_assignees').insert(
      assignee_ids.map((eid) => ({ recurring_task_id: template.id, employee_id: eid }))
    )
  }

  return NextResponse.json({ success: true, data: template }, { status: 201 })
}, { requirePermission: { module: 'tasks', action: 'create' } })
