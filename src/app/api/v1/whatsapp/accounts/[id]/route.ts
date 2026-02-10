import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.business_name !== undefined) updateData.business_name = body.business_name
  if (body.status !== undefined) updateData.status = body.status
  if (body.is_default !== undefined) updateData.is_default = body.is_default

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
      { status: 400 }
    )
  }

  // If setting as default, unset others first
  if (updateData.is_default === true) {
    await supabase
      .from('whatsapp_accounts')
      .update({ is_default: false })
      .neq('id', params.id)
  }

  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .update(updateData)
    .eq('id', params.id)
    .select('id, phone_number_id, waba_id, display_phone_number, business_name, status, is_default, created_at')
    .single()

  if (error) throw error
  if (!data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'settings', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('whatsapp_accounts')
    .delete()
    .eq('id', params.id)

  if (error) throw error

  return NextResponse.json({ success: true })
}, { requirePermission: { module: 'settings', action: 'delete' } })
