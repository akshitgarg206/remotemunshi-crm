import { SupabaseClient } from '@supabase/supabase-js'

interface ChecklistItem {
  title: string
  sort_order: number
}

interface OnboardingParams {
  clientId: string
  serviceIds: string[]
  employeeId: string
  supabase: SupabaseClient
}

export async function generateOnboardingTasks({
  clientId,
  serviceIds,
  employeeId,
  supabase,
}: OnboardingParams): Promise<{ tasks_created: number }> {
  // Fetch all active onboarding templates: universal (service_id IS NULL) + matching services
  let query = supabase
    .from('recurring_tasks')
    .select(`
      *,
      recurring_task_assignees(employee_id)
    `)
    .eq('trigger_type', 'onboarding')
    .eq('is_active', true)
    .is('deleted_at', null)

  if (serviceIds.length > 0) {
    // Universal templates (service_id IS NULL) OR service-specific templates matching client's services
    query = query.or(`service_id.is.null,service_id.in.(${serviceIds.join(',')})`)
  } else {
    // Only universal templates
    query = query.is('service_id', null)
  }

  const { data: templates, error: tplErr } = await query
  if (tplErr || !templates?.length) return { tasks_created: 0 }

  // Batch-fetch per-client overrides for all these templates
  const templateIds = templates.map(t => t.id)
  const { data: overrides } = await supabase
    .from('client_template_overrides')
    .select('recurring_task_id, additional_steps, notes')
    .eq('client_id', clientId)
    .in('recurring_task_id', templateIds)

  const overrideMap = new Map<string, { additional_steps: ChecklistItem[]; notes: string | null }>()
  for (const ov of overrides || []) {
    overrideMap.set(ov.recurring_task_id, {
      additional_steps: (ov.additional_steps as ChecklistItem[]) || [],
      notes: ov.notes,
    })
  }

  let tasksCreated = 0

  for (const template of templates) {
    const baseChecklist = (template.checklist_template as ChecklistItem[]) || []
    const assigneeIds = (template.recurring_task_assignees as { employee_id: string }[]).map(a => a.employee_id)
    const override = overrideMap.get(template.id)

    // Merge base checklist + per-client additional steps
    const mergedChecklist = [...baseChecklist]
    if (override?.additional_steps?.length) {
      const startOrder = mergedChecklist.length
      for (const step of override.additional_steps) {
        mergedChecklist.push({ title: step.title, sort_order: startOrder + (step.sort_order ?? 0) })
      }
    }

    // Append override notes to description
    let description = (template.description as string) || ''
    if (override?.notes) {
      description = description ? `${description}\n\n--- Client Notes ---\n${override.notes}` : override.notes
    }

    // Create the task (no due_date — assignees set manually)
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        task_name: `${template.task_name} - Onboarding`,
        description: description || null,
        client_id: clientId,
        service_id: template.service_id,
        priority: template.priority,
        due_date: null,
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

    // Copy assignees from template
    if (assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(eid => ({ task_id: task.id, employee_id: eid }))
      )
    }

    tasksCreated++
  }

  return { tasks_created: tasksCreated }
}
