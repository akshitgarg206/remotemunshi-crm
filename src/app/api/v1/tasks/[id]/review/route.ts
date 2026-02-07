import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { reviewActionSchema } from '@/lib/validators/tasks'

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const { action, comment } = reviewActionSchema.parse(body)

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, status, reviewer_1_id, reviewer_2_id, current_review_level')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !task) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
      { status: 404 }
    )
  }

  if (task.status !== 'in_review' || task.current_review_level === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATE', message: 'Task is not currently in review' } },
      { status: 400 }
    )
  }

  const level = task.current_review_level as number
  const isReviewer =
    (level === 1 && task.reviewer_1_id === employeeId) ||
    (level === 2 && task.reviewer_2_id === employeeId)

  if (!isReviewer) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'You are not the reviewer for this level' } },
      { status: 403 }
    )
  }

  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {}
  let systemMessage = ''

  if (action === 'approve') {
    if (level === 1) {
      updateData.review_1_status = 'approved'
      updateData.review_1_at = now
      if (comment) updateData.review_1_comment = comment

      if (task.reviewer_2_id) {
        updateData.current_review_level = 2
        updateData.review_2_status = 'pending'
        systemMessage = 'Level 1 review approved. Moved to Level 2 review.'
      } else {
        updateData.current_review_level = 0
        updateData.status = 'completed'
        updateData.completed_at = now
        systemMessage = 'Level 1 review approved. Task completed.'
      }
    } else {
      updateData.review_2_status = 'approved'
      updateData.review_2_at = now
      if (comment) updateData.review_2_comment = comment
      updateData.current_review_level = 0
      updateData.status = 'completed'
      updateData.completed_at = now
      systemMessage = 'Level 2 review approved. Task completed.'
    }
  } else {
    if (level === 1) {
      updateData.review_1_status = 'changes_requested'
      updateData.review_1_at = now
      if (comment) updateData.review_1_comment = comment
    } else {
      updateData.review_2_status = 'changes_requested'
      updateData.review_2_at = now
      if (comment) updateData.review_2_comment = comment
    }
    updateData.status = 'request_changes'
    systemMessage = `Level ${level} review: Changes requested${comment ? ': ' + comment : ''}`
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', params.id)
    .eq('current_review_level', level) // optimistic lock

  if (updateError) throw updateError

  await supabase.from('task_comments').insert({
    task_id: params.id,
    employee_id: employeeId,
    comment: systemMessage,
    is_system: true,
  })

  return NextResponse.json({ success: true, data: { action, level } })
}, { requirePermission: { module: 'tasks', action: 'update' } })
