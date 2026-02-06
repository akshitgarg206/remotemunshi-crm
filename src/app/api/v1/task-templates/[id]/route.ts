import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateTaskTemplateSchema } from '@/lib/validators/task-templates'

export const GET = apiHandler(async (req, { supabase, params }) => {
  const { data, error } = await supabase
    .from('recurring_tasks')
    .select(`
      *,
      services(id, name),
      clients(id, business_name),
      recurring_task_assignees(employee_id, employees(id, name, avatar_url)),
      reviewer_1:employees!recurring_tasks_reviewer_1_id_fkey(id, name),
      reviewer_2:employees!recurring_tasks_reviewer_2_id_fkey(id, name)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { supabase, employeeId, params }) => {
  const body = await req.json()
  const validated = updateTaskTemplateSchema.parse(body)
  const { assignee_ids, ...templateData } = validated

  // Check template exists and user has permission
  const { data: existing } = await supabase
    .from('recurring_tasks')
    .select('id, min_edit_level')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  // Permission check
  const { data: emp } = await supabase
    .from('employees')
    .select('roles(permission_level)')
    .eq('id', employeeId!)
    .single()

  const permLevel = (emp?.roles as unknown as Record<string, number> | null)?.permission_level ?? 0
  if (permLevel < (existing.min_edit_level || 5)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to edit this template' } },
      { status: 403 }
    )
  }

  const { data: template, error } = await supabase
    .from('recurring_tasks')
    .update(templateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) throw error

  // Update assignees if provided
  if (assignee_ids !== undefined) {
    await supabase.from('recurring_task_assignees').delete().eq('recurring_task_id', params.id)
    if (assignee_ids.length) {
      await supabase.from('recurring_task_assignees').insert(
        assignee_ids.map((eid) => ({ recurring_task_id: params.id, employee_id: eid }))
      )
    }
  }

  return NextResponse.json({ success: true, data: template })
})

export const DELETE = apiHandler(async (req, { supabase, employeeId, params }) => {
  // Check template and permissions
  const { data: existing } = await supabase
    .from('recurring_tasks')
    .select('id, min_edit_level')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  const { data: emp } = await supabase
    .from('employees')
    .select('roles(permission_level)')
    .eq('id', employeeId!)
    .single()

  const permLevel = (emp?.roles as unknown as Record<string, number> | null)?.permission_level ?? 0
  if (permLevel < (existing.min_edit_level || 5)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to delete this template' } },
      { status: 403 }
    )
  }

  // Soft delete
  const { error } = await supabase
    .from('recurring_tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data: { deleted: true } })
})
