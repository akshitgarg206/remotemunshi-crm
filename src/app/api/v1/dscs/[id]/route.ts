import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateDscSchema } from '@/lib/validators/dscs'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase.from('dscs').select('*, clients(id, business_name)').eq('id', params.id).is('deleted_at', null).single()
  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'DSC not found' } }, { status: 404 })
    throw error
  }
  return NextResponse.json({ success: true, data })
})

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateDscSchema.parse(body)
  const { data, error } = await supabase.from('dscs').update(validated).eq('id', params.id).is('deleted_at', null).select().single()
  if (error) throw error
  return NextResponse.json({ success: true, data })
})

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase.from('dscs').update({ deleted_at: new Date().toISOString() }).eq('id', params.id)
  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
})
