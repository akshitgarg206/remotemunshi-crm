import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { updateLeadSchema } from '@/lib/validators/leads'

export const GET = apiHandler(async (req, { params, supabase }) => {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_assignees(employee_id, employees(id, name, email)),
      lead_services(service_id, services(id, name)),
      lead_stages(id, name, color)
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } },
        { status: 404 }
      )
    }
    throw error
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'leads', action: 'read' } })

export const PUT = apiHandler(async (req, { params, supabase }) => {
  const body = await req.json()
  const validated = updateLeadSchema.parse(body)
  const { assignee_ids, service_ids, ...leadData } = validated

  const { data, error } = await supabase
    .from('leads')
    .update(leadData)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  if (assignee_ids !== undefined) {
    await supabase.from('lead_assignees').delete().eq('lead_id', params.id)
    if (assignee_ids.length) {
      await supabase.from('lead_assignees').insert(
        assignee_ids.map((eid) => ({ lead_id: params.id, employee_id: eid }))
      )
    }
  }

  if (service_ids !== undefined) {
    await supabase.from('lead_services').delete().eq('lead_id', params.id)
    if (service_ids.length) {
      await supabase.from('lead_services').insert(
        service_ids.map((sid) => ({ lead_id: params.id, service_id: sid }))
      )
    }
  }

  return NextResponse.json({ success: true, data })
}, { requirePermission: { module: 'leads', action: 'update' } })

export const DELETE = apiHandler(async (req, { params, supabase }) => {
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true, data: { id: params.id, deleted: true } })
}, { requirePermission: { module: 'leads', action: 'delete' } })
