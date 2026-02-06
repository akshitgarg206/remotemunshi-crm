import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateTaskSchema } from '@/lib/validators/tasks'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      clients(id, business_name),
      services(id, name),
      task_assignees(employee_id, employees(id, name, email, avatar_url)),
      task_checklist_items(id, title, is_checked, checked_by, sort_order),
      task_comments(id, employee_id, comment, is_system, attachments, created_at, employees(id, name, avatar_url)),
      task_sub_statuses(id, name, color),
      sprints(id, name),
      recurring_tasks(id, task_name, frequency),
      reviewer_1:employees!tasks_reviewer_1_id_fkey(id, name, email, avatar_url),
      reviewer_2:employees!tasks_reviewer_2_id_fkey(id, name, email, avatar_url)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  // Fetch sub-tasks separately (self-referencing FK doesn't work inline with PostgREST)
  const { data: subTasks } = await supabase
    .from('tasks')
    .select(`
      id, task_name, status, priority, due_date,
      task_assignees(employee_id, employees(id, name)),
      task_checklist_items(id, title, is_checked, sort_order)
    `)
    .eq('parent_task_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  return NextResponse.json({ success: true, data: { ...data, sub_tasks: subTasks || [] } })
})

export const PUT = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const validated = updateTaskSchema.parse(body)
  const { assignee_ids, checklist, reviewer_1_id, reviewer_2_id, ...taskData } = validated

  // Track status change + review state
  const { data: oldTask } = await supabase
    .from('tasks')
    .select('status, reviewer_1_id, reviewer_2_id, current_review_level, review_1_status, review_2_status')
    .eq('id', params.id)
    .single()

  // Handle reviewer field updates
  if (reviewer_1_id !== undefined) (taskData as Record<string, unknown>).reviewer_1_id = reviewer_1_id
  if (reviewer_2_id !== undefined) (taskData as Record<string, unknown>).reviewer_2_id = reviewer_2_id
  // Clear L2 if L1 is removed
  if (reviewer_1_id === null) (taskData as Record<string, unknown>).reviewer_2_id = null

  // Review-aware status transitions
  if (taskData.status === 'in_review' && oldTask?.status !== 'in_review') {
    const r1 = reviewer_1_id !== undefined ? reviewer_1_id : oldTask?.reviewer_1_id
    if (r1) {
      const level = oldTask?.current_review_level || 0
      // Resubmit goes to same level; fresh submit starts at L1
      const targetLevel = (oldTask?.status === 'request_changes' && level > 0) ? level : 1
      ;(taskData as Record<string, unknown>).current_review_level = targetLevel
      if (targetLevel === 1) (taskData as Record<string, unknown>).review_1_status = 'pending'
      if (targetLevel === 2) (taskData as Record<string, unknown>).review_2_status = 'pending'
    }
  }

  // Block direct completed if reviews pending
  if (taskData.status === 'completed' && oldTask?.status !== 'completed') {
    const r1 = reviewer_1_id !== undefined ? reviewer_1_id : oldTask?.reviewer_1_id
    if (r1) {
      const r1Done = oldTask?.review_1_status === 'approved'
      const r2 = reviewer_2_id !== undefined ? reviewer_2_id : oldTask?.reviewer_2_id
      const r2Done = !r2 || oldTask?.review_2_status === 'approved'
      if (!r1Done || !r2Done) {
        return NextResponse.json(
          { success: false, error: { code: 'REVIEW_PENDING', message: 'Task has pending reviews. Submit for review instead.' } },
          { status: 400 }
        )
      }
    }
    ;(taskData as Record<string, unknown>).completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  if (assignee_ids !== undefined) {
    await supabase.from('task_assignees').delete().eq('task_id', params.id)
    if (assignee_ids.length) {
      await supabase.from('task_assignees').insert(
        assignee_ids.map((eid) => ({ task_id: params.id, employee_id: eid }))
      )
    }
  }

  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
