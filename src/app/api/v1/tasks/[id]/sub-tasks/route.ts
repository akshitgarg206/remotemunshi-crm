import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { createTaskSchema } from '@/lib/validators/tasks'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignees(employee_id, employees(id, name, avatar_url)),
      task_checklist_items(id, title, is_checked, checked_by, sort_order)
    `)
    .eq('parent_task_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  // Prevent nesting beyond 2 levels: check if parent is itself a sub-task
  const { data: parent, error: parentError } = await supabase
    .from('tasks')
    .select('id, parent_task_id')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (parentError || !parent) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Parent task not found' } },
      { status: 404 }
    )
  }

  if (parent.parent_task_id) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot create sub-tasks beyond 2 levels' } },
      { status: 400 }
    )
  }

  const body = await req.json()
  const validated = createTaskSchema.parse(body)
  const { assignee_ids, checklist, ...taskData } = validated

  // Force parent_task_id
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ ...taskData, parent_task_id: params.id, created_by: employeeId })
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
})
