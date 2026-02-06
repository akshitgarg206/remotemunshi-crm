import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateQuickReplySchema } from '@/lib/validators/support-quick-replies'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('support_quick_replies')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quick reply not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateQuickReplySchema.parse(body)

  const { data, error } = await supabase
    .from('support_quick_replies')
    .update(validated)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('support_quick_replies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
