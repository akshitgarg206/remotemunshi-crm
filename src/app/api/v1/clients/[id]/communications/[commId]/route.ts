import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateCommunicationSchema } from '@/lib/validators/communications'

// GET /api/v1/clients/:id/communications/:commId — Single communication
export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('client_communications')
    .select('*, employees(id, name)')
    .eq('id', params.commId)
    .eq('client_id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Communication not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
})

// PUT /api/v1/clients/:id/communications/:commId — Update communication
export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateCommunicationSchema.parse(body)

  const { data, error } = await supabase
    .from('client_communications')
    .update(validated)
    .eq('id', params.commId)
    .eq('client_id', params.id)
    .is('deleted_at', null)
    .select('*, employees(id, name)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Communication not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
})

// DELETE /api/v1/clients/:id/communications/:commId — Soft delete
export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('client_communications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.commId)
    .eq('client_id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true, data: { id: params.commId, deleted: true } })
})
