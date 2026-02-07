import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateNoticeSchema } from '@/lib/validators/notices'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase.from('notices').select('*, clients(id, business_name), notice_types(id, name), notice_attachments(*)').eq('id', params.id).is('deleted_at', null).single()
  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Notice not found' } }, { status: 404 })
    throw error
  }
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'notices', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateNoticeSchema.parse(body)
  const { data, error } = await supabase.from('notices').update(validated).eq('id', params.id).is('deleted_at', null).select().single()
  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'notices', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase.from('notices').update({ deleted_at: new Date().toISOString() }).eq('id', params.id)
  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'notices', action: 'delete' } })
