import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const assignSchema = z.object({
  employee_id: z.string().uuid(),
})

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()
  const { employee_id } = assignSchema.parse(body)

  const { data, error } = await supabase
    .from('support_conversations')
    .update({ assigned_employee_id: employee_id })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  // Add system message about assignment
  await supabase.from('support_messages').insert({
    conversation_id: params.id,
    sender_employee_id: employeeId,
    direction: 'outbound',
    message_type: 'system',
    content: `Conversation assigned to a new agent`,
    is_internal: true,
  })

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'communications', action: 'update' } })
