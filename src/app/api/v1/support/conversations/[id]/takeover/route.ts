import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const { data, error } = await supabase
    .from('support_conversations')
    .update({ assigned_employee_id: employeeId })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  // Add system message about takeover
  await supabase.from('support_messages').insert({
    conversation_id: params.id,
    sender_employee_id: employeeId,
    direction: 'outbound',
    message_type: 'system',
    content: `Supervisor has taken over this conversation`,
    is_internal: true,
  })

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'communications', action: 'update' } })
