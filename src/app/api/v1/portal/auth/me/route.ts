import { NextResponse } from 'next/server'
import { portalHandler } from '@/lib/api/portal-handler'

export const GET = portalHandler(async (req, { supabase, contactId, clientIds }) => {
  // Get contact details
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, name, email, mobile, phone, designation, department')
    .eq('id', contactId)
    .single()

  // Get linked clients with basic info
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name, entity_type, pan, gstin, status')
    .in('id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000'])
    .is('deleted_at', null)

  return NextResponse.json({
    success: true,
    data: { contact, clients: clients ?? [] },
  })
})
