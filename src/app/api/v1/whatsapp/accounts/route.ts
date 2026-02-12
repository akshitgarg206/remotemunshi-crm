import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const GET = apiHandler(async (req, { supabase }) => {
  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .select('id, phone_number_id, waba_id, display_phone_number, business_name, status, is_default, metadata, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'settings', action: 'read' } })

export const POST = apiHandler(async (req, { supabase, employeeId }) => {
  const body = await req.json()

  const { phone_number_id, display_phone_number, business_name } = body

  if (!phone_number_id || !display_phone_number) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Phone Number ID and display phone number are required' } },
      { status: 400 }
    )
  }

  // Access token is now managed via env vars (CHAKRA_ACCESS_TOKEN)
  // Store a placeholder or the ChakraHQ token reference
  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .insert({
      phone_number_id: phone_number_id.trim(),
      waba_id: body.waba_id?.trim() || 'chakrahq',
      access_token: 'chakrahq_env',
      display_phone_number: display_phone_number.trim(),
      business_name: business_name?.trim() || null,
      created_by: employeeId,
      metadata: {
        provider: 'chakrahq',
        plugin_id: process.env.CHAKRA_PLUGIN_ID || null,
      },
    })
    .select('id, phone_number_id, waba_id, display_phone_number, business_name, status, is_default, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'This phone number is already connected' } },
        { status: 409 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}, { requirePermission: { module: 'settings', action: 'create' } })
