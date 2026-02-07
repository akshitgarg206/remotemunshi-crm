import { NextResponse } from 'next/server'
import { portalHandler } from '@/lib/api/portal-handler'

export const GET = portalHandler(async (req, { supabase, clientIds, params }) => {
  const { id } = params

  if (!clientIds.includes(id)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('licenses')
    .select('id, license_name, license_type, registration_no, issuing_authority, issued_date, expiry_date, remarks, created_at')
    .eq('client_id', id)
    .is('deleted_at', null)
    .order('expiry_date', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
})
