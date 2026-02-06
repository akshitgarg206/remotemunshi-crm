import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { z } from 'zod'

const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  mark_all: z.boolean().optional(),
})

export const POST = apiHandler(async (req, { supabase, userId }) => {
  const body = await req.json()
  const { notification_ids, mark_all } = markReadSchema.parse(body)

  const { data: employee } = await supabase.from('employees').select('id').eq('auth_user_id', userId).single()

  if (mark_all) {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('employee_id', employee?.id).eq('is_read', false)
  } else if (notification_ids?.length) {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', notification_ids).eq('employee_id', employee?.id)
  }

  return NextResponse.json({ success: true, data: { marked: true } })
})
