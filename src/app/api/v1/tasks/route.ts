import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { parsePagination, paginationMeta } from '@/lib/api/pagination'
import { parseFilters } from '@/lib/api/filters'
import { createTaskSchema } from '@/lib/validators/tasks'

export const GET = apiHandler(async (req, { supabase, employeeId }) => {
  const { page, pageSize, offset, sortBy, sortOrder, search } = parsePagination(req)
  const filters = parseFilters(req, ['status', 'priority', 'client_id', 'service_id', 'sprint_id', 'assignee_id', 'parent_task_id', 'my_tasks', 'my_reviews'])

  let query = supabase
    .from('tasks')
    .select(`
      *,
      clients(id, business_name),
      services(id, name),
      task_assignees(employee_id, employees(id, name, avatar_url)),
      task_sub_statuses(id, name, color),
      sprints(id, name)
    `, { count: 'exact' })
    .is('deleted_at', null)

  // By default only show top-level tasks (not sub-tasks)
  if (filters.parent_task_id) {
    query = query.eq('parent_task_id', filters.parent_task_id)
  } else {
    query = query.is('parent_task_id', null)
  }

  // "My Tasks" filter — tasks assigned to the current user
  if (filters.my_tasks === 'true' && employeeId) {
    query = query.eq('task_assignees.employee_id', employeeId)
  }

  // "My Reviews" filter — tasks where current user is a reviewer and task is in review
  if (filters.my_reviews === 'true' && employeeId) {
    query = query.or(`reviewer_1_id.eq.${employeeId},reviewer_2_id.eq.${employeeId}`)
    query = query.eq('status', 'in_review')
  }

  if (search) {
    query = query.or(`task_name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.client_id) query = query.eq('client_id', filters.client_id)
  if (filters.service_id) query = query.eq('service_id', filters.service_id)
  if (filters.sprint_id) query = query.eq('sprint_id', filters.sprint_id)

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
  const validated = createTaskSchema.parse(body)
  const { assignee_ids, checklist, ...taskData } = validated

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...taskData, created_by: employeeId })
    .select()
    .single()

  if (error) throw error

  if (assignee_ids?.length) {
    await supabase.from('task_assignees').insert(
      assignee_ids.map((eid) => ({ task_id: task.id, employee_id: eid }))
    )
  }

  if (checklist?.length) {
    await supabase.from('task_checklist_items').insert(
      checklist.map((item, i) => ({
        task_id: task.id,
        title: item.title,
        sort_order: item.sort_order || i,
      }))
    )
  }

  return NextResponse.json({ success: true, data: task }, { status: 201 })
}, { requirePermission: { module: 'tasks', action: 'create' } })
