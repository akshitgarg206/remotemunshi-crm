import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { sendReminderSchema } from '@/lib/validators/deadlines'

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const { channel, message } = sendReminderSchema.parse(body)

  // Fetch deadline with client + service details
  const { data: deadline, error: dlErr } = await supabase
    .from('service_deadlines')
    .select(`
      *,
      clients(id, business_name, mobile, email, contact_name),
      services(id, name, initial_message_template, reminder_message_template, data_description)
    `)
    .eq('id', params.id)
    .single()

  if (dlErr || !deadline) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Deadline not found' } }, { status: 404 })
  }

  if (deadline.data_received) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Data already received for this deadline' } }, { status: 400 })
  }

  // Build message from template or use override
  const client = deadline.clients as Record<string, string>
  const service = deadline.services as Record<string, string>
  const templateMsg = message || service.reminder_message_template || service.initial_message_template ||
    `Dear ${client.contact_name || client.business_name}, please share ${service.data_description || 'the required data'} for ${service.name} - ${deadline.period_label}. Due date: ${deadline.due_date}.`

  // Create client communication log entry
  const { data: comm, error: commErr } = await supabase
    .from('client_communications')
    .insert({
      client_id: deadline.client_id,
      channel,
      direction: 'outbound',
      subject: `Data Request: ${service.name} — ${deadline.period_label}`,
      body: templateMsg,
      employee_id: employeeId,
      sent_at: new Date().toISOString(),
      metadata: { deadline_id: deadline.id, service_id: deadline.service_id },
    })
    .select()
    .single()

  if (commErr) throw commErr

  // Find and update the next pending reminder (or the one matching today)
  const today = new Date().toISOString().split('T')[0]
  const { data: reminder } = await supabase
    .from('deadline_reminders')
    .select('id')
    .eq('deadline_id', params.id)
    .eq('status', 'pending')
    .lte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .single()

  if (reminder) {
    await supabase
      .from('deadline_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: employeeId,
        communication_id: comm.id,
        message_preview: templateMsg.substring(0, 200),
      })
      .eq('id', reminder.id)
  }

  return NextResponse.json({ success: true, data: { communication: comm, reminder_updated: !!reminder } }, { status: 201 })
})
