import { NextResponse } from 'next/server'
import { portalHandler } from '@/lib/api/portal-handler'

export const GET = portalHandler(async (req, { supabase, clientIds }) => {
  if (clientIds.length === 0) {
    return NextResponse.json({ success: true, data: [] })
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, business_name, entity_type, pan, gstin, status, city, state, created_at')
    .in('id', clientIds)
    .is('deleted_at', null)
    .order('business_name')

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: clients })
})
