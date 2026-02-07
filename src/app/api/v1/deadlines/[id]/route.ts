import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateDeadlineSchema } from '@/lib/validators/deadlines'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('service_deadlines')
    .select(`
      *,
      clients(id, business_name, mobile, email, contact_name),
      services(id, name, frequency, due_day_of_month, data_description, initial_message_template, reminder_message_template),
      data_received_by_employee:employees!service_deadlines_data_received_by_fkey(id, name),
      tasks(id, task_name, status),
      deadline_reminders(id, scheduled_date, channel, status, sent_at, sent_by, communication_id, message_preview, created_at)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Deadline not found' } }, { status: 404 })
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'services', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateDeadlineSchema.parse(body)

  const { data, error } = await supabase
    .from('service_deadlines')
    .update(validated)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'services', action: 'update' } })
