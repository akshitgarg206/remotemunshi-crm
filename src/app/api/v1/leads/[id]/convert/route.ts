import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'

export const POST = apiHandler(async (req, { params, supabase, employeeId }) => {
  const body = await req.json()

  // Get lead data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (leadError || !lead) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } },
      { status: 404 }
    )
  }

  if (lead.converted_client_id) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_CONVERTED', message: 'Lead already converted' } },
      { status: 400 }
    )
  }

  // Create client from lead
  const clientData = {
    business_name: body?.client_data?.business_name || lead.business_name,
    contact_name: body?.client_data?.contact_name || lead.contact_person,
    mobile: body?.client_data?.mobile || lead.contact_no,
    email: body?.client_data?.email || lead.email,
    business_entity: body?.client_data?.business_entity || lead.business_entity,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    lead_id: lead.id,
    created_by: employeeId,
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (clientError) throw clientError

  // Update lead
  await supabase
    .from('leads')
    .update({
      converted_client_id: client.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // Copy assignees
  const { data: leadAssignees } = await supabase
    .from('lead_assignees')
    .select('employee_id')
    .eq('lead_id', params.id)

  if (leadAssignees?.length) {
    await supabase.from('client_assignees').insert(
      leadAssignees.map((la, i) => ({
        client_id: client.id,
        employee_id: la.employee_id,
        is_primary: i === 0,
      }))
    )
  }

  // Copy services
  const { data: leadServices } = await supabase
    .from('lead_services')
    .select('service_id')
    .eq('lead_id', params.id)

  if (leadServices?.length) {
    await supabase.from('client_services').insert(
      leadServices.map((ls) => ({
        client_id: client.id,
        service_id: ls.service_id,
      }))
    )
  }

  return NextResponse.json({ success: true, data: { lead_id: params.id, client } }, { status: 201 })
})
