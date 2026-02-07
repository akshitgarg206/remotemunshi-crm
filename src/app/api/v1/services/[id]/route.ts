import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateServiceSchema } from '@/lib/validators/services'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(id, name)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'services', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateServiceSchema.parse(body)

  const { data, error } = await supabase
    .from('services')
    .update(validated)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'services', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('services')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'services', action: 'delete' } })
