import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { generateDeadlinesSchema } from '@/lib/validators/deadlines'

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()
  const { service_id, month, year } = generateDeadlinesSchema.parse(body)

  // Fetch service with deadline config
  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('id, name, frequency, due_day_of_month, reminder_days, requires_data_collection, data_description, initial_message_template, reminder_message_template')
    .eq('id', service_id)
    .single()

  if (svcErr || !service) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } }, { status: 404 })
  }

  if (!service.frequency) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Service has no recurring frequency configured' } }, { status: 400 })
  }

  // Fetch all active client_services for this service
  const { data: clientServices } = await supabase
    .from('client_services')
    .select('client_id, clients(id, business_name)')
    .eq('service_id', service_id)
    .eq('is_active', true)

  if (!clientServices?.length) {
    return NextResponse.json({ success: true, data: { generated: 0, tasks_created: 0, message: 'No active clients for this service' } })
  }

  // Calculate period dates
  const dueDay = service.due_day_of_month || 1
  const lastDay = new Date(year, month, 0).getDate() // last day of month
  const actualDueDay = Math.min(dueDay, lastDay)
  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
  const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const periodLabel = `${monthNames[month - 1]} ${year}`

  // Create deadlines for each client
  const deadlineRows = clientServices.map(cs => ({
    client_id: cs.client_id,
    service_id,
    period_label: periodLabel,
    period_start: periodStart,
    period_end: periodEnd,
    due_date: dueDate,
    status: 'data_pending' as const,
  }))

  const { data: created, error: insertErr } = await supabase
    .from('service_deadlines')
    .upsert(deadlineRows, { onConflict: 'client_id,service_id,period_start', ignoreDuplicates: true })
    .select('id, client_id')

  if (insertErr) throw insertErr

  // Create reminder rows for each deadline
  const reminderDays = (service.reminder_days as number[]) || []
  if (created?.length && reminderDays.length) {
    const reminderRows = created.flatMap(dl =>
      reminderDays
        .filter(day => day <= lastDay)
        .map(day => ({
          deadline_id: dl.id,
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`,
          channel: 'whatsapp' as const,
          status: 'pending',
        }))
    )

    if (reminderRows.length) {
      await supabase.from('deadline_reminders').insert(reminderRows)
    }
  }

  // --- Auto-create tasks from active templates for this service ---
  let tasksCreated = 0

  const { data: templates } = await supabase
    .from('recurring_tasks')
    .select(`
      *,
      recurring_task_assignees(employee_id)
    `)
    .eq('service_id', service_id)
    .eq('is_active', true)
    .eq('trigger_type', 'recurring')
    .is('deleted_at', null)

  if (templates?.length && created?.length) {
    const clientIds = created.map(d => d.client_id)

    for (const template of templates) {
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

      for (const deadline of created) {
        const override = overrideMap.get(deadline.client_id)
        // Merge base checklist + per-client additional steps
        const mergedChecklist = [...baseChecklist]
        if (override?.additional_steps?.length) {
          const startOrder = mergedChecklist.length
          for (const step of override.additional_steps) {
            mergedChecklist.push({ title: step.title, sort_order: startOrder + (step.sort_order ?? 0) })
          }
        }

        let description = (template.description as string) || ''
        if (override?.notes) {
          description = description ? `${description}\n\n--- Client Notes ---\n${override.notes}` : override.notes
        }

        // Create task linked to both template and deadline
        const { data: task, error: taskErr } = await supabase
          .from('tasks')
          .insert({
            task_name: `${template.task_name} - ${periodLabel}`,
            description: description || null,
            client_id: deadline.client_id,
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

        // Copy assignees from template
        if (assigneeIds.length) {
          await supabase.from('task_assignees').insert(
            assigneeIds.map(eid => ({ task_id: task.id, employee_id: eid }))
          )
        }

        // Link task to deadline
        await supabase
          .from('service_deadlines')
          .update({ task_id: task.id })
          .eq('id', deadline.id)

        tasksCreated++
      }

      // Update template's last_generated_at
      await supabase
        .from('recurring_tasks')
        .update({ last_generated_at: new Date().toISOString() })
        .eq('id', template.id)
    }
  }

  return NextResponse.json({
    success: true,
    data: { generated: created?.length || 0, tasks_created: tasksCreated },
  }, { status: 201 })
}, { requirePermission: { module: 'services', action: 'create' } })
