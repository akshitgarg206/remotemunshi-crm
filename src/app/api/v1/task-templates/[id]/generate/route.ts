import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { generateFromTemplateSchema } from '@/lib/validators/task-templates'

export const POST = apiHandler(async (req, { supabase, employeeId, params }) => {
  const body = await req.json()
  const { month, year } = generateFromTemplateSchema.parse(body)

  // Fetch template with assignees
  const { data: template, error: tplErr } = await supabase
    .from('recurring_tasks')
    .select(`
      *,
      recurring_task_assignees(employee_id)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (tplErr || !template) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
      { status: 404 }
    )
  }

  if (!template.is_active) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Template is inactive' } },
      { status: 400 }
    )
  }

  // Determine target clients
  let clientIds: string[] = []

  if (template.client_id) {
    // Template is for a specific client
    clientIds = [template.client_id]
  } else if (template.service_id) {
    // Get all active clients subscribed to this service
    const { data: clientServices } = await supabase
      .from('client_services')
      .select('client_id')
      .eq('service_id', template.service_id)
      .eq('is_active', true)

    clientIds = (clientServices || []).map(cs => cs.client_id)
  }

  if (!clientIds.length) {
    return NextResponse.json({
      success: true,
      data: { tasks_created: 0, message: 'No clients found for this template' },
    })
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const periodLabel = `${monthNames[month - 1]} ${year}`
  const lastDay = new Date(year, month, 0).getDate()
  const dueDay = template.day_of_month ? Math.min(template.day_of_month, lastDay) : lastDay
  const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

  const baseChecklist = (template.checklist_template as { title: string; sort_order: number }[]) || []
  const assigneeIds = (template.recurring_task_assignees as { employee_id: string }[]).map(a => a.employee_id)

  // Fetch per-client overrides for this template
  const { data: overrides } = await supabase
    .from('client_template_overrides')
    .select('client_id, additional_steps, notes')
    .eq('recurring_task_id', template.id)
    .in('client_id', clientIds)

  const overrideMap = new Map<string, { additional_steps: { title: string; sort_order: number }[]; notes: string | null }>()
  for (const ov of overrides || []) {
    overrideMap.set(ov.client_id, {
      additional_steps: (ov.additional_steps as { title: string; sort_order: number }[]) || [],
      notes: ov.notes,
    })
  }

  let tasksCreated = 0

  for (const clientId of clientIds) {
    const override = overrideMap.get(clientId)
    // Merge base checklist + per-client additional steps
    const mergedChecklist = [...baseChecklist]
    if (override?.additional_steps?.length) {
      const startOrder = mergedChecklist.length
      for (const step of override.additional_steps) {
        mergedChecklist.push({ title: step.title, sort_order: startOrder + (step.sort_order ?? 0) })
      }
    }

    // Append override notes to description if present
    let description = template.description || ''
    if (override?.notes) {
      description = description ? `${description}\n\n--- Client Notes ---\n${override.notes}` : override.notes
    }

    // Create the task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        task_name: `${template.task_name} - ${periodLabel}`,
        description: description || null,
        client_id: clientId,
        service_id: template.service_id,
        priority: template.priority,
        due_date: dueDate,
        estimated_hours: template.estimated_hours,
        reviewer_1_id: template.reviewer_1_id,
        reviewer_2_id: template.reviewer_2_id,
        recurring_task_id: template.id,
        created_by: employeeId,
      })
      .select('id')
      .single()

    if (taskErr || !task) continue

    // Copy merged checklist items
    if (mergedChecklist.length) {
      await supabase.from('task_checklist_items').insert(
        mergedChecklist.map((item, i) => ({
          task_id: task.id,
          title: item.title,
          sort_order: item.sort_order ?? i,
        }))
      )
    }

    // Copy assignees
    if (assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(eid => ({ task_id: task.id, employee_id: eid }))
      )
    }

    tasksCreated++
  }

  // Update template's last_generated_at
  await supabase
    .from('recurring_tasks')
    .update({ last_generated_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({
    success: true,
    data: { tasks_created: tasksCreated, period: periodLabel },
  }, { status: 201 })
})
