import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  // Update deadline
  const { data: deadline, error } = await supabase
    .from('service_deadlines')
    .update({
      data_received: true,
      data_received_at: new Date().toISOString(),
      data_received_by: employeeId,
      status: 'data_received',
    })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  // Skip all pending reminders for this deadline
  await supabase
    .from('deadline_reminders')
    .update({ status: 'skipped' })
    .eq('deadline_id', params.id)
    .eq('status', 'pending')

  return NextResponse.json({ success: true, data: deadline })
}, { requirePermission: { module: 'services', action: 'update' } })
