import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

// PATCH — mark conversation as read (unread_count=0) or unread (unread_count=1)
export const PATCH = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json().catch(() => ({}))
  const unread = body.unread === true

  const { data, error } = await supabase
    .from('support_conversations')
    .update({ unread_count: unread ? 1 : 0 })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select('id, unread_count')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'communications', action: 'update' } })
