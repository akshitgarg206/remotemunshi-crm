import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { generateOnboardingTasks } from '@/lib/tasks/generate-onboarding-tasks'

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

  // Update lead — mark converted + inactive
  await supabase
    .from('leads')
    .update({
      converted_client_id: client.id,
      converted_at: new Date().toISOString(),
      is_active: false,
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

  // Copy bundles
  const { data: leadBundles } = await supabase
    .from('lead_bundles')
    .select('bundle_id')
    .eq('lead_id', params.id)

  if (leadBundles?.length) {
    await supabase.from('client_bundles').insert(
      leadBundles.map((lb) => ({
        client_id: client.id,
        bundle_id: lb.bundle_id,
        is_active: true,
      }))
    )
  }

  // Also copy individual services from bundles for onboarding tasks
  const bundleIds = (leadBundles || []).map((lb: { bundle_id: string }) => lb.bundle_id)
  let convertedServiceIds: string[] = []
  if (bundleIds.length) {
    const { data: bundleItems } = await supabase
      .from('service_bundle_items')
      .select('service_id')
      .in('bundle_id', bundleIds)
    convertedServiceIds = [...new Set((bundleItems || []).map((bi: { service_id: string }) => bi.service_id))]
    // Also create client_services from bundle services
    if (convertedServiceIds.length) {
      await supabase.from('client_services').insert(
        convertedServiceIds.map((sid) => ({
          client_id: client.id,
          service_id: sid,
        }))
      )
    }
  }
  try {
    await generateOnboardingTasks({
      clientId: client.id,
      serviceIds: convertedServiceIds,
      employeeId: employeeId!,
      supabase,
    })
  } catch {
    // Silently continue — onboarding task failure shouldn't block lead conversion
  }

  return NextResponse.json({ success: true, data: { lead_id: params.id, client } }, { status: 201 })
}, { requirePermission: { module: 'leads', action: 'update' } })
