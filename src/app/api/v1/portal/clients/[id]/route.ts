import { NextResponse } from 'next/server'
import { portalHandler } from '@/lib/api/portal-handler'

export const GET = portalHandler(async (req, { supabase, clientIds, params }) => {
  const { id } = params

  if (!clientIds.includes(id)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this client' } },
      { status: 403 }
    )
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      id, business_name, business_entity, pan, gstin, tan, cin,
      email, mobile, address, city, state, pincode,
      status, created_at,
      client_services(service_id, services(id, name))
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !client) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: client })
})
